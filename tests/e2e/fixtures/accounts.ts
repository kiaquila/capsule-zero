/**
 * Shared account fixtures for the auth specs: unique per-run addresses and
 * the passwords the scenarios rotate through. Mock-provider deterministic
 * values (code, wrong-password sentinel) are documented in spec 035.
 */
export function uniqueEmail(prefix: string): string {
  return `e2e+${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export const PASSWORDS = {
  initial: "SuperSecret123",
  changed: "NewSecret456",
} as const;

/** One-time code every mock recovery/verification accepts (spec 035). */
export const MOCK_ONE_TIME_CODE = "123456";

/** Current password the mock change-password always rejects (spec 035). */
export const MOCK_WRONG_CURRENT_PASSWORD = "WrongPass123";
