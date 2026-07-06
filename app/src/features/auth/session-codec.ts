const SESSION_COOKIE_VERSION = "v1";
const LOCAL_SESSION_SIGNING_SECRET = "capsule-zero-local-session-secret";

export interface PersistedAppSession {
  userId: string;
  email: string;
  name?: string;
  accessToken?: string;
  refreshToken?: string;
  createdAt?: string;
  expiresAt: string;
  /** Pending after-sign-up email verification flow (spec 035). */
  verificationFlowId?: string;
  /** Last known email verification state (spec 035); live whoami wins. */
  emailVerified?: boolean;
}

export async function serializeSignedSession(
  value: PersistedAppSession,
): Promise<string> {
  const payload = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify(value)),
  );
  const signature = await signSessionPayload(payload);
  return `${SESSION_COOKIE_VERSION}.${payload}.${signature}`;
}

export async function parseSignedSession(
  rawValue: string,
): Promise<PersistedAppSession | null> {
  const parts = rawValue.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [version, payload, signature] = parts;
  if (version !== SESSION_COOKIE_VERSION || !payload || !signature) {
    return null;
  }

  if (!(await verifySessionSignature(payload, signature))) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payload)),
    ) as PersistedAppSession;
    return validatePersistedSession(parsed);
  } catch {
    return null;
  }
}

export function parseLegacySession(rawValue: string): PersistedAppSession | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as PersistedAppSession;
    return validatePersistedSession(parsed);
  } catch {
    return null;
  }
}

export function validatePersistedSession(
  parsed: PersistedAppSession,
): PersistedAppSession | null {
  const expiresAt = Date.parse(parsed.expiresAt);
  if (
    !parsed.email ||
    !parsed.userId ||
    !Number.isFinite(expiresAt) ||
    (expiresAt < Date.now() && !parsed.refreshToken)
  ) {
    return null;
  }
  return parsed;
}

async function signSessionPayload(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSigningSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );

  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifySessionSignature(
  payload: string,
  signature: string,
): Promise<boolean> {
  const expected = await signSessionPayload(payload);
  return timingSafeEqualString(signature, expected);
}

function sessionSigningSecret(): string {
  const configuredSecret = process.env.SESSION_SIGNING_SECRET?.trim();
  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_SESSION_SIGNING_SECRET;
  }

  throw new Error(
    "CONFIGURATION_ERROR: SESSION_SIGNING_SECRET is required to sign Capsule Zero sessions.",
  );
}

function timingSafeEqualString(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
