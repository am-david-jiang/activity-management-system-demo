"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { login as apiLogin, logout as apiLogout, register as apiRegister, type AuthUser } from "@/lib/api/auth-api";

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = "auth_tokens";

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

function getStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as StoredAuth;
  } catch {
    return null;
  }
}

function setStoredAuth(auth: StoredAuth): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = getStoredAuth();
    return stored?.user ?? null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    const stored = getStoredAuth();
    return stored?.accessToken ?? null;
  });

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiLogin({ email, password });
    setStoredAuth({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
    });
    setUser(response.user);
    setAccessToken(response.accessToken);
  }, []);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const response = await apiRegister({ email, name, password });
    setStoredAuth({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
    });
    setUser(response.user);
    setAccessToken(response.accessToken);
  }, []);

  const logout = useCallback(async () => {
    const token = accessToken;
    clearStoredAuth();
    setUser(null);
    setAccessToken(null);
    if (token) {
      try {
        await apiLogout(token);
      } catch {
        // Ignore logout API errors
      }
    }
  }, [accessToken]);

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading: false, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}