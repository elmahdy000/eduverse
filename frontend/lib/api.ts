import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiSuccess, AuthPayload } from "./types";
import { useAuthStore } from "../store/auth-store";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const baseURL = rawBaseUrl.endsWith("/api") ? rawBaseUrl : `${rawBaseUrl}/api`;

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshingPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, clearAuth, setAuth, user } = useAuthStore.getState();
  if (!refreshToken) {
    clearAuth();
    return null;
  }

  try {
    const response = await axios.post<ApiSuccess<AuthPayload>>(`${baseURL}/auth/refresh`, {
      refreshToken,
    });

    const payload = response.data.data;
    if (!payload?.accessToken || !payload?.user) {
      clearAuth();
      return null;
    }

    setAuth({
      accessToken: payload.accessToken,
      refreshToken,
      user: payload.user ?? user!,
    });

    return payload.accessToken;
  } catch {
    clearAuth();
    return null;
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshingPromise) {
      refreshingPromise = refreshAccessToken().finally(() => {
        refreshingPromise = null;
      });
    }

    const newToken = await refreshingPromise;

    if (!newToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return api.request(originalRequest);
  },
);

export function roleHomePath(roleName?: string | null) {
  switch (roleName) {
    case "Owner":
      return "/dashboard/owner";
    case "Operations Manager":
      return "/dashboard/operations-manager";
    case "Receptionist":
      return "/dashboard/reception";
    case "Barista":
      return "/dashboard/barista";
    default:
      return "/dashboard";
  }
}

export function roleLabel(roleName?: string | null) {
  switch (roleName) {
    case "Owner":
      return "المالك";
    case "Operations Manager":
      return "مدير العمليات";
    case "Receptionist":
      return "موظف الاستقبال";
    case "Barista":
      return "الباريستا";
    default:
      return "مستخدم";
  }
}
