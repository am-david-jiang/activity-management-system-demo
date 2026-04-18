import { publicClient, authClient } from "./client";
import { handleResponse } from "./response";

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

export interface RegisterDto {
  email: string;
  name: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export async function login(data: LoginDto): Promise<AuthResponse> {
  const res = await publicClient.post("auth/login", { json: data });
  return handleResponse<AuthResponse>(res) as Promise<AuthResponse>;
}

export async function register(data: RegisterDto): Promise<AuthResponse> {
  const res = await publicClient.post("auth/register", { json: data });
  return handleResponse<AuthResponse>(res) as Promise<AuthResponse>;
}

export async function logout(): Promise<void> {
  await authClient.post("auth/logout");
}

export async function refreshToken(data: RefreshTokenDto): Promise<AuthResponse> {
  const res = await publicClient.post("auth/refresh", { json: data });
  return handleResponse<AuthResponse>(res) as Promise<AuthResponse>;
}
