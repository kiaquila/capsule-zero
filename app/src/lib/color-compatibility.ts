import type { ColorGroup } from "@/types";

interface GroupedColor {
  group: ColorGroup;
}

export function areColorGroupsCompatible(
  first: ColorGroup,
  second: ColorGroup,
): boolean {
  if (first === "achromatic" || second === "achromatic") {
    return true;
  }

  if (first === second) {
    return true;
  }

  return (
    (first === "desaturated" && second === "dark") ||
    (first === "dark" && second === "desaturated")
  );
}

export function isDominantColorCompatibleWithPalette(
  itemColors: GroupedColor[],
  palette: GroupedColor[],
): boolean {
  const dominantColor = itemColors[0];

  if (!dominantColor) {
    return true;
  }

  return palette.every((paletteColor) =>
    areColorGroupsCompatible(dominantColor.group, paletteColor.group),
  );
}
