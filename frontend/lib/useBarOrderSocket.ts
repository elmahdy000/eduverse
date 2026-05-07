"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    const envBase = process.env.NEXT_PUBLIC_API_URL;
    if (envBase) return envBase;

    const origin = window.location.origin;
    if (origin.includes(":3000")) {
      return origin.replace(":3000", ":3001");
    }
    return origin;
  }
  return "http://localhost:3001";
};

const RAW_BASE = getBaseUrl();
const SOCKET_BASE = RAW_BASE.replace(/\/api\/?$/, "");
const SOCKET_URL = SOCKET_BASE + "/bar-orders";

let globalSocket: Socket | null = null;

function getOrCreateSocket(): Socket {
  if (!globalSocket || globalSocket.disconnected) {
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
      globalSocket?.emit("chat:ping");
    });
  }

  if (!globalSocket.connected) {
    globalSocket.connect();
  }

  return globalSocket;
}

export function useBarOrderSocket(handlers: {
  onNewOrder?: (order: any) => void;
  onStatusUpdate?: (order: any) => void;
  onDashboardRefresh?: () => void;
  onChatMessage?: (message: { orderId: string; sender: string; text: string; timestamp: string }) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket = getOrCreateSocket();

    const onConn = () => {
      handlersRef.current.onConnect?.();
    };
    const onDisconn = () => {
      handlersRef.current.onDisconnect?.();
    };
    const onNew = (order: any) => {
      handlersRef.current.onNewOrder?.(order);
    };
    const onUpdate = (order: any) => {
      handlersRef.current.onStatusUpdate?.(order);
    };
    const onRefresh = () => {
      handlersRef.current.onDashboardRefresh?.();
    };
    const onChat = (msg: any) => {
      handlersRef.current.onChatMessage?.(msg);
    };

    socket.on("connect", onConn);
    socket.on("disconnect", onDisconn);
    socket.on("order:new", onNew);
    socket.on("order:status-updated", onUpdate);
    socket.on("dashboard:refresh", onRefresh);
    socket.on("chat:message", onChat);

    if (socket.connected) onConn();

    return () => {
      socket.off("connect", onConn);
      socket.off("disconnect", onDisconn);
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
    },
  };
}
