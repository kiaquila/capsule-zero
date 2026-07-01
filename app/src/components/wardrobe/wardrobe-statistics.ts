export interface WardrobeStatisticItem {
  status: string;
}

export function isWardrobeStatisticItem<T extends WardrobeStatisticItem>(item: T): boolean {
  return item.status !== "for_sale" && item.status !== "for_repair";
}

export function updateWardrobeStatisticCountForStatusChange(
  count: number,
  previousStatus: string,
  nextStatus: string,
): number {
  const wasCounted = isWardrobeStatisticItem({ status: previousStatus });
  const isCounted = isWardrobeStatisticItem({ status: nextStatus });

  if (wasCounted === isCounted) {
    return count;
  }

  return Math.max(0, count + (isCounted ? 1 : -1));
}

export function updateWardrobeStatisticCountForRemoval<T extends WardrobeStatisticItem>(
  count: number,
  item: T,
): number {
  return isWardrobeStatisticItem(item) ? Math.max(0, count - 1) : count;
}
