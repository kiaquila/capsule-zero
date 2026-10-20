import "server-only";
import { randomUUID } from "node:crypto";
import { catalogFor } from "@/features/guest/catalog";
import { evaluate } from "@/features/guest/outfits";
import type {
  GuestProgressPort,
  SavedGuest,
  SavedGuestItem,
} from "../contracts";

type Store = {
  collections: Map<string, { userId: string; value: SavedGuest }>;
  items: Map<string, SavedGuestItem>;
};
const runtime = globalThis as typeof globalThis & { capsuleGuestStore?: Store };
// Fixture-mode server persistence only; production uses the Go/Postgres port.
const store: Store = (runtime.capsuleGuestStore ??= {
  collections: new Map(),
  items: new Map(),
});
const copy = <T>(value: T): T => structuredClone(value);

export function createMockGuestProgress(): GuestProgressPort {
  return {
    async save(userId, input) {
      const pool = catalogFor(input.wardrobe);
      const items = [...new Set(input.picked)].map((id) =>
        pool.find((item) => item.id === id),
      );
      if (
        !items.length ||
        items.some((item) => !item) ||
        !evaluate(items.filter((item) => item !== undefined)).count
      )
        throw new Error("VALIDATION_ERROR");
      const existing = store.collections.get(input.transferId);
      if (existing) {
        if (
          existing.userId !== userId ||
          existing.value.wardrobe !== input.wardrobe ||
          existing.value.items.map((item) => item.id).join() !==
            input.picked.join()
        )
          throw new Error("CONFLICT");
        return copy(existing.value);
      }
      const now = new Date().toISOString();
      const value: SavedGuest = {
        id: randomUUID(),
        transferId: input.transferId,
        wardrobe: input.wardrobe,
        algorithmVersion: "guest-v1",
        items: items.filter((item) => item !== undefined),
        createdAt: now,
      };
      for (const preset of value.items) {
        if (
          [...store.items.values()].some(
            (item) => item.userId === userId && item.preset.id === preset.id,
          )
        )
          continue;
        const id = randomUUID();
        store.items.set(id, {
          id,
          userId,
          preset: copy(preset),
          status: "uncapsulated",
          favorite: false,
          createdAt: now,
          updatedAt: now,
        });
      }
      store.collections.set(input.transferId, { userId, value: copy(value) });
      return copy(value);
    },
    async list(userId) {
      return [...store.collections.values()]
        .filter((entry) => entry.userId === userId)
        .map((entry) => copy(entry.value));
    },
    async get(userId, id) {
      return copy(
        [...store.collections.values()].find(
          (entry) => entry.userId === userId && entry.value.id === id,
        )?.value ?? null,
      );
    },
    async listItems(userId) {
      return [...store.items.values()]
        .filter((item) => item.userId === userId)
        .map(copy);
    },
    async updateItem(userId, id, input) {
      const item = store.items.get(id);
      if (!item || item.userId !== userId) throw new Error("NOT_FOUND");
      const updated = {
        ...item,
        ...input,
        updatedAt: new Date().toISOString(),
      };
      store.items.set(id, updated);
      return copy(updated);
    },
  };
}
