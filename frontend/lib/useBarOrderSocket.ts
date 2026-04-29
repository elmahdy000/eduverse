"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // If env var is missing, fallback to the current origin
    const envBase = process.env.NEXT_PUBLIC_API_URL;
    if (envBase) return envBase;
    
    // If we are on port 3000 (frontend), the backend is likely on 3001
    const origin = window.location.origin;
    if (origin.includes(":3000")) {
      return origin.replace(":3000", ":3001");
    }
    return origin;
  }
  return "http://localhost:3001";
};

const RAW_BASE = getBaseUrl();
// Strip /api suffix if present — Socket.IO connects to the root server, not the API prefix
const SOCKET_BASE = RAW_BASE.replace(/\/api\/?$/, "");
const SOCKET_URL = SOCKET_BASE + "/bar-orders";

/**
 * Global singleton socket — NEVER disconnect it so all pages share one live connection.
 */
let globalSocket: Socket | null = null;

function getOrCreateSocket(): Socket {
  if (!globalSocket || globalSocket.disconnected) {
    console.log("[Socket.IO] 🔌 Connecting to:", SOCKET_URL);
    globalSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 10000,
    });

    globalSocket.on("connect", () => {
      console.log("[Socket.IO] ✅ Connected:", globalSocket?.id);
      globalSocket?.emit("chat:ping");
    });

    globalSocket.on("chat:pong", (data) => {
      console.log("[Socket.IO] 🏓 Pong received:", data);
    });

    globalSocket.on("disconnect", (reason) => {
      console.log("[Socket.IO] ❌ Disconnected:", reason);
    });

    globalSocket.on("connect_error", (err) => {
      console.log("[Socket.IO] ⚠️ Connection error:", err.message);
    });
  }

  // Make sure it's connected
  if (!globalSocket.connected) {
    globalSocket.connect();
  }

  return globalSocket;
}

/**
 * Hook: useBarOrderSocket
 *
 * Connects to the bar-orders WebSocket namespace and lets you
 * subscribe to real-time events:
 *   - `order:new`            → a new order was created
 *   - `order:status-updated` → an order's status changed
 *   - `dashboard:refresh`    → signal to refetch dashboard data
 */
export function useBarOrderSocket(handlers: {
  onNewOrder?: (order: any) => void;
  onStatusUpdate?: (order: any) => void;
  onDashboardRefresh?: () => void;
  onChatMessage?: (message: { orderId: string, sender: string, text: string, timestamp: string }) => void;
  onConnect?: () => void;
}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket = getOrCreateSocket();

    const onConn = () => {
      console.log("[Socket.IO] 🔌 Socket connected");
      handlersRef.current.onConnect?.();
    };
    const onNew = (order: any) => {
      console.log("[Socket.IO] 📦 order:new received");
      handlersRef.current.onNewOrder?.(order);
    };
    const onUpdate = (order: any) => {
      console.log("[Socket.IO] 🔄 order:status-updated received");
      handlersRef.current.onStatusUpdate?.(order);
    };
    const onRefresh = () => {
      console.log("[Socket.IO] 🔁 dashboard:refresh received");
      handlersRef.current.onDashboardRefresh?.();
    };
    const onChat = (msg: any) => {
      console.log("[Socket.IO] 💬 chat:message received");
      handlersRef.current.onChatMessage?.(msg);
    };

    socket.on("connect", onConn);
    socket.on("order:new", onNew);
    socket.on("order:status-updated", onUpdate);
    socket.on("dashboard:refresh", onRefresh);
    socket.on("chat:message", onChat);

    // If already connected, trigger onConnect once
    if (socket.connected) onConn();

    return () => {
      socket.off("connect", onConn);
      socket.off("order:new", onNew);
      socket.off("order:status-updated", onUpdate);
      socket.off("dashboard:refresh", onRefresh);
      socket.off("chat:message", onChat);
    };
  }, []);

  return {
    sendMessage: (orderId: string, sender: string, text: string) => {
      const socket = getOrCreateSocket();
      socket.emit("chat:send", { orderId, sender, text });
    }
  };
}
