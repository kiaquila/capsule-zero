import {
  CATEGORY_SECTIONS,
  getCategoriesByGender,
  getCategoryById,
  type GarderType,
} from "@/lib/categories";
import type { AppLocale } from "@/i18n/routing";
import type { ProviderRegistry, WardrobeEntry } from "@/lib/providers";
import type {
  ColorGroup,
  ColorHue,
  ColorPoint,
  ColorTemperature,
} from "@/types";

export type { GarderType };

export type JourneyStep = 1 | 2 | 3;
export type JourneyItemSource = "photo" | "marketplace" | "catalog";

export interface PaletteColorOption extends ColorPoint {
  id: string;
  light?: boolean;
}

export interface JourneyCategoryOption {
  id: string;
  label: string;
  section: keyof typeof CATEGORY_SECTIONS | "custom";
  sectionLabel: string;
  defaultCount: number;
}

export interface JourneyCatalogItem {
  id: string;
  name: string;
  categoryId: string;
  categoryLabel: string;
  brand?: string;
  imageUrl?: string;
  colorPoints: PaletteColorOption[];
  explanation: string;
}

export interface GuidedJourneySnapshot {
  profile: {
    displayName: string;
    email: string;
    initials: string;
  };
  categories: Record<GarderType, JourneyCategoryOption[]>;
  catalogItems: JourneyCatalogItem[];
  paletteColors: PaletteColorOption[];
  upload: {
    acceptedMimeTypes: string[];
    maxBytes: number;
  };
}

interface BuildGuidedJourneySnapshotOptions {
  registry: ProviderRegistry;
  session: {
    userId: string;
    email: string;
    name?: string;
  };
  locale: AppLocale;
}

const GARDER_TYPES: GarderType[] = ["women", "men", "mixed"];
const ACCEPTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function buildGuidedJourneySnapshot({
  registry,
  session,
  locale,
}: BuildGuidedJourneySnapshotOptions): Promise<GuidedJourneySnapshot> {
  const profile = await registry.profiles.getProfile(session.userId);
  const categoryEntries = await Promise.all(
    GARDER_TYPES.map(async (type) => {
      const defaults = await registry.methodology.listJourneyCategories(type);
      const defaultCounts = new Map(
        defaults.map((category) => [category.categoryId, category.count]),
      );

      return [
        type,
        getCategoriesByGender(type).map((category) => ({
          id: category.id,
          label: locale === "ru" ? category.nameRu : category.nameEn,
          section: category.section,
          sectionLabel:
            locale === "ru"
              ? CATEGORY_SECTIONS[category.section].nameRu
              : CATEGORY_SECTIONS[category.section].nameEn,
          defaultCount: defaultCounts.get(category.id) ?? 1,
        })),
      ] as const;
    }),
  );
  const catalogResults = await registry.catalogSearch.search(session.userId, "");

  return {
    profile: {
      displayName: session.name ?? profile.displayName,
      email: session.email,
      initials: buildInitials(session.name ?? profile.displayName ?? session.email),
    },
    categories: Object.fromEntries(categoryEntries) as Record<
      GarderType,
      JourneyCategoryOption[]
    >,
    catalogItems: catalogResults.map((result) =>
      buildCatalogItem(result.item, result.explanation, locale),
    ),
    paletteColors: JOURNEY_PALETTE_COLORS,
    upload: {
      acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
      maxBytes: MAX_UPLOAD_BYTES,
    },
  };
}

export function arePaletteColorGroupsCompatible(
  base: PaletteColorOption | null,
  target: PaletteColorOption,
): boolean {
  if (!base || target.isAchromatic) {
    return true;
  }

  if (base.group === target.group) {
    return true;
  }

  return (
    (base.group === "desaturated" && target.group === "dark") ||
    (base.group === "dark" && target.group === "desaturated")
  );
}

function buildCatalogItem(
  item: WardrobeEntry,
  explanation: string,
  locale: AppLocale,
): JourneyCatalogItem {
  return {
    id: item.id,
    name: item.name,
    categoryId: item.categoryId,
    categoryLabel: categoryName(item.categoryId, locale),
    brand: item.brand,
    imageUrl: item.imageUrl,
    colorPoints: item.colorPoints.map(toPaletteColorOption),
    explanation,
  };
}

function categoryName(categoryId: string, locale: AppLocale): string {
  const category = getCategoryById(categoryId);

  if (!category) {
    return categoryId;
  }

  return locale === "ru" ? category.nameRu : category.nameEn;
}

function toPaletteColorOption(colorPoint: ColorPoint): PaletteColorOption {
  const existing = JOURNEY_PALETTE_COLORS.find(
    (color) => color.hex.toLowerCase() === colorPoint.hex.toLowerCase(),
  );

  return (
    existing ?? {
      ...colorPoint,
      id: colorPoint.hex,
      light: colorPoint.hex.toLowerCase() === "#ffffff",
    }
  );
}

function buildInitials(value: string): string {
  const cleaned = value.trim();

  if (!cleaned) {
    return "CZ";
  }

  const parts = cleaned
    .replace(/@.*/, "")
    .split(/[.\s_-]+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? "C"}${parts[1][0] ?? "Z"}`.toUpperCase();
}

function color(
  id: string,
  name: string,
  hex: string,
  group: ColorGroup,
  temperature: ColorTemperature,
  hue: ColorHue,
  light = false,
): PaletteColorOption {
  return {
    id,
    name,
    hex,
    group,
    shade: group,
    temperature,
    hue,
    isAchromatic: group === "achromatic",
    light,
  };
}

export const JOURNEY_PALETTE_COLORS: PaletteColorOption[] = [
  color("A1", "Black", "#1C1C1C", "achromatic", "neutral", "achromatic"),
  color("A2", "Gray", "#8C8C8C", "achromatic", "neutral", "achromatic"),
  color("A3", "White", "#FFFFFF", "achromatic", "neutral", "achromatic", true),
  color("B1", "Scarlet", "#E82535", "bright", "warm", "red"),
  color("B2", "Vermillion", "#E84B20", "bright", "warm", "red-orange"),
  color("B3", "Tangerine", "#E87820", "bright", "warm", "orange"),
  color("B4", "Amber", "#E8AA20", "bright", "warm", "yellow-orange"),
  color("B5", "Canary", "#E8D520", "bright", "warm", "yellow", true),
  color("B6", "Chartreuse", "#7EC820", "bright", "warm", "yellow-green"),
  color("B7", "Emerald", "#20A84E", "bright", "cool", "green"),
  color("B8", "Teal", "#10A896", "bright", "cool", "blue-green"),
  color("B9", "Cobalt", "#186AE8", "bright", "cool", "blue"),
  color("B10", "Indigo", "#3828E8", "bright", "cool", "blue-violet"),
  color("B11", "Violet", "#8820E8", "bright", "cool", "violet"),
  color("B12", "Fuchsia", "#D020AA", "bright", "cool", "red-violet"),
  color("P1", "Blush", "#F5B5BB", "pastel", "warm", "red", true),
  color("P2", "Nectarine", "#F5CDB0", "pastel", "warm", "red-orange", true),
  color("P3", "Beige", "#E8D5B5", "pastel", "warm", "orange", true),
  color("P4", "Off-White", "#F5EADC", "pastel", "warm", "yellow-orange", true),
  color("P5", "Primrose", "#F7EDA5", "pastel", "warm", "yellow", true),
  color("P6", "Pistachio", "#D8EEB0", "pastel", "warm", "yellow-green", true),
  color("P7", "Mint", "#B0EEC5", "pastel", "cool", "green", true),
  color("P8", "Aqua", "#B0EEDE", "pastel", "cool", "blue-green", true),
  color("P9", "Sky", "#B0CDEE", "pastel", "cool", "blue", true),
  color("P10", "Periwinkle", "#C0B8EE", "pastel", "cool", "blue-violet", true),
  color("P11", "Lavender", "#DCB8EE", "pastel", "cool", "violet", true),
  color("P12", "Orchid", "#EEB8E5", "pastel", "cool", "red-violet", true),
  color("D1", "Brick", "#B86068", "desaturated", "warm", "red"),
  color("D2", "Coral", "#C07860", "desaturated", "warm", "red-orange"),
  color("D3", "Terracotta", "#C08A65", "desaturated", "warm", "orange"),
  color("D4", "Sand", "#C0A268", "desaturated", "warm", "yellow-orange"),
  color("D5", "Straw", "#B8B268", "desaturated", "warm", "yellow"),
  color("D6", "Sage", "#88A865", "desaturated", "warm", "yellow-green"),
  color("D7", "Fern", "#60A878", "desaturated", "cool", "green"),
  color("D8", "Dusty Teal", "#50A095", "desaturated", "cool", "blue-green"),
  color("D9", "Slate", "#5082B8", "desaturated", "cool", "blue"),
  color("D10", "Dusty Indigo", "#6860B8", "desaturated", "cool", "blue-violet"),
  color("D11", "Mauve", "#9860B8", "desaturated", "cool", "violet"),
  color("D12", "Antique Rose", "#B860A2", "desaturated", "cool", "red-violet"),
  color("K1", "Burgundy", "#8C1820", "dark", "warm", "red"),
  color("K2", "Rust", "#8C3015", "dark", "warm", "red-orange"),
  color("K3", "Burnt Orange", "#8C5018", "dark", "warm", "orange"),
  color("K4", "Ochre", "#8C6C15", "dark", "warm", "yellow-orange"),
  color("K5", "Olive Gold", "#787815", "dark", "warm", "yellow"),
  color("K6", "Olive", "#4A7A18", "dark", "warm", "yellow-green"),
  color("K7", "Forest", "#187838", "dark", "cool", "green"),
  color("K8", "Pine", "#187870", "dark", "cool", "blue-green"),
  color("K9", "Navy", "#182878", "dark", "cool", "blue"),
  color("K10", "Midnight", "#201878", "dark", "cool", "blue-violet"),
  color("K11", "Plum", "#5A1878", "dark", "cool", "violet"),
  color("K12", "Mulberry", "#781860", "dark", "cool", "red-violet"),
];
