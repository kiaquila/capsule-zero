export interface WardrobeStatisticItem {
  status: string;
}

export function isWardrobeStatisticItem<T extends WardrobeStatisticItem>(item: T): boolean {
  return item.status !== "for_sale";
}

