import { catalogFor, type GuestWardrobe } from "./catalog";
import { evaluate } from "./outfits";

export type Step = "type" | "items" | "result";
interface GuestState {
  step: Step;
  wardrobe: GuestWardrobe | null;
  picked: string[];
}
export const EMPTY: GuestState = { step: "type", wardrobe: null, picked: [] };

// Persisted browser input is untrusted, including earlier versions of this flow.
export function loadGuestState(): GuestState {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has("fresh")) {
      window.localStorage.removeItem("cz-guest-v1");
      url.searchParams.delete("fresh");
      window.history.replaceState(
        null,
        "",
        url.pathname + url.search + url.hash,
      );
      return EMPTY;
    }
    const value: unknown = JSON.parse(
      window.localStorage.getItem("cz-guest-v1") ?? "null",
    );
    if (!value || typeof value !== "object" || !("wardrobe" in value))
      return EMPTY;
    const wardrobe = value.wardrobe;
    if (wardrobe !== "female" && wardrobe !== "male" && wardrobe !== "mixed")
      return EMPTY;
    if (!("picked" in value) || !Array.isArray(value.picked)) return EMPTY;
    const ids: unknown[] = value.picked;
    const pool = catalogFor(wardrobe);
    const picked = [...new Set(ids)].flatMap((id) =>
      pool.filter((item) => item.id === id),
    );
    const step =
      "step" in value && value.step === "type"
        ? "type"
        : "step" in value &&
            value.step === "result" &&
            evaluate(picked).count > 0
          ? "result"
          : "items";
    return { step, wardrobe, picked: picked.map((item) => item.id) };
  } catch {
    return EMPTY;
  }
}
