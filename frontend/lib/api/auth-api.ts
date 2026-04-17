const API_BASE = "http://localhost:8000/api";

interface ApiResponse<T> {
  code: number;
  success: boolean;
  data: T | null;
  message: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

async function handleResponse<T>(res: globalThis.Response): Promise<T | null> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!isJson) {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return null;
  }

  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message);
  return json.data;
}

export async function login(data: LoginDto): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return (await handleResponse<AuthResponse>(res)) as AuthResponse;
}

export async function logout(accessToken: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`HTTP ${res.status}`);
  }
}