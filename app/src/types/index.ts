/**
 * Capsule Zero — Core TypeScript Types
 * Источник: FVD v1.2, User Stories v1.4, Styling Guide v1.3
 */

// ============================================================
// ПОЛЬЗОВАТЕЛЬ
// ============================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  location?: {
    country?: string;
    city?: string;
  };
  /** False while the address still has a pending email verification (spec 035). */
  emailVerified?: boolean;
  createdAt: string;
}

// ============================================================
// ВЕЩИ (ITEMS)
// ============================================================

export type ColorTemperature = "warm" | "cool" | "neutral";
export type ColorGroup = "achromatic" | "bright" | "pastel" | "desaturated" | "dark";
export type ColorShade = ColorGroup;
export type ColorHue =
  | "red" | "red-orange" | "orange" | "yellow-orange" | "yellow" | "yellow-green"
  | "green" | "blue-green" | "blue" | "blue-violet" | "violet" | "red-violet"
  | "achromatic";

export interface ColorPoint {
  id?: string;
  hex: string;
  name: string;
  temperature: ColorTemperature;
  group: ColorGroup;
  shade: ColorShade;
  hue: ColorHue;
  isAchromatic: boolean;
}

export interface ClothingItem {
  id: string;
  userId: string;
  name: string;
  categoryId: string;
  photoUrl?: string;
  colorPoints: ColorPoint[];       // 1–3 доминантных цвета
  brand?: string;
  material?: string;
  price?: number;
  sourceUrl?: string;              // URL маркетплейса
  capsuleIds: string[];            // капсулы, где используется
  isPublic: boolean;               // в общей базе?
  createdAt: string;
}

// ============================================================
// ПАЛИТРА КАПСУЛЫ
// ============================================================

export interface CapsulePalette {
  achromaticColors: ColorPoint[];  // always Black, Gray, White
  selectedColors: ColorPoint[];    // up to 12 chromatic colors
}

// ============================================================
// КАПСУЛА
// ============================================================

export type GarderType = "women" | "men" | "mixed";

export interface CapsuleCategory {
  categoryId: string;
  count: number;  // степпер количества, 1–10
}

export interface GapItem {
  categoryId: string;
  colorHint?: string;
  reason: string;
}

export interface Capsule {
  id: string;
  userId: string;
  name: string;
  garderType: GarderType;
  palette: CapsulePalette;
  categories: CapsuleCategory[];
  itemIds: string[];
  outfitCount: number;             // расчётное количество комплектов
  gapAnalysis: GapItem[];
  createdAt: string;
}

// ============================================================
// GUIDED JOURNEY STATE
// ============================================================

export interface JourneyState {
  step: 1 | 2 | 3;
  garderType?: GarderType;
  selectedCategories: CapsuleCategory[];
  palette?: Partial<CapsulePalette>;
  importedUrls: string[];
  uploadedPhotos: File[];
}

// ============================================================
// РАЗДЕЛЫ ЛК (DASHBOARD)
// ============================================================

export type DashboardSection =
  | "items"
  | "capsules"
  | "uncapsulated"
  | "favorites"
  | "shopping-list"
  | "for-sale"
  | "for-repair";

export interface DashboardSectionInfo {
  id: DashboardSection;
  nameRu: string;
  nameEn: string;
  nameEs: string;
  count: number;
  isPrimary?: boolean;  // точка входа (Капсулы)
}

// ============================================================
// ЯЗЫКИ
// ============================================================

export type Locale = "en" | "ru";
