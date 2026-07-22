/**
 * Категории вещей базовой капсулы
 * Источник: Capsule Zero Styling Guide v1.3 — раздел 2
 * Методология: Capsule Zero
 */

import type {
  AccessorySlot,
  AlgorithmRole,
  Category as ApiCategory,
} from "@/lib/api/generated/openapi";

export type GarderType = "women" | "men" | "mixed";
export type { AccessorySlot, AlgorithmRole };

export interface Category
  extends Pick<ApiCategory, "id" | "algorithmRole" | "accessorySlot"> {
  nameRu: string;
  nameEn: string;
  nameEs: string;
  section: "tops" | "bottoms" | "dresses" | "outerwear" | "shoes" | "bags" | "accessories";
  genders: GarderType[];
}

type CategoryPresentation = Omit<
  Category,
  "algorithmRole" | "accessorySlot"
>;

function defineCategory(
  category: CategoryPresentation,
  algorithmRole: AlgorithmRole,
  accessorySlot: AccessorySlot | null = null,
): Category {
  return { ...category, algorithmRole, accessorySlot };
}

export const CATEGORIES: Category[] = [
  // TOPS
  defineCategory({ id: "tank-top",        nameRu: "Майка-топ",        nameEn: "Tank top / Cami",      nameEs: "Musculosa / Camisole",  section: "tops",      genders: ["women", "men", "mixed"] }, "core_top"),
  defineCategory({ id: "shirt",           nameRu: "Блузка-рубашка",   nameEn: "Button-down shirt",    nameEs: "Camisa",                section: "tops",      genders: ["women", "men", "mixed"] }, "core_top"),
  defineCategory({ id: "turtleneck",      nameRu: "Водолазка",        nameEn: "Turtleneck",           nameEs: "Cuello tortuga",         section: "tops",      genders: ["women", "men", "mixed"] }, "core_top"),
  defineCategory({ id: "sweater",         nameRu: "Джемпер",          nameEn: "Crew neck sweater",    nameEs: "Suéter cuello redondo",  section: "tops",      genders: ["women", "men", "mixed"] }, "layering_mid"),
  defineCategory({ id: "cardigan",        nameRu: "Кардиган",         nameEn: "Cardigan",             nameEs: "Cárdigan",               section: "tops",      genders: ["women", "men", "mixed"] }, "layering_mid"),
  defineCategory({ id: "bomber",          nameRu: "Бомбер",           nameEn: "Bomber jacket",        nameEs: "Campera bomber",         section: "tops",      genders: ["women", "men", "mixed"] }, "layering_mid"),
  defineCategory({ id: "blazer",          nameRu: "Пиджак",           nameEn: "Blazer",               nameEs: "Blazer",                 section: "tops",      genders: ["women", "men", "mixed"] }, "layering_mid"),
  defineCategory({ id: "tshirt",          nameRu: "Футболка",         nameEn: "T-shirt",              nameEs: "Remera",                 section: "tops",      genders: ["women", "men", "mixed"] }, "core_top"),
  defineCategory({ id: "polo",            nameRu: "Поло",             nameEn: "Polo shirt",           nameEs: "Polo",                   section: "tops",      genders: ["women", "men", "mixed"] }, "core_top"),
  defineCategory({ id: "hoodie",          nameRu: "Худи, свитшот",    nameEn: "Hoodie / Sweatshirt",  nameEs: "Sudadera",               section: "tops",      genders: ["women", "men", "mixed"] }, "core_top"),
  defineCategory({ id: "longsleeve",      nameRu: "Лонгслив",         nameEn: "Longsleeve",           nameEs: "Remera manga larga",     section: "tops",      genders: ["women", "men", "mixed"] }, "core_top"),

  // DRESSES & SKIRTS (women only)
  defineCategory({ id: "dress",           nameRu: "Платье",           nameEn: "Dress",                nameEs: "Vestido",                section: "dresses",   genders: ["women"] }, "core_dress"),
  defineCategory({ id: "skirt",           nameRu: "Юбка",             nameEn: "Skirt",                nameEs: "Falda",                  section: "dresses",   genders: ["women"] }, "core_bottom"),

  // BOTTOMS
  defineCategory({ id: "trousers",        nameRu: "Брюки",            nameEn: "Trousers",             nameEs: "Pantalón",               section: "bottoms",   genders: ["women", "men", "mixed"] }, "core_bottom"),
  defineCategory({ id: "leggings",        nameRu: "Леггинсы",         nameEn: "Leggings",             nameEs: "Calzas",                 section: "bottoms",   genders: ["women"] }, "core_bottom"),
  defineCategory({ id: "jeans",           nameRu: "Джинсы",           nameEn: "Jeans",                nameEs: "Jeans",                  section: "bottoms",   genders: ["women", "men", "mixed"] }, "core_bottom"),
  defineCategory({ id: "shorts",          nameRu: "Шорты",            nameEn: "Shorts",                nameEs: "Shorts",                 section: "bottoms",   genders: ["women", "men", "mixed"] }, "core_bottom"),
  defineCategory({ id: "chinos",          nameRu: "Чинос",            nameEn: "Chinos",               nameEs: "Chinos",                 section: "bottoms",   genders: ["men"] }, "core_bottom"),

  // OUTERWEAR
  defineCategory({ id: "trench",          nameRu: "Плащ",             nameEn: "Trench coat",          nameEs: "Gabardina",              section: "outerwear", genders: ["women", "men", "mixed"] }, "layering_outer"),
  defineCategory({ id: "short-coat",      nameRu: "Полупальто",       nameEn: "Short coat",           nameEs: "Abrigo corto",           section: "outerwear", genders: ["women", "men", "mixed"] }, "layering_outer"),
  defineCategory({ id: "vest",            nameRu: "Жилет",            nameEn: "Vest / Gilet",          nameEs: "Chaleco",                section: "outerwear", genders: ["women", "men", "mixed"] }, "layering_outer"),
  defineCategory({ id: "coat",            nameRu: "Пальто",           nameEn: "Coat",                 nameEs: "Abrigo",                 section: "outerwear", genders: ["women", "men", "mixed"] }, "layering_outer"),
  defineCategory({ id: "puffer",          nameRu: "Пуховик",          nameEn: "Puffer jacket",        nameEs: "Campera acolchada",      section: "outerwear", genders: ["women", "men", "mixed"] }, "layering_outer"),
  defineCategory({ id: "fur-coat",        nameRu: "Шуба",             nameEn: "Fur / Faux fur coat",  nameEs: "Abrigo de piel",         section: "outerwear", genders: ["women"] }, "layering_outer"),
  defineCategory({ id: "parka",           nameRu: "Парка",            nameEn: "Parka",                nameEs: "Parka",                  section: "outerwear", genders: ["women", "men", "mixed"] }, "layering_outer"),
  defineCategory({ id: "jacket",          nameRu: "Куртка",           nameEn: "Jacket",               nameEs: "Campera",                section: "outerwear", genders: ["women", "men", "mixed"] }, "layering_outer"),

  // SHOES
  defineCategory({ id: "sandals",         nameRu: "Сандалии",         nameEn: "Sandals",              nameEs: "Sandalias",              section: "shoes",     genders: ["women", "men", "mixed"] }, "core_shoes"),
  defineCategory({ id: "sneakers",        nameRu: "Кеды / Кроссовки", nameEn: "Sneakers",             nameEs: "Zapatillas",             section: "shoes",     genders: ["women", "men", "mixed"] }, "core_shoes"),
  defineCategory({ id: "loafers",         nameRu: "Лоферы",           nameEn: "Loafers",              nameEs: "Mocasines",              section: "shoes",     genders: ["women", "men", "mixed"] }, "core_shoes"),
  defineCategory({ id: "ankle-boots",     nameRu: "Ботинки",          nameEn: "Ankle boots",          nameEs: "Botines",                section: "shoes",     genders: ["women", "men", "mixed"] }, "core_shoes"),
  defineCategory({ id: "heels",           nameRu: "Туфли на каблуке", nameEn: "Heels",                nameEs: "Zapatos de taco",        section: "shoes",     genders: ["women"] }, "core_shoes"),
  defineCategory({ id: "flats",           nameRu: "Балетки / Туфли",  nameEn: "Flats",                nameEs: "Zapatos planos",         section: "shoes",     genders: ["women"] }, "core_shoes"),
  defineCategory({ id: "heeled-sandals",  nameRu: "Босоножки",        nameEn: "Heeled sandals",       nameEs: "Sandalias con taco",     section: "shoes",     genders: ["women"] }, "core_shoes"),
  defineCategory({ id: "boots",           nameRu: "Ботинки",          nameEn: "Boots",                nameEs: "Botas",                  section: "shoes",     genders: ["women", "men", "mixed"] }, "core_shoes"),
  defineCategory({ id: "knee-high-boots", nameRu: "Сапоги / Ботфорты", nameEn: "Knee-high boots",      nameEs: "Botas altas",            section: "shoes",     genders: ["women"] }, "core_shoes"),

  // BAGS
  defineCategory({ id: "tote",            nameRu: "Тоут",             nameEn: "Tote bag",             nameEs: "Bolso tote",             section: "bags",      genders: ["women", "men", "mixed"] }, "accessory", "bag"),
  defineCategory({ id: "crossbody",       nameRu: "Кросс-боди",       nameEn: "Crossbody bag",        nameEs: "Bandolera",              section: "bags",      genders: ["women"] }, "accessory", "bag"),
  defineCategory({ id: "clutch",          nameRu: "Клатч",            nameEn: "Clutch",               nameEs: "Clutch",                 section: "bags",      genders: ["women"] }, "accessory", "bag"),
  defineCategory({ id: "backpack",        nameRu: "Рюкзак",           nameEn: "Backpack",             nameEs: "Mochila",                section: "bags",      genders: ["women", "men", "mixed"] }, "accessory", "bag"),

  // ACCESSORIES
  defineCategory({ id: "scarf",           nameRu: "Шарф",             nameEn: "Scarf",                nameEs: "Bufanda",                section: "accessories", genders: ["women", "men", "mixed"] }, "accessory", "neckwear"),
  defineCategory({ id: "beanie",          nameRu: "Шапка",            nameEn: "Beanie / Hat",         nameEs: "Gorro",                  section: "accessories", genders: ["women", "men", "mixed"] }, "accessory", "headwear"),
  defineCategory({ id: "fedora",          nameRu: "Шляпа-федора",     nameEn: "Fedora hat",           nameEs: "Sombrero fedora",        section: "accessories", genders: ["women", "men", "mixed"] }, "accessory", "headwear"),
  defineCategory({ id: "cap",             nameRu: "Кепка",            nameEn: "Cap",                  nameEs: "Gorra",                  section: "accessories", genders: ["women", "men", "mixed"] }, "accessory", "headwear"),
  defineCategory({ id: "jewelry",         nameRu: "Украшения",        nameEn: "Jewelry",              nameEs: "Joyas",                  section: "accessories", genders: ["women", "men", "mixed"] }, "accessory", "jewelry"),
  defineCategory({ id: "belt",            nameRu: "Ремень",           nameEn: "Belt",                 nameEs: "Cinturón",               section: "accessories", genders: ["women", "men", "mixed"] }, "accessory", "belt"),
  defineCategory({ id: "sunglasses",      nameRu: "Очки",             nameEn: "Sunglasses",           nameEs: "Anteojos de sol",        section: "accessories", genders: ["women", "men", "mixed"] }, "accessory", "eyewear"),
  defineCategory({ id: "watch",           nameRu: "Часы",             nameEn: "Watch",                nameEs: "Reloj",                  section: "accessories", genders: ["women", "men", "mixed"] }, "accessory", "jewelry"),
  defineCategory({ id: "tie",             nameRu: "Галстук",          nameEn: "Tie",                  nameEs: "Corbata",                section: "accessories", genders: ["men"] }, "accessory", "neckwear"),
];

export function getCategoriesByGender(gender: GarderType): Category[] {
  return CATEGORIES.filter((c) => c.genders.includes(gender));
}

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export const CATEGORY_SECTIONS = {
  tops:        { nameRu: "Верх",              nameEn: "Tops",           nameEs: "Tops" },
  dresses:     { nameRu: "Платья и юбки",    nameEn: "Dresses & Skirts", nameEs: "Vestidos y faldas" },
  bottoms:     { nameRu: "Низ",              nameEn: "Bottoms",         nameEs: "Partes de abajo" },
  outerwear:   { nameRu: "Верхняя одежда",   nameEn: "Outerwear",       nameEs: "Ropa de abrigo" },
  shoes:       { nameRu: "Обувь",            nameEn: "Shoes",           nameEs: "Calzado" },
  bags:        { nameRu: "Сумки",            nameEn: "Bags",            nameEs: "Bolsos" },
  accessories: { nameRu: "Аксессуары",       nameEn: "Accessories",     nameEs: "Accesorios" },
} as const;
