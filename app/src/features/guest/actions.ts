"use server";
import { z } from "zod";
import { readAppSession } from "@/features/auth/session";
import { createProviderRegistry } from "@/lib/providers";

const inputSchema = z.object({
  transferId: z.uuid(),
  wardrobe: z.enum(["female", "male", "mixed"]),
  picked: z.array(z.string().max(80)).min(1).max(32),
  ownerUserId: z.uuid(),
});
export async function guestSaveSessionAction() {
  const session = await readAppSession();
  return session ? { userId: session.userId } : null;
}
export async function saveGuestProgressAction(
  value: unknown,
): Promise<{ ok: true; id: string } | { ok: false; code: string }> {
  const input = inputSchema.safeParse(value);
  if (!input.success) return { ok: false, code: "INVALID_INPUT" };
  try {
    const session = await readAppSession();
    if (!session) return { ok: false, code: "UNAUTHENTICATED" };
    if (input.data.ownerUserId !== session.userId)
      return { ok: false, code: "OWNER_MISMATCH" };
    const port = createProviderRegistry().guestProgress;
    if (!port) return { ok: false, code: "UNAVAILABLE" };
    const body = {
      transferId: input.data.transferId,
      wardrobe: input.data.wardrobe,
      picked: input.data.picked,
    };
    const saved = await port.save(session.userId, body);
    return { ok: true, id: saved.id };
  } catch (error) {
    const code =
      error instanceof Error && /CONFLICT|OWNER_MISMATCH/.test(error.message)
        ? "OWNER_MISMATCH"
        : "SAVE_FAILED";
    return { ok: false, code };
  }
}

const itemPatchSchema = z
  .object({
    status: z
      .enum(["active", "uncapsulated", "for_sale", "for_repair"])
      .optional(),
    favorite: z.boolean().optional(),
  })
  .strict()
  .refine(
    (patch) => patch.status !== undefined || patch.favorite !== undefined,
  );

export async function updateGuestItemAction(
  id: string,
  value: unknown,
): Promise<{ ok: boolean }> {
  const patch = itemPatchSchema.safeParse(value);
  if (!z.uuid().safeParse(id).success || !patch.success) return { ok: false };
  try {
    const session = await readAppSession();
    const port = createProviderRegistry().guestProgress;
    if (!session || !port) return { ok: false };
    const owned = (await port.listItems(session.userId)).some(
      (item) => item.id === id,
    );
    if (!owned) return { ok: false };
    await port.updateItem(session.userId, id, patch.data);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
