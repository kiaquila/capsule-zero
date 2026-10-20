"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { MyItemsEntry } from "@/components/my-items/my-items-data";
import type { ItemStatus } from "@/lib/providers";
import { updateGuestItemAction } from "@/features/guest/actions";

/** Persist only imported guest records; the remaining domains retain their existing adapters. */
export function useGuestItemMutation(
  setNotice: (value: string | null) => void,
) {
  const t = useTranslations("guest");
  const pending = useRef(new Set<string>());
  const [busy, setBusy] = useState<string[]>([]);

  async function persistGuestItem(
    item: MyItemsEntry,
    patch: { status?: ItemStatus; favorite?: boolean },
  ) {
    if (!item.guestPresetId) return true;
    if (pending.current.has(item.id)) return false;
    pending.current.add(item.id);
    setBusy([...pending.current]);
    setNotice(null);
    try {
      const result = await updateGuestItemAction(item.id, patch);
      if (!result.ok) throw new Error("UPDATE_FAILED");
      return true;
    } catch {
      setNotice(t("itemUpdateError"));
      return false;
    } finally {
      pending.current.delete(item.id);
      setBusy([...pending.current]);
    }
  }
  return {
    persistGuestItem,
    isGuestItemPending: (id: string) => busy.includes(id),
  };
}
