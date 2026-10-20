import { catalogFor } from "./catalog";
import { evaluate } from "./outfits";
import type { GuestSaveInput } from "@/lib/providers/contracts";

const KEY = "cz-guest-save-v1";
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export interface GuestSaveIntent extends GuestSaveInput {
  ownerUserId?: string;
}
export function readGuestIntent(): GuestSaveIntent | null {
  const raw = localStorage.getItem(KEY);
  let value: unknown;
  try {
    value = JSON.parse(raw ?? "null");
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const input = value as Partial<GuestSaveIntent>;
  if (
    typeof input.transferId !== "string" ||
    !UUID.test(input.transferId) ||
    !["female", "male", "mixed"].includes(input.wardrobe ?? "") ||
    !Array.isArray(input.picked) ||
    input.picked.some((id) => typeof id !== "string")
  )
    return null;
  if (
    input.ownerUserId !== undefined &&
    (typeof input.ownerUserId !== "string" || !UUID.test(input.ownerUserId))
  )
    return null;
  const pool = catalogFor(input.wardrobe!);
  const items = input.picked.map((id) => pool.find((item) => item.id === id));
  if (
    items.some((item) => !item) ||
    new Set(input.picked).size !== input.picked.length ||
    !evaluate(items.filter((item) => item !== undefined)).count
  )
    return null;
  return {
    transferId: input.transferId,
    wardrobe: input.wardrobe!,
    picked: [...input.picked],
    ...(input.ownerUserId ? { ownerUserId: input.ownerUserId } : {}),
  };
}
export function createGuestIntent(input: Omit<GuestSaveInput, "transferId">) {
  const existing = readGuestIntent();
  // Retry the immutable request after a missing acknowledgement; never substitute a new body.
  if (
    existing &&
    existing.wardrobe === input.wardrobe &&
    existing.picked.join() === input.picked.join()
  )
    return existing;
  const value: GuestSaveIntent = {
    ...input,
    picked: [...input.picked],
    transferId: crypto.randomUUID(),
  };
  localStorage.setItem(KEY, JSON.stringify(value));
  return value;
}
export function bindGuestIntent(
  userId: string,
  expectedTransferId: string,
): GuestSaveIntent {
  const value = readGuestIntent();
  if (!value) throw new Error("NO_INTENT");
  if (value.transferId !== expectedTransferId)
    throw new Error("INTENT_CHANGED");
  if (value.ownerUserId && value.ownerUserId !== userId)
    throw new Error("OWNER_MISMATCH");
  const bound = { ...value, ownerUserId: userId };
  localStorage.setItem(KEY, JSON.stringify(bound));
  return bound;
}
export function clearGuestIntent(transferId?: string) {
  if (!transferId || readGuestIntent()?.transferId === transferId)
    localStorage.removeItem(KEY);
}

export function clearSavedGuestDraft(intent: GuestSaveIntent) {
  const raw = localStorage.getItem("cz-guest-v1");
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    if (
      draft.wardrobe === intent.wardrobe &&
      Array.isArray(draft.picked) &&
      draft.picked.join() === intent.picked.join()
    )
      localStorage.removeItem("cz-guest-v1");
  } catch {
    /* a newer malformed guest draft is not part of this transaction */
  }
}
