import type { KyResponse } from "ky";
import { authClient, clearTokens, refreshAccessToken } from "./client";
import type { ApiResponse } from "./client";
import { AuthError } from "./errors";

export async function handleResponse<T>(res: KyResponse): Promise<T | null> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (res.ok && res.status === 204) {
    return null;
  }

  if (!isJson) {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return null;
  }

  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message);
  return json.data;
}

export async function handleResponseWithAuth<T>(
  res: KyResponse,
  retryCount = 0,
): Promise<T | null> {
  if (res.status === 401 && retryCount === 0) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryRes = await authClient.get(res.url.split("/api/")[1] || "", {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      return handleResponseWithAuth<T>(retryRes, retryCount + 1);
    }
    clearTokens();
    throw new AuthError("TOKEN_REFRESH_FAILED", "Token refresh failed");
  }

  return handleResponse<T>(res);
}
