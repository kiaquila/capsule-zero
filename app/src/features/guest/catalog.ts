import catalogData from "./catalog-data.json";

// Каталог гостевого онбординга: базовые вещи, которые человек отмечает галочкой («у меня есть похожее»).
// Картинки — собственные сгенерированные вырезки (public/catalog/*.webp), цвет — id из colors.md.

export type GuestWardrobe = "female" | "male" | "mixed";
export type GuestRole = "top" | "bottom" | "dress" | "shoes" | "bag";

export interface GuestItem {
  id: string;
  wardrobe: GuestWardrobe;
  role: GuestRole;
  colorId: string;
  categoryId: string;
  name: { ru: string; en: string };
}

// Canonical preset attributes, shared with the Go allowlist by the contract check.
export const GUEST_CATALOG = catalogData as GuestItem[];

export const ROLE_ORDER: GuestRole[] = [
  "top",
  "bottom",
  "dress",
  "shoes",
  "bag",
];

// HEX из colors.md — для цветной точки на карточке.
export const COLOR_HEX: Record<string, string> = {
  A1: "#1C1C1C",
  A2: "#8C8C8C",
  A3: "#FFFFFF",
  B1: "#E82535",
  P1: "#F5B5BB",
  P3: "#E8D5B5",
  P9: "#B0CDEE",
  D3: "#C08A65",
  D4: "#C0A268",
  D9: "#5082B8",
  K1: "#8C1820",
  K2: "#8C3015",
  K3: "#8C5018",
  K9: "#182878",
};

export const imageOf = (id: string) => `/catalog/${id}.webp`;

export const catalogFor = (wardrobe: GuestWardrobe) =>
  GUEST_CATALOG.filter(
    (entry) => wardrobe === "mixed" || entry.wardrobe === wardrobe,
  );

export const findItem = (id: string) =>
  GUEST_CATALOG.find((entry) => entry.id === id);
