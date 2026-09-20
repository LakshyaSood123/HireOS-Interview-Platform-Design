import type { ApiError } from "../shared/errors.js";
import type { UserRole } from "../modules/auth/user.model.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      /** Set by `attachAuth`. The only source of identity in the app. */
      auth?: { userId: string; role: UserRole };
      /** Why `attachAuth` rejected a presented token; re-thrown by `requireAuth`. */
      authError?: ApiError;
      /** Set by `validate()`. Parsed and typed input, never the raw request. */
      validated: {
        body?: unknown;
        params?: unknown;
        query?: unknown;
      };
    }
  }
}

export {};
