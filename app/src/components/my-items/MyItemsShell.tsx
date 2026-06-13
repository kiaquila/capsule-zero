"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { WardrobeItemCard } from "@/components/wardrobe/WardrobeItemCard";
import { WardrobeItemDetailPanel } from "@/components/wardrobe/WardrobeItemDetailPanel";
import { isWardrobeStatisticItem } from "@/components/wardrobe/wardrobe-statistics";
import { signOutAction } from "@/features/auth/actions";
import { Link } from "@/i18n/navigation";
import type { ItemStatus } from "@/lib/providers";
import { cn } from "@/lib/utils";
import type { ColorGroup, ColorPoint } from "@/types";
import type { MyItemsEntry, MyItemsSnapshot } from "./my-items-data";

interface MyItemsShellProps {
  snapshot: MyItemsSnapshot;
}

type IconName =
  | "bag"
  | "ban"
  | "capsules"
  | "check"
  | "close"
  | "edit"
  | "for-repair"
  | "grid"
  | "heart"
  | "list"
  | "logout"
  | "more"
  | "my-items"
  | "plus"
  | "profile"
  | "settings"
  | "tag"
  | "trash";
type SortKey = "name" | "category" | "recent" | "price";
type DraftErrors = Partial<Record<"name" | "categoryId" | "colorHexes", string>>;

interface ItemDraftState {
  id?: string;
  name: string;
  categoryId: string;
  colorHexes: string[];
  brand: string;
  material: string;
  price: string;
}

interface MyItemsNavItem {
  href: string;
  icon: IconName;
  label: string;
  active?: boolean;
  badge?: number;
}

const DEFAULT_COLOR = "#8C8C8C";
const LOCAL_UPDATED_AT = "2026-06-09T15:00:00.000Z";

export function MyItemsShell({ snapshot }: MyItemsShellProps) {
  const t = useTranslations("myItems");
  const dashboardT = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();
  const [items, setItems] = useState(snapshot.items);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ItemDraftState | null>(null);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const wardrobeItems = useMemo(() => items.filter(isWardrobeStatisticItem), [items]);
  const counts = useMemo(() => buildCounts(items, snapshot.navigation), [items, snapshot.navigation]);
  const categories = useMemo(() => buildCategoryFilters(wardrobeItems), [wardrobeItems]);
  const colors = useMemo(() => buildColorFilters(wardrobeItems), [wardrobeItems]);
  const knownColors = useMemo(
    () => uniqueColorPoints([...snapshot.colors, ...wardrobeItems.flatMap((item) => item.colorPoints)]),
    [snapshot.colors, wardrobeItems],
  );
  const visibleItems = useMemo(
    () => filterAndSortItems(wardrobeItems, categoryFilter, colorFilter, sortKey),
    [categoryFilter, colorFilter, sortKey, wardrobeItems],
  );
  const selectedItem = selectedItemId
    ? items.find((item) => item.id === selectedItemId)
    : null;

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => setNotice(null), 3600);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  const navGroups: Array<{ label: string; items: MyItemsNavItem[] }> = [
    {
      label: dashboardT("nav.overview"),
      items: [
        {
          href: "/dashboard",
          icon: "grid",
          label: dashboardT("nav.dashboard"),
        },
      ],
    },
    {
      label: dashboardT("nav.wardrobe"),
      items: [
        {
          href: "/my-items",
          icon: "my-items",
          label: dashboardT("nav.myItems"),
          active: true,
          badge: counts.myItems,
        },
        {
          href: "/capsule-result?tab=outfits",
          icon: "bag",
          label: dashboardT("nav.outfits"),
          badge: counts.outfits,
        },
        {
          href: "/capsule-result",
          icon: "capsules",
          label: dashboardT("nav.capsules"),
          badge: counts.capsules,
        },
        {
          href: "/uncapsulated",
          icon: "ban",
          label: dashboardT("nav.uncapsulated"),
          badge: counts.uncapsulated,
        },
      ],
    },
    {
      label: dashboardT("nav.lists"),
      items: [
        {
          href: "/favorites",
          icon: "heart",
          label: dashboardT("nav.favorites"),
          badge: counts.favorites,
        },
        {
          href: "/capsule-result?tab=shopping",
          icon: "list",
          label: dashboardT("nav.shoppingList"),
          badge: counts.shoppingList,
        },
        {
          href: "/for-sale",
          icon: "tag",
          label: dashboardT("nav.forSale"),
          badge: counts.forSale,
        },
        {
          href: "/for-repair",
          icon: "for-repair",
          label: dashboardT("nav.forRepair"),
          badge: counts.forRepair,
        },
      ],
    },
  ];
  const moreItems: MyItemsNavItem[] = [
    {
      href: "/capsule-result?tab=outfits",
      icon: "bag",
      label: dashboardT("nav.outfits"),
      badge: counts.outfits,
    },
    {
      href: "/uncapsulated",
      icon: "ban",
      label: dashboardT("nav.uncapsulated"),
      badge: counts.uncapsulated,
    },
    {
      href: "/capsule-result?tab=shopping",
      icon: "list",
      label: dashboardT("nav.shoppingList"),
      badge: counts.shoppingList,
    },
    {
      href: "/for-sale",
      icon: "tag",
      label: dashboardT("nav.forSale"),
      badge: counts.forSale,
    },
    {
      href: "/for-repair",
      icon: "for-repair",
      label: dashboardT("nav.forRepair"),
      badge: counts.forRepair,
    },
    {
      href: "/profile",
      icon: "profile",
      label: dashboardT("nav.profile"),
    },
    {
      href: "/profile",
      icon: "settings",
      label: dashboardT("nav.settings"),
    },
  ];

  const signOut = async () => {
    await signOutAction();
    router.push(`/${locale}`);
    router.refresh();
  };

  const openExistingItem = (item: MyItemsEntry) => {
    setSelectedItemId(item.id);
    setDraft(buildDraftFromItem(item));
    setErrors({});
    setNotice(null);
  };

  const openNewItem = () => {
    setSelectedItemId("new");
    setDraft({
      name: "",
      categoryId: snapshot.categoryOptions[0]?.id ?? "shirt",
      colorHexes: [DEFAULT_COLOR],
      brand: "",
      material: "",
      price: "",
    });
    setErrors({});
    setNotice(null);
  };

  const closeDetail = () => {
    setSelectedItemId(null);
    setDraft(null);
    setErrors({});
  };

  const updateDraft = (input: Partial<ItemDraftState>) => {
    setDraft((current) => (current ? { ...current, ...input } : current));
    setErrors({});
  };

  const saveDraft = () => {
    if (!draft) {
      return;
    }

    const nextErrors = validateDraft(draft, t);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const normalized = normalizeDraft(draft, snapshot, knownColors);

    if (draft.id) {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === draft.id
            ? {
                ...item,
                ...normalized,
                updatedAt: LOCAL_UPDATED_AT,
              }
            : item,
        ),
      );
      setNotice(t("notice.saved", { item: normalized.name }));
    } else {
      const nextItem: MyItemsEntry = {
        id: `local-item-${items.length + 1}`,
        ...normalized,
        imageUrl: undefined,
        sourceType: "photo_upload",
        sourceUrl: undefined,
        status: "active",
        favorite: false,
        fromCatalog: false,
        isPublic: false,
        capsuleIds: [],
        capsules: [],
        updatedAt: LOCAL_UPDATED_AT,
      };
      setItems((currentItems) => [nextItem, ...currentItems]);
      setNotice(t("notice.added", { item: nextItem.name }));
      setSelectedItemId(nextItem.id);
      setDraft(buildDraftFromItem(nextItem));
    }
  };

  const toggleFavorite = (itemId: string) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, favorite: !item.favorite } : item,
      ),
    );
  };

  const moveSelectedItem = (status: Extract<ItemStatus, "for_sale" | "for_repair">) => {
    if (!draft?.id) {
      return;
    }

    const itemName = selectedItem?.name ?? draft.name;
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === draft.id
          ? {
              ...item,
              status,
              capsuleIds: [],
              capsules: [],
              updatedAt: LOCAL_UPDATED_AT,
            }
          : item,
      ),
    );
    setNotice(
      status === "for_sale"
        ? t("notice.movedSale", { item: itemName })
        : t("notice.movedRepair", { item: itemName }),
    );
    closeDetail();
  };

  const deleteSelectedItem = () => {
    if (!draft?.id) {
      return;
    }

    const itemId = draft.id;
    const itemName = selectedItem?.name ?? draft.name;
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
    setNotice(t("notice.deleted", { item: itemName }));
    closeDetail();
  };

  const removeColor = (index: number) => {
    if (!draft || draft.colorHexes.length <= 1) {
      return;
    }

    updateDraft({
      colorHexes: draft.colorHexes.filter((_, colorIndex) => colorIndex !== index),
    });
  };

  const updateColor = (index: number, value: string) => {
    if (!draft) {
      return;
    }

    updateDraft({
      colorHexes: draft.colorHexes.map((hex, colorIndex) =>
        colorIndex === index ? value.toUpperCase() : hex,
      ),
    });
  };

  const addColor = () => {
    if (!draft || draft.colorHexes.length >= 3) {
      return;
    }

    updateDraft({ colorHexes: [...draft.colorHexes, DEFAULT_COLOR] });
  };

  return (
    <div className="cz-page dashboard-page my-items-page">
      <div className="wallpaper-bg" />
      <div className="wallpaper-overlay" />

      <div className="dashboard-app">
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar-head">
            <Link className="dashboard-logo" href="/">
              Capsule Zero
            </Link>
            <div className="dashboard-user-row">
              <Link aria-label={dashboardT("nav.profile")} className="dashboard-avatar-link" href="/profile">
                <span className="dashboard-avatar">{snapshot.profile.initials}</span>
              </Link>
              <div className="dashboard-user-meta">
                <p className="dashboard-user-name">{snapshot.profile.displayName}</p>
                <p className="dashboard-user-email">{snapshot.profile.email}</p>
              </div>
            </div>
          </div>

          <nav className="dashboard-nav" aria-label={dashboardT("nav.main")}>
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="dashboard-nav-section">{group.label}</p>
                {group.items.map((item) => (
                  <Link
                    className={cn("dashboard-nav-item", item.active && "dashboard-nav-item-active")}
                    href={item.href}
                    key={`${group.label}-${item.label}`}
                  >
                    <span className="dashboard-nav-icon">
                      <MyItemsIcon name={item.icon} />
                    </span>
                    <span className="dashboard-nav-label">{item.label}</span>
                    {typeof item.badge === "number" ? (
                      <span className="dashboard-nav-badge">{item.badge}</span>
                    ) : null}
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          <div className="dashboard-sidebar-foot">
            <Link className="dashboard-nav-item" href="/profile">
              <span className="dashboard-nav-icon">
                <MyItemsIcon name="settings" />
              </span>
              <span className="dashboard-nav-label">{dashboardT("nav.settings")}</span>
            </Link>
            <button className="dashboard-nav-item dashboard-nav-button" onClick={signOut} type="button">
              <span className="dashboard-nav-icon">
                <MyItemsIcon name="logout" />
              </span>
              <span className="dashboard-nav-label">{dashboardT("logout")}</span>
            </button>
          </div>
        </aside>

        <main className="dashboard-main">
          <header className="dashboard-topbar my-items-topbar">
            <div>
              <h1 className="my-items-title">
                {t.rich("title", {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </h1>
              <p className="my-items-subtitle">{t("subtitle", { count: counts.myItems })}</p>
            </div>
            <div className="dashboard-topbar-actions">
              <LanguageSwitcher />
              <button className="dashboard-primary-action" onClick={openNewItem} type="button">
                <MyItemsIcon name="plus" />
                <span>{t("addItem")}</span>
              </button>
            </div>
          </header>

          <div className="my-items-content">
            <section className="my-items-filter-panel" aria-label={t("filters.label")}>
              <div className="my-items-filter-row">
                <div className="my-items-chip-row" aria-label={t("filters.categories")}>
                  <button
                    className={cn("my-items-chip", categoryFilter === "all" && "my-items-chip-active")}
                    onClick={() => setCategoryFilter("all")}
                    type="button"
                  >
                    {t("filters.allCategories")}
                  </button>
                  {categories.map((category) => (
                    <button
                      className={cn("my-items-chip", categoryFilter === category.id && "my-items-chip-active")}
                      key={category.id}
                      onClick={() => setCategoryFilter(category.id)}
                      type="button"
                    >
                      <span>{category.label}</span>
                      <small>{category.count}</small>
                    </button>
                  ))}
                </div>
                <label className="my-items-sort">
                  <span>{t("sort.label")}</span>
                  <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
                    <option value="name">{t("sort.name")}</option>
                    <option value="category">{t("sort.category")}</option>
                    <option value="recent">{t("sort.recent")}</option>
                    <option value="price">{t("sort.price")}</option>
                  </select>
                </label>
              </div>

              <div className="my-items-color-row" aria-label={t("filters.colors")}>
                <button
                  className={cn("my-items-color-filter", colorFilter === "all" && "my-items-color-filter-active")}
                  onClick={() => setColorFilter("all")}
                  type="button"
                >
                  {t("filters.allColors")}
                </button>
                {colors.map((color) => (
                  <button
                    aria-label={t("filters.color", { color: color.name })}
                    className={cn(
                      "my-items-color-filter my-items-color-dot-filter",
                      colorFilter === color.hex && "my-items-color-filter-active",
                    )}
                    key={`${color.hex}-${color.name}`}
                    onClick={() => setColorFilter(color.hex)}
                    title={color.name}
                    type="button"
                  >
                    <span style={{ backgroundColor: color.hex }} />
                    <small>{color.count}</small>
                  </button>
                ))}
              </div>
            </section>

            {visibleItems.length > 0 ? (
              <section className="my-items-grid" aria-label={t("gridLabel")}>
                {visibleItems.map((item) => (
                  <WardrobeItemCard
                    badges={[
                      ...(item.capsules.length > 0 ? [t("badges.capsule")] : []),
                      t(`statuses.${item.status}`),
                    ]}
                    favoriteLabel={t("favorite", { item: item.name })}
                    item={item}
                    itemColorsLabel={t("itemColors")}
                    key={item.id}
                    meta={item.brand ?? t(`sources.${item.sourceType}`)}
                    onOpen={() => openExistingItem(item)}
                    onFavorite={() => toggleFavorite(item.id)}
                    renderHeartIcon={() => <MyItemsIcon name="heart" />}
                  />
                ))}
                <button className="my-items-add-card" onClick={openNewItem} type="button">
                  <MyItemsIcon name="plus" />
                  <span>{t("addItem")}</span>
                </button>
              </section>
            ) : (
              <section className="my-items-empty">
                <span>
                  <MyItemsIcon name="my-items" />
                </span>
                <h2>{wardrobeItems.length ? t("empty.filteredTitle") : t("empty.title")}</h2>
                <p>{wardrobeItems.length ? t("empty.filteredCopy") : t("empty.copy")}</p>
                <button className="dashboard-primary-action" onClick={openNewItem} type="button">
                  <MyItemsIcon name="plus" />
                  <span>{t("addItem")}</span>
                </button>
              </section>
            )}
          </div>
        </main>
      </div>

      <nav className={cn("dashboard-bottom-nav", moreOpen && "dashboard-bottom-nav-menu-open")} aria-label={dashboardT("nav.mobile")}>
        <BottomNavLink href="/dashboard" icon="grid" label={dashboardT("nav.dashboard")} />
        <BottomNavLink active href="/my-items" icon="my-items" label={dashboardT("nav.myItems")} />
        <BottomNavLink href="/capsule-result" icon="capsules" label={dashboardT("nav.capsules")} />
        <BottomNavLink href="/favorites" icon="heart" label={dashboardT("nav.favorites")} />
        <button
          aria-expanded={moreOpen}
          aria-label={dashboardT("nav.more")}
          className="dashboard-bottom-item dashboard-bottom-button"
          onClick={() => setMoreOpen((value) => !value)}
          type="button"
        >
          <span className="dashboard-bottom-icon">
            <MyItemsIcon name="more" />
          </span>
          <span className="dashboard-bottom-label">{dashboardT("nav.more")}</span>
        </button>
      </nav>

      <button
        aria-label={dashboardT("closeMore")}
        className={cn("dashboard-more-overlay", moreOpen && "dashboard-more-overlay-open")}
        onClick={() => setMoreOpen(false)}
        type="button"
      />
      <div className={cn("dashboard-more-sheet", moreOpen && "dashboard-more-sheet-open")}>
        <div className="dashboard-more-handle" />
        <div className="dashboard-more-grid">
          {moreItems.map((item) => (
            <Link
              className="dashboard-more-item"
              href={item.href}
              key={`${item.href}-${item.label}`}
              onClick={() => setMoreOpen(false)}
            >
              <span className="dashboard-more-icon">
                <MyItemsIcon name={item.icon} />
              </span>
              <span className="dashboard-more-label">{item.label}</span>
              {typeof item.badge === "number" ? (
                <span className="dashboard-more-badge">{item.badge}</span>
              ) : null}
            </Link>
          ))}
        </div>
      </div>

      {draft ? (
        <WardrobeItemDetailPanel
          categoryOptions={snapshot.categoryOptions}
          deleteAction={
            selectedItem
              ? {
                  className: "my-items-secondary-button my-items-delete-button",
                  label: t("detail.delete"),
                  onClick: deleteSelectedItem,
                }
              : undefined
          }
          draft={draft}
          errors={errors}
          extraFields={
            selectedItem ? (
              <div className="my-items-membership">
                <p>{t("detail.capsules")}</p>
                {selectedItem.capsules.length > 0 ? (
                  selectedItem.capsules.map((capsule) => (
                    <div className="my-items-capsule-row" key={capsule.id}>
                      <span className="my-items-capsule-palette">
                        {capsule.palette.slice(0, 5).map((color) => (
                          <span key={`${capsule.id}-${color.hex}`} style={{ backgroundColor: color.hex }} />
                        ))}
                      </span>
                      <span>{capsule.name}</span>
                      {capsule.active ? <small>{t("detail.active")}</small> : null}
                    </div>
                  ))
                ) : (
                  <div className="my-items-no-capsules">{t("detail.noCapsules")}</div>
                )}
              </div>
            ) : null
          }
          labels={{
            addColor: t("detail.addColor"),
            brand: t("detail.brand"),
            category: t("detail.category"),
            changePhoto: t("detail.changePhoto"),
            close: t("detail.close"),
            color: (count) => t("detail.color", { count }),
            colors: t("detail.colors"),
            dialogLabel: selectedItem ? t("detail.editTitle") : t("detail.newTitle"),
            material: t("detail.material"),
            name: t("detail.name"),
            photoFallback: t("detail.photoFallback"),
            price: t("detail.price"),
            removeColor: t("detail.removeColor"),
            save: t("detail.save"),
            title: selectedItem ? t("detail.editTitle") : t("detail.newTitle"),
          }}
          onAddColor={addColor}
          onChange={updateDraft}
          onClose={closeDetail}
          onColorChange={updateColor}
          onRemoveColor={removeColor}
          onSave={saveDraft}
          renderIcon={(name) => <MyItemsIcon name={name} />}
          actionSlot={
            selectedItem ? (
              <>
                <button className="my-items-secondary-button" onClick={() => moveSelectedItem("for_sale")} type="button">
                  <MyItemsIcon name="tag" />
                  <span>{t("detail.moveSale")}</span>
                </button>
                <button className="my-items-secondary-button" onClick={() => moveSelectedItem("for_repair")} type="button">
                  <MyItemsIcon name="for-repair" />
                  <span>{t("detail.moveRepair")}</span>
                </button>
              </>
            ) : null
          }
        />
      ) : null}

      {notice ? (
        <div className="my-items-toast" role="status" aria-live="polite">
          {notice}
        </div>
      ) : null}
    </div>
  );
}

function BottomNavLink({
  active,
  href,
  icon,
  label,
}: {
  active?: boolean;
  href: string;
  icon: IconName;
  label: string;
}) {
  return (
    <Link className={cn("dashboard-bottom-item", active && "dashboard-bottom-item-active")} href={href}>
      <span className="dashboard-bottom-icon">
        <MyItemsIcon name={icon} />
      </span>
      <span className="dashboard-bottom-label">{label}</span>
    </Link>
  );
}

function buildCounts(
  items: MyItemsEntry[],
  base: MyItemsSnapshot["navigation"],
): MyItemsSnapshot["navigation"] {
  const wardrobeItems = items.filter(isWardrobeStatisticItem);

  return {
    ...base,
    myItems: wardrobeItems.length,
    uncapsulated: items.filter((item) => item.status === "uncapsulated").length,
    favorites: items.filter((item) => item.favorite).length,
    forSale: items.filter((item) => item.status === "for_sale").length,
    forRepair: items.filter((item) => item.status === "for_repair").length,
  };
}

function buildCategoryFilters(items: MyItemsEntry[]) {
  const counts = new Map<string, { id: string; label: string; count: number }>();

  items.forEach((item) => {
    const existing = counts.get(item.categoryId);
    counts.set(item.categoryId, {
      id: item.categoryId,
      label: item.categoryLabel,
      count: (existing?.count ?? 0) + 1,
    });
  });

  return [...counts.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function buildColorFilters(items: MyItemsEntry[]) {
  const counts = new Map<string, ColorPoint & { count: number }>();

  items.forEach((item) => {
    item.colorPoints.forEach((color) => {
      const key = color.hex.toUpperCase();
      counts.set(key, {
        ...color,
        hex: key,
        count: (counts.get(key)?.count ?? 0) + 1,
      });
    });
  });

  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function uniqueColorPoints(colors: ColorPoint[]): ColorPoint[] {
  const byHex = new Map<string, ColorPoint>();

  colors.forEach((color) => {
    byHex.set(color.hex.toUpperCase(), { ...color, hex: color.hex.toUpperCase() });
  });

  return [...byHex.values()];
}

function filterAndSortItems(
  items: MyItemsEntry[],
  categoryFilter: string,
  colorFilter: string,
  sortKey: SortKey,
) {
  const filtered = items
    .filter((item) => categoryFilter === "all" || item.categoryId === categoryFilter)
    .filter((item) =>
      colorFilter === "all"
        ? true
        : item.colorPoints.some((color) => color.hex.toUpperCase() === colorFilter),
    );

  return [...filtered].sort((a, b) => {
    if (sortKey === "category") {
      return a.categoryLabel.localeCompare(b.categoryLabel) || a.name.localeCompare(b.name);
    }

    if (sortKey === "recent") {
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    }

    if (sortKey === "price") {
      return (b.price ?? -1) - (a.price ?? -1) || a.name.localeCompare(b.name);
    }

    return a.name.localeCompare(b.name);
  });
}

function buildDraftFromItem(item: MyItemsEntry): ItemDraftState {
  return {
    id: item.id,
    name: item.name,
    categoryId: item.categoryId,
    colorHexes: item.colorPoints.map((color) => color.hex.toUpperCase()).slice(0, 3),
    brand: item.brand ?? "",
    material: item.material ?? "",
    price: typeof item.price === "number" ? String(item.price) : "",
  };
}

function validateDraft(
  draft: ItemDraftState,
  t: ReturnType<typeof useTranslations<"myItems">>,
): DraftErrors {
  const errors: DraftErrors = {};

  if (!draft.name.trim()) {
    errors.name = t("validation.name");
  }

  if (!draft.categoryId) {
    errors.categoryId = t("validation.category");
  }

  if (!draft.colorHexes.length) {
    errors.colorHexes = t("validation.colorsRequired");
  }

  if (draft.colorHexes.length > 3) {
    errors.colorHexes = t("validation.colorsMax");
  }

  return errors;
}

function normalizeDraft(
  draft: ItemDraftState,
  snapshot: MyItemsSnapshot,
  knownColors: ColorPoint[],
): Pick<
  MyItemsEntry,
  "name" | "categoryId" | "categoryLabel" | "section" | "colorPoints" | "brand" | "material" | "price"
> {
  const category = snapshot.categoryOptions.find((item) => item.id === draft.categoryId);
  const price = Number(draft.price);

  return {
    name: draft.name.trim(),
    categoryId: draft.categoryId,
    categoryLabel: category?.label ?? draft.categoryId,
    section: "custom",
    colorPoints: draft.colorHexes.map((hex) => buildColorPoint(hex, knownColors)),
    brand: draft.brand.trim() || undefined,
    material: draft.material.trim() || undefined,
    price: Number.isFinite(price) && draft.price.trim() ? price : undefined,
  };
}

function buildColorPoint(hex: string, knownColors: ColorPoint[]): ColorPoint {
  const normalizedHex = hex.toUpperCase();
  const existing = knownColors.find((color) => color.hex.toUpperCase() === normalizedHex);

  if (existing) {
    return existing;
  }

  const { group, isAchromatic } = inferColorGroup(normalizedHex);

  return {
    hex: normalizedHex,
    name: normalizedHex,
    temperature: "neutral",
    group,
    shade: group,
    hue: isAchromatic ? "achromatic" : "blue",
    isAchromatic,
  };
}

function inferColorGroup(hex: string): {
  group: ColorGroup;
  isAchromatic: boolean;
} {
  const value = hex.replace("#", "");
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const saturation = max === 0 ? 0 : (max - min) / max;
  const isAchromatic = saturation < 0.08;

  if (isAchromatic) {
    return { group: "achromatic", isAchromatic };
  }

  if (luminance < 0.36) {
    return { group: "dark", isAchromatic };
  }

  if (luminance > 0.78 && saturation < 0.45) {
    return { group: "pastel", isAchromatic };
  }

  if (saturation < 0.45) {
    return { group: "desaturated", isAchromatic };
  }

  return { group: "bright", isAchromatic };
}

function MyItemsIcon({ name }: { name: IconName }) {
  const common = {
    "aria-hidden": true,
    fill: "none",
    height: 18,
    viewBox: "0 0 24 24",
    width: 18,
  };

  switch (name) {
    case "bag":
      return (
        <svg {...common}>
          <path d="M6.5 3.5h3C9.5 4.9 10.6 6 12 6s2.5-1.1 2.5-2.5h3L22 8l-3 3-2-2v12H7V9l-2 2-3-3 4.5-4.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
        </svg>
      );
    case "ban":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
          <path d="m6.4 6.4 11.2 11.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </svg>
      );
    case "capsules":
      return (
        <svg aria-hidden fill="none" height="18" viewBox="0 0 17 17" width="18">
          <path d="M2.5 3.5H7C7 2 6 .5 8 .5s1 1.5 1 3h4v3.5c1.5 0 3-1 3 1s-1.5 1-3 1V14H9c0-1.5 1-3-1-3s-1 1.5-1 3H2.5V9C4 9 5 10 5 8s-1-1-2.5-1V3.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.3" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      );
    case "edit":
      return (
        <svg {...common}>
          <path d="M15.5 4.5 19.5 8.5 8 20H4v-4L15.5 4.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
      );
    case "for-repair":
      return (
        <svg {...common}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      );
    case "grid":
      return (
        <svg {...common}>
          <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" width="7" x="3" y="3" />
          <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" width="7" x="14" y="3" />
          <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" width="7" x="3" y="14" />
          <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" width="7" x="14" y="14" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="m12 20-7-7a4.2 4.2 0 0 1 6-6l1 1 1-1a4.2 4.2 0 0 1 6 6l-7 7Z" fill="currentColor" fillOpacity="var(--icon-fill-opacity, 0)" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
      );
    case "list":
      return (
        <svg {...common}>
          <path d="M5 7h14M5 12h11M5 17h8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M10 5V4a2 2 0 0 1 2-2h7v20h-7a2 2 0 0 1-2-2v-1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M3 12h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="m10 8 4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      );
    case "more":
      return (
        <svg {...common} fill="currentColor">
          <circle cx="6" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="18" cy="12" r="1.8" />
        </svg>
      );
    case "my-items":
      return (
        <svg aria-hidden fill="none" height="18" viewBox="0 0 17 17" width="18">
          <rect height="9" rx="1" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" width="12" x="2.5" y="6" />
          <path d="m2.5 6 2.5-3.5h7L14.5 6" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" />
          <path d="M8.5 2.5V6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
          <path d="M4.5 21a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
          <path d="M19 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.5-2.4 1a7.5 7.5 0 0 0-1.9-1.1L14.3 3h-4.6l-.3 2.8a7.5 7.5 0 0 0-1.9 1.1l-2.4-1-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.1l-2 1.5 2 3.5 2.4-1c.6.5 1.2.9 1.9 1.1l.3 2.8h4.6l.3-2.8c.7-.3 1.3-.6 1.9-1.1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1.1Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="M4 5v6.2L12.8 20 20 12.8 11.2 4H5a1 1 0 0 0-1 1Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
          <circle cx="8" cy="8" r="1.2" fill="currentColor" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M4 7h16M9 7V4h6v3M8 10v8M12 10v8M16 10v8M6 7l1 14h10l1-14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
      );
  }
}
