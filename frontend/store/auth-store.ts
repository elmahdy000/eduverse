"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "../lib/types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (params: {
    accessToken: string;
    refreshToken?: string;
    user: AuthUser;
  }) => void;
  updateAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: ({ accessToken, refreshToken, user }) =>
        set((state) => ({
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
          user,
          isAuthenticated: true,
        })),
      updateAccessToken: (accessToken) => set({ accessToken, isAuthenticated: true }),
      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "eduvers-auth",
    },
  ),
);
