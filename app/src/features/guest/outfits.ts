// Алгоритм v0 гостевой петли — считается в браузере, без сервера и без LLM.
// Цвет: матрица colors.md (ахроматы с любыми; Brights / Pastels / Desaturated+Darks — отдельные группы).
// Образ: верх × низ × обувь или платье × обувь, все вещи попарно совместимы.
// Сумка: каждый базовый образ считается сам по себе плюс до 3 вариантов с совместимыми сумками (A_max = 3).

import type { GuestItem } from "./catalog";

import { areColorGroupsCompatible } from "@/lib/color-compatibility";
import type { ColorGroup } from "@/types";

const A_MAX = 3;
const GROUPS: Record<string, ColorGroup> = {
  A: "achromatic",
  B: "bright",
  P: "pastel",
  D: "desaturated",
  K: "dark",
};
export function compatible(a: GuestItem, b: GuestItem): boolean {
  return areColorGroupsCompatible(GROUPS[a.colorId[0]], GROUPS[b.colorId[0]]);
}

const allCompatible = (items: GuestItem[]) =>
  items.every((x, i) => items.slice(i + 1).every((y) => compatible(x, y)));

export interface Outfit {
  key: string;
  top?: GuestItem;
  bottom?: GuestItem;
  dress?: GuestItem;
  shoes: GuestItem;
  bag?: GuestItem;
}

export interface Evaluation {
  outfits: Outfit[];
  count: number;
  baseLooks: number;
  countedItems: number;
  opr: number;
  conflicts: Array<[GuestItem, GuestItem]>;
}

function baseLooks(items: GuestItem[]): Outfit[] {
  const by = (role: GuestItem["role"]) => items.filter((x) => x.role === role);
  const looks: Outfit[] = [];
  for (const shoes of by("shoes")) {
    for (const top of by("top")) {
      for (const bottom of by("bottom")) {
        if (allCompatible([top, bottom, shoes])) {
          looks.push({
            key: `${top.id}|${bottom.id}|${shoes.id}`,
            top,
            bottom,
            shoes,
          });
        }
      }
    }
    for (const dress of by("dress")) {
      if (compatible(dress, shoes)) {
        looks.push({ key: `${dress.id}|${shoes.id}`, dress, shoes });
      }
    }
  }
  return looks;
}

export function evaluate(items: GuestItem[]): Evaluation {
  const looks = baseLooks(items);
  const bags = items.filter((x) => x.role === "bag");
  const outfits: Outfit[] = [];
  for (const look of looks) {
    outfits.push(look);
    const core = [look.top, look.bottom, look.dress, look.shoes].filter(
      Boolean,
    ) as GuestItem[];
    const seenColors = new Set<string>();
    const fitting = bags.filter((bag) => {
      if (!core.every((c) => compatible(c, bag)) || seenColors.has(bag.colorId))
        return false;
      seenColors.add(bag.colorId);
      return true;
    });
    for (const bag of fitting.slice(0, A_MAX)) {
      outfits.push({ ...look, key: `${look.key}|${bag.id}`, bag });
    }
  }
  const countedItems = items.length;
  const conflicts: Array<[GuestItem, GuestItem]> = [];
  // Конфликт показываем только для вещей, которые вообще могли бы оказаться в одном образе.
  const wearableTogether = (x: GuestItem, y: GuestItem) => {
    if (x.role === y.role) return false;
    const pair = new Set([x.role, y.role]);
    return !(pair.has("dress") && (pair.has("top") || pair.has("bottom")));
  };
  items.forEach((x, i) =>
    items.slice(i + 1).forEach((y) => {
      if (wearableTogether(x, y) && !compatible(x, y)) conflicts.push([x, y]);
    }),
  );
  return {
    outfits: interleave(outfits),
    count: outfits.length,
    baseLooks: looks.length,
    countedItems,
    opr: countedItems ? outfits.length / countedItems : 0,
    conflicts,
  };
}

// Чтобы галерея начиналась с разных вещей, а не с десяти образов в одной футболке.
function interleave(outfits: Outfit[]): Outfit[] {
  const groups = new Map<string, Outfit[]>();
  for (const o of outfits) {
    const k = (o.top ?? o.dress)!.id;
    groups.set(k, [...(groups.get(k) ?? []), o]);
  }
  const lists = [...groups.values()];
  const result: Outfit[] = [];
  for (let i = 0; result.length < outfits.length; i += 1) {
    for (const list of lists) if (list[i]) result.push(list[i]);
  }
  return result;
}

export interface Recommendation {
  item: GuestItem;
  gain: number;
}

export function recommend(
  picked: GuestItem[],
  pool: GuestItem[],
  limit = 3,
): Recommendation[] {
  const base = evaluate(picked).count;
  const ids = new Set(picked.map((x) => x.id));
  return pool
    .filter((x) => !ids.has(x.id))
    .map((item) => ({ item, gain: evaluate([...picked, item]).count - base }))
    .filter((r) => r.gain > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, limit);
}

// Чего не хватает до первого образа — для подсказки на шаге выбора.
export function missingRoles(
  items: GuestItem[],
): Array<"top" | "bottom" | "shoes"> {
  const has = (r: GuestItem["role"]) => items.some((x) => x.role === r);
  if (has("shoes") && (has("dress") || (has("top") && has("bottom"))))
    return [];
  const missing: Array<"top" | "bottom" | "shoes"> = [];
  if (!has("dress")) {
    if (!has("top")) missing.push("top");
    if (!has("bottom")) missing.push("bottom");
  }
  if (!has("shoes")) missing.push("shoes");
  return missing;
}
