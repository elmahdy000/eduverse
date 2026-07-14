/**
 * Owner Portal API Client
 * -----------------------------------------------------------------------------
 * - يقرأ الـ token من localStorage
 * - يعالج انتهاء صلاحية الـ token (401) بإلغاء الجلسة وتحويل المستخدم لتسجيل الدخول
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

const TOKEN_KEY = "op_access_token";
const REFRESH_KEY = "op_refresh_token";
const USER_KEY = "op_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(accessToken: string, refreshToken: string, user: any) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): any | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

class ApiError extends Error {
  status: number;
  data?: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    // Session expired — redirect to login
    clearSession();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError(401, "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى");
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (typeof data === "object" && (data?.message || data?.error)) ||
      `فشل الطلب: ${res.status}`;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

export const api = {
  get: <T = any>(path: string) => request<T>(path, { method: "GET" }),
  post: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
};

export async function login(email: string, password: string) {
  const res: any = await api.post("/auth/login", { email, password });
  const data = res?.data ?? res;
  if (!data?.accessToken) throw new Error("رد غير صالح من الخادم");

  // تحقق: لا نسمح إلا لحسابات OwnerPortal بالدخول لهذه البوابة
  const roleName = data?.user?.role?.name;
  if (roleName !== "OwnerPortal") {
    throw new Error("هذا الحساب غير مصرّح له بالوصول لبوابة أصحاب المشروع");
  }

  setSession(data.accessToken, data.refreshToken, data.user);
  return data.user;
}

export async function logout() {
  clearSession();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

// ---------------------------------------------------------------------------
// Reports helpers
// ---------------------------------------------------------------------------

function qs(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.append(key, value);
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

export const reports = {
  kpis: (fromDate?: string, toDate?: string) =>
    api.get(`/owner-portal/kpis${qs({ fromDate, toDate })}`),
  revenue: (fromDate?: string, toDate?: string) =>
    api.get(`/owner-portal/revenue${qs({ fromDate, toDate })}`),
  expenses: (fromDate?: string, toDate?: string) =>
    api.get(`/owner-portal/expenses${qs({ fromDate, toDate })}`),
  profit: (fromDate?: string, toDate?: string) =>
    api.get(`/owner-portal/profit${qs({ fromDate, toDate })}`),
  bar: (fromDate?: string, toDate?: string) =>
    api.get(`/owner-portal/bar${qs({ fromDate, toDate })}`),
  inventory: (fromDate?: string, toDate?: string) =>
    api.get(`/owner-portal/inventory${qs({ fromDate, toDate })}`),
};
