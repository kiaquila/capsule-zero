// Machine-readable auth error codes shared by the Go API, the providers, and
// the UI (spec 035). Providers throw `Error("<CODE>: <english message>")`;
// server actions extract the code; the UI maps the code to a localized
// message via the `auth.errors.*` i18n keys — raw provider English is never
// shown to the user.

const KNOWN_AUTH_ERROR_CODES = [
  "INVALID_CODE",
  "INVALID_CURRENT_PASSWORD",
  "UNAUTHENTICATED",
  "RATE_LIMITED",
  "VALIDATION_ERROR",
  "INTERNAL_ERROR",
] as const;

export type AuthErrorCode = (typeof KNOWN_AUTH_ERROR_CODES)[number];

export interface AuthActionFailure {
  code?: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Split a provider error into its machine code and human-readable remainder. */
export function authActionFailure(error: unknown): AuthActionFailure {
  const raw =
    error instanceof Error && error.message.trim() ? error.message : "";
  const match = raw.match(/^([A-Z_]+):\s*/);
  const message =
    raw.replace(/^[A-Z_]+:\s*/, "").trim() ||
    "Authentication failed. Please try again.";
  const details =
    error instanceof Error &&
    "details" in error &&
    isRecord(error.details)
      ? error.details
      : undefined;
  return { code: match?.[1], message, details };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

/**
 * i18n sub-key (relative to the `auth` namespace) for an error code. Unknown
 * or missing codes collapse to the generic localized message.
 */
export function authErrorMessageKey(code?: string): string {
  if (
    code &&
    (KNOWN_AUTH_ERROR_CODES as readonly string[]).includes(code)
  ) {
    return `errors.${code}`;
  }
  return "errors.default";
}
