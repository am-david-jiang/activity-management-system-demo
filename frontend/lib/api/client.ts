import ky from "ky";

const API_BASE = "http://localhost:8000/api/";

const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";

export interface ApiResponse<T> {
  code: number;
  success: boolean;
  data: T | null;
  message: string;
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await ky.post(`${API_BASE}/auth/refresh`, {
      json: { refreshToken },
      headers: { "Content-Type": "application/json" },
    });

    const json: ApiResponse<{
      accessToken: string;
      refreshToken: string;
    }> = await res.clone().json();

    if (!json.success || !json.data) return null;

    setRefreshToken(json.data.refreshToken);
    setAccessToken(json.data.accessToken);
    return json.data.accessToken;
  } catch {
    return null;
  }
}

function createAuthHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const publicClient = ky.create({
  baseUrl: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authClient = ky.create({
  baseUrl: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const headers = createAuthHeader();
        for (const [key, value] of Object.entries(headers)) {
          request.headers.set(key, value);
        }
      },
    ],
  },
});

export { API_BASE };
