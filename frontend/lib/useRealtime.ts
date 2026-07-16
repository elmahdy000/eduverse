"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth-store";

/**
 * useRealtime
 * -----------------------------------------------------------------------------
 * hook عام بيتصل بـ namespace /realtime في الباك ويستمع لإشارات التغيير
 * (session/invoice/booking/shift/room) وبيعمل invalidate تلقائي للـ queries
 * المتأثرة — عشان أي واجهة مفتوحة تتحدّث لحظياً بدون refresh يدوي.
 *
 * الاستخدام: نادِه مرة واحدة في أي صفحة/شل محمي:
 *   useRealtime();
 * ممكن تمرّر onEvent لو عايز تتفاعل مع حدث معيّن يدوياً.
 */

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    const envBase = process.env.NEXT_PUBLIC_API_URL;
    if (envBase) return envBase;
    const origin = window.location.origin;
    if (origin.includes(":3000")) return origin.replace(":3000", ":3001");
    return origin;
  }
  return "http://localhost:3001";
};

const RAW_BASE = getBaseUrl();
const SOCKET_BASE = RAW_BASE.replace(/\/api\/?$/, "");
const SOCKET_URL = SOCKET_BASE + "/realtime";

let globalSocket: Socket | null = null;

function getOrCreateSocket(): Socket {
  if (!globalSocket || globalSocket.disconnected) {
    globalSocket = io(SOCKET_URL, {
      auth: { token: useAuthStore.getState().accessToken },
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 10000,
    });
  }
  if (!globalSocket.connected) globalSocket.connect();
  return globalSocket;
}

type RealtimeEvent =
  | "session:changed"
  | "invoice:changed"
  | "booking:changed"
  | "shift:changed"
  | "room:changed";

export function useRealtime(opts?: {
  onEvent?: (event: RealtimeEvent, payload: any) => void;
}) {
  const queryClient = useQueryClient();
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const socket = getOrCreateSocket();

    const inv = (keys: string[][]) =>
      keys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));

    const onSession = (payload: any) => {
      inv([["sessions"], ["invoices"], ["dashboard"], ["customers"], ["rooms"]]);
      optsRef.current?.onEvent?.("session:changed", payload);
    };
    const onInvoice = (payload: any) => {
      inv([["invoices"], ["payments"], ["sessions"], ["dashboard"]]);
      optsRef.current?.onEvent?.("invoice:changed", payload);
    };
    const onBooking = (payload: any) => {
      inv([["bookings"], ["rooms"], ["dashboard"]]);
      optsRef.current?.onEvent?.("booking:changed", payload);
    };
    const onShift = (payload: any) => {
      inv([["shifts"], ["dashboard"]]);
      optsRef.current?.onEvent?.("shift:changed", payload);
    };
    const onRoom = (payload: any) => {
      inv([["rooms"], ["dashboard"]]);
      optsRef.current?.onEvent?.("room:changed", payload);
    };

    socket.on("session:changed", onSession);
    socket.on("invoice:changed", onInvoice);
    socket.on("booking:changed", onBooking);
    socket.on("shift:changed", onShift);
    socket.on("room:changed", onRoom);

    return () => {
      socket.off("session:changed", onSession);
      socket.off("invoice:changed", onInvoice);
      socket.off("booking:changed", onBooking);
      socket.off("shift:changed", onShift);
      socket.off("room:changed", onRoom);
    };
  }, [queryClient]);
}
