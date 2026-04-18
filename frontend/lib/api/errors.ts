export class AuthError extends Error {
  type: "TOKEN_REFRESH_FAILED" | "UNAUTHORIZED";

  constructor(type: "TOKEN_REFRESH_FAILED" | "UNAUTHORIZED", message: string) {
    super(message);
    this.name = "AuthError";
    this.type = type;
  }
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}
