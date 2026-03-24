/**
 * Категории вещей базовой капсулы
 * Источник: Capsule Zero Styling Guide v1.3 — раздел 2
 * Методология: Capsule Zero
 */

export type GarderType = "women" | "men" | "mixed";

export interface Category {
  id: string;
  nameRu: string;
  nameEn: string;
  nameEs: string;
  section: "tops" | "bottoms" | "dresses" | "outerwear" | "shoes" | "bags" | "accessories";
  genders: GarderType[];
}

export const CATEGORIES: Category[] = [
  // TOPS
  { id: "tank-top",        nameRu: "Майка-топ",        nameEn: "Tank top / Cami",      nameEs: "Musculosa / Camisole",  section: "tops",      genders: ["women", "men", "mixed"] },
  { id: "shirt",           nameRu: "Блузка-рубашка",   nameEn: "Button-down shirt",    nameEs: "Camisa",                section: "tops",      genders: ["women", "men", "mixed"] },
  { id: "turtleneck",      nameRu: "Водолазка",        nameEn: "Turtleneck",           nameEs: "Cuello tortuga",         section: "tops",      genders: ["women", "men", "mixed"] },
  { id: "sweater",         nameRu: "Джемпер",          nameEn: "Crew neck sweater",    nameEs: "Suéter cuello redondo",  section: "tops",      genders: ["women", "men", "mixed"] },
  { id: "cardigan",        nameRu: "Кардиган",         nameEn: "Cardigan",             nameEs: "Cárdigan",               section: "tops",      genders: ["women", "men", "mixed"] },
  { id: "bomber",          nameRu: "Бомбер",           nameEn: "Bomber jacket",        nameEs: "Campera bomber",         section: "tops",      genders: ["women", "men", "mixed"] },
  { id: "blazer",          nameRu: "Пиджак",           nameEn: "Blazer",               nameEs: "Blazer",                 section: "tops",      genders: ["women", "men", "mixed"] },
  { id: "tshirt",          nameRu: "Футболка",         nameEn: "T-shirt",              nameEs: "Remera",                 section: "tops",      genders: ["women", "men", "mixed"] },
  { id: "polo",            nameRu: "Поло",             nameEn: "Polo shirt",           nameEs: "Polo",                   section: "tops",      genders: ["women", "men", "mixed"] },
  { id: "hoodie",          nameRu: "Худи, свитшот",    nameEn: "Hoodie / Sweatshirt",  nameEs: "Sudadera",               section: "tops",      genders: ["women", "men", "mixed"] },
  { id: "longsleeve",      nameRu: "Лонгслив",         nameEn: "Longsleeve",           nameEs: "Remera manga larga",     section: "tops",      genders: ["women", "men", "mixed"] },

  // DRESSES & SKIRTS (women only)
  { id: "dress",           nameRu: "Платье",           nameEn: "Dress",                nameEs: "Vestido",                section: "dresses",   genders: ["women"] },
  { id: "skirt",           nameRu: "Юбка",             nameEn: "Skirt",                nameEs: "Falda",                  section: "dresses",   genders: ["women"] },

  // BOTTOMS
  { id: "trousers",        nameRu: "Брюки",            nameEn: "Trousers",             nameEs: "Pantalón",               section: "bottoms",   genders: ["women", "men", "mixed"] },
  { id: "leggings",        nameRu: "Леггинсы",         nameEn: "Leggings",             nameEs: "Calzas",                 section: "bottoms",   genders: ["women"] },
  { id: "jeans",           nameRu: "Джинсы",           nameEn: "Jeans",                nameEs: "Jeans",                  section: "bottoms",   genders: ["women", "men", "mixed"] },
  { id: "shorts",          nameRu: "Шорты",            nameEn: "Shorts",               nameEs: "Shorts",                 section: "bottoms",   genders: ["women", "men", "mixed"] },
  { id: "chinos",          nameRu: "Чинос",            nameEn: "Chinos",               nameEs: "Chinos",                 section: "bottoms",   genders: ["men"] },

  // OUTERWEAR
  { id: "trench",          nameRu: "Плащ",             nameEn: "Trench coat",          nameEs: "Gabardina",              section: "outerwear", genders: ["women", "men", "mixed"] },
  { id: "short-coat",      nameRu: "Полупальто",       nameEn: "Short coat",           nameEs: "Abrigo corto",           section: "outerwear", genders: ["women", "men", "mixed"] },
  { id: "coat",            nameRu: "Пальто",           nameEn: "Coat",                 nameEs: "Abrigo",                 section: "outerwear", genders: ["women", "men", "mixed"] },

  // SHOES
  { id: "sneakers",        nameRu: "Кеды / Кроссовки", nameEn: "Sneakers",             nameEs: "Zapatillas",             section: "shoes",     genders: ["women", "men", "mixed"] },
  { id: "loafers",         nameRu: "Лоферы",           nameEn: "Loafers",              nameEs: "Mocasines",              section: "shoes",     genders: ["women", "men", "mixed"] },
  { id: "ankle-boots",     nameRu: "Ботинки",          nameEn: "Ankle boots",          nameEs: "Botines",                section: "shoes",     genders: ["women", "men", "mixed"] },
  { id: "heels",           nameRu: "Туфли на каблуке", nameEn: "Heels",                nameEs: "Zapatos de taco",        section: "shoes",     genders: ["women"] },
  { id: "flats",           nameRu: "Балетки / Туфли",  nameEn: "Flats",                nameEs: "Zapatos planos",         section: "shoes",     genders: ["women"] },

  // BAGS
  { id: "tote",            nameRu: "Тоут",             nameEn: "Tote bag",             nameEs: "Bolso tote",             section: "bags",      genders: ["women", "men", "mixed"] },
  { id: "crossbody",       nameRu: "Кросс-боди",       nameEn: "Crossbody bag",        nameEs: "Bandolera",              section: "bags",      genders: ["women"] },
  { id: "backpack",        nameRu: "Рюкзак",           nameEn: "Backpack",             nameEs: "Mochila",                section: "bags",      genders: ["women", "men", "mixed"] },

  // ACCESSORIES
  { id: "belt",            nameRu: "Ремень",           nameEn: "Belt",                 nameEs: "Cinturón",               section: "accessories", genders: ["women", "men", "mixed"] },
  { id: "scarf",           nameRu: "Шарф",             nameEn: "Scarf",                nameEs: "Bufanda",                section: "accessories", genders: ["women", "men", "mixed"] },
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
