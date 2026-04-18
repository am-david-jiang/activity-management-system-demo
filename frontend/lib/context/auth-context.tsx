"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import {
  login as apiLogin,
  logout as apiLogout,
  refreshToken,
  register as apiRegister,
  type AuthUser,
} from "@/lib/api/auth-api";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
}

type AuthAction =
  | { type: "INIT_SUCCESS"; user: AuthUser; accessToken: string }
  | { type: "INIT_FAILURE" }
  | {
      type: "LOGIN_SUCCESS";
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
    }
  | { type: "LOGOUT" };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "INIT_SUCCESS":
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.user,
        accessToken: action.accessToken,
        isLoading: false,
      };
    case "INIT_FAILURE":
    case "LOGOUT":
      return {
        user: null,
        accessToken: null,
        isLoading: false,
      };
    default:
      return state;
  }
}

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const REFRESH_TOKEN_KEY = "auth_refresh_token";
const ACCESS_TOKEN_KEY = "auth_access_token";

function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

function clearStoredRefreshToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function setStoredAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

function clearStoredAccessToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: true,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(authReducer, initialState);
  const initRef = useRef(false);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore logout API errors
    } finally {
      clearStoredRefreshToken();
      clearStoredAccessToken();
      dispatch({ type: "LOGOUT" });
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const storedRefreshToken = getStoredRefreshToken();
    if (!storedRefreshToken) {
      dispatch({ type: "INIT_FAILURE" });
      return;
    }

    refreshToken({ refreshToken: storedRefreshToken })
      .then((response) => {
        setStoredRefreshToken(response.refreshToken);
        setStoredAccessToken(response.accessToken);
        dispatch({
          type: "INIT_SUCCESS",
          user: response.user,
          accessToken: response.accessToken,
        });
      })
      .catch(() => {
        clearStoredRefreshToken();
        dispatch({ type: "INIT_FAILURE" });
        router.push("/login");
      });
  }, [router]);

  const login = useCallback(async (email: string, password: string) => {
    console.debug("[login callback]");
    const response = await apiLogin({ email, password });
    setStoredRefreshToken(response.refreshToken);
    setStoredAccessToken(response.accessToken);
    dispatch({
      type: "LOGIN_SUCCESS",
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
  }, []);

  const register = useCallback(
    async (email: string, name: string, password: string) => {
      const response = await apiRegister({ email, name, password });
      setStoredRefreshToken(response.refreshToken);
      setStoredAccessToken(response.accessToken);
      dispatch({
        type: "LOGIN_SUCCESS",
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        accessToken: state.accessToken,
        isLoading: state.isLoading,
        isAuthenticated: !!state.accessToken && !!state.user,
        login,
        register,
        logout,
      }}
    >
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
