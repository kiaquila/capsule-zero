// Каталог гостевого онбординга: базовые вещи, которые человек отмечает галочкой («у меня есть похожее»).
// Картинки — собственные сгенерированные вырезки (public/catalog/*.webp), цвет — id из colors.md.

export type GuestWardrobe = "female" | "male" | "mixed";
export type GuestRole = "top" | "bottom" | "dress" | "shoes" | "bag";

export interface GuestItem {
  id: string;
  wardrobe: GuestWardrobe;
  role: GuestRole;
  colorId: string;
  name: { ru: string; en: string };
}

const item = (
  id: string,
  role: GuestRole,
  colorId: string,
  ru: string,
  en: string,
): GuestItem => ({
  id,
  wardrobe: id.startsWith("m-") ? "male" : "female",
  role,
  colorId,
  name: { ru, en },
});

export const GUEST_CATALOG: GuestItem[] = [
  item("w-tee-white", "top", "A3", "Белая футболка", "White T-shirt"),
  item("w-tee-black", "top", "A1", "Чёрная футболка", "Black T-shirt"),
  item("w-shirt-white", "top", "A3", "Белая рубашка", "White shirt"),
  item("w-longsleeve-grey", "top", "A2", "Серый лонгслив", "Grey longsleeve"),
  item(
    "w-turtleneck-navy",
    "top",
    "K9",
    "Тёмно-синяя водолазка",
    "Navy turtleneck",
  ),
  item("w-blouse-blush", "top", "P1", "Пудровая блузка", "Blush blouse"),
  item("w-jeans-blue", "bottom", "D9", "Голубые джинсы", "Blue jeans"),
  item("w-trousers-black", "bottom", "A1", "Чёрные брюки", "Black trousers"),
  item("w-trousers-sand", "bottom", "D4", "Песочные брюки", "Sand trousers"),
  item("w-skirt-beige", "bottom", "P3", "Бежевая юбка", "Beige skirt"),
  item("w-dress-black", "dress", "A1", "Чёрное платье", "Black dress"),
  item("w-dress-burgundy", "dress", "K1", "Бордовое платье", "Burgundy dress"),
  item("w-sneakers-white", "shoes", "A3", "Белые кеды", "White sneakers"),
  item("w-loafers-black", "shoes", "A1", "Чёрные лоферы", "Black loafers"),
  item(
    "w-boots-brown",
    "shoes",
    "K2",
    "Коричневые ботильоны",
    "Brown ankle boots",
  ),
  item("w-flats-beige", "shoes", "P3", "Бежевые балетки", "Beige ballet flats"),
  item("w-tote-camel", "bag", "D3", "Сумка-тоут кэмел", "Camel tote"),
  item("w-bag-black", "bag", "A1", "Чёрная сумка", "Black shoulder bag"),
  item("w-bag-red", "bag", "B1", "Красная мини-сумка", "Red mini bag"),
  item("m-tee-white", "top", "A3", "Белая футболка", "White T-shirt"),
  item("m-tee-black", "top", "A1", "Чёрная футболка", "Black T-shirt"),
  item("m-shirt-sky", "top", "P9", "Голубая рубашка", "Sky blue shirt"),
  item("m-polo-navy", "top", "K9", "Тёмно-синее поло", "Navy polo"),
  item("m-longsleeve-grey", "top", "A2", "Серый лонгслив", "Grey longsleeve"),
  item("m-jeans-blue", "bottom", "D9", "Синие джинсы", "Blue jeans"),
  item("m-chinos-sand", "bottom", "D4", "Песочные чинос", "Sand chinos"),
  item("m-trousers-black", "bottom", "A1", "Чёрные брюки", "Black trousers"),
  item("m-sneakers-white", "shoes", "A3", "Белые кеды", "White sneakers"),
  item("m-derby-brown", "shoes", "K2", "Коричневые дерби", "Brown derby shoes"),
  item("m-boots-black", "shoes", "A1", "Чёрные челси", "Black chelsea boots"),
  item("m-backpack-black", "bag", "A1", "Чёрный рюкзак", "Black backpack"),
  item("m-bag-brown", "bag", "K3", "Коричневая сумка", "Brown messenger bag"),
];

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
