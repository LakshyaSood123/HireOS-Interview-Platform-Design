/**
 * Every error the API can return, with its HTTP status.
 *
 * Contract: docs/03-API-CONTRACT.md — "Shared rules".
 * `ALREADY_COMPLETED`, `COMPILE_ERROR` and `EXECUTION_TIMEOUT` are deliberately
 * absent: they are not HTTP errors, they come back inside a 200 response body.
 */
export const ERROR_STATUS = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  EMAIL_ALREADY_REGISTERED: 409,
  MODULE_LOCKED: 409,
  CHECKPOINT_LOCKED: 409,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  RUNNER_UNAVAILABLE: 503,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export type ErrorDetails = Record<string, unknown>;

/** An error that is safe to show a client: its code, message and details are returned as-is. */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: ErrorDetails;

  constructor(code: ErrorCode, message: string, details?: ErrorDetails) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = ERROR_STATUS[code];
    if (details !== undefined) this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static unauthenticated(message = "Authentication required.", details?: ErrorDetails): ApiError {
    return new ApiError("UNAUTHENTICATED", message, details);
  }

  static forbidden(message = "You do not have access to this resource."): ApiError {
    return new ApiError("FORBIDDEN", message);
  }

  static notFound(message = "Not found."): ApiError {
    return new ApiError("NOT_FOUND", message);
  }

  static validation(message = "The request is invalid.", details?: ErrorDetails): ApiError {
    return new ApiError("VALIDATION_ERROR", message, details);
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
