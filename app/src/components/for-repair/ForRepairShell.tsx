"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import type { MyItemsEntry } from "@/components/my-items/my-items-data";
import { WardrobeItemCard } from "@/components/wardrobe/WardrobeItemCard";
import {
  WardrobeDetailField,
  WardrobeItemDetailPanel,
} from "@/components/wardrobe/WardrobeItemDetailPanel";
import {
  updateWardrobeStatisticCountForRemoval,
  updateWardrobeStatisticCountForStatusChange,
} from "@/components/wardrobe/wardrobe-statistics";
import { signOutAction } from "@/features/auth/actions";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ColorGroup, ColorPoint } from "@/types";
import type { ForRepairSnapshot } from "./for-repair-data";

interface ForRepairShellProps {
  snapshot: ForRepairSnapshot;
}

type IconName =
  | "bag"
  | "ban"
  | "capsules"
  | "check"
  | "close"
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
type DraftErrors = Partial<
  Record<"name" | "categoryId" | "colorHexes" | "photo", string>
>;

interface ItemDraftState {
  id: string;
  name: string;
  categoryId: string;
  colorHexes: string[];
  brand: string;
  material: string;
  price: string;
  imageUrl?: string;
  repairNote: string;
}

interface ForRepairNavItem {
  href: string;
  icon: IconName;
  label: string;
  active?: boolean;
  badge?: number;
}

const DEFAULT_COLOR = "#8C8C8C";
const LOCAL_UPDATED_AT = "2026-06-14T12:00:00.000Z";
const MAX_LOCAL_PHOTO_BYTES = 10 * 1024 * 1024;
const SUPPORTED_LOCAL_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function ForRepairShell({ snapshot }: ForRepairShellProps) {
  const t = useTranslations("forRepair");
  const dashboardT = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();
  const [items, setItems] = useState(snapshot.items);
  const [navigation, setNavigation] = useState(snapshot.navigation);
  const [repairNotes, setRepairNotes] = useState<Record<string, string>>({});
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ItemDraftState | null>(null);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const localPhotoUrlsRef = useRef(new Set<string>());

  const categories = useMemo(() => buildCategoryFilters(items), [items]);
  const colors = useMemo(() => buildColorFilters(items), [items]);
  const knownColors = useMemo(
    () => uniqueColorPoints(items.flatMap((item) => item.colorPoints)),
    [items],
  );
  const visibleItems = useMemo(
    () => filterAndSortItems(items, categoryFilter, colorFilter, sortKey),
    [categoryFilter, colorFilter, items, sortKey],
  );
  const selectedItem = selectedItemId
    ? (items.find((item) => item.id === selectedItemId) ?? null)
    : null;

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => setNotice(null), 3600);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const localPhotoUrls = localPhotoUrlsRef.current;

    return () => {
      localPhotoUrls.forEach((url) => URL.revokeObjectURL(url));
      localPhotoUrls.clear();
    };
  }, []);

  const navGroups: Array<{ label: string; items: ForRepairNavItem[] }> = [
    {
      label: dashboardT("nav.overview"),
      items: [
        {
          href: "/dashboard",
          icon: "grid",
          label: dashboardT("nav.dashboard"),
        },
        {
          href: "/my-items",
          icon: "my-items",
          label: dashboardT("nav.myItems"),
          badge: navigation.myItems,
        },
        {
          href: "/capsule-result?tab=outfits",
          icon: "bag",
          label: dashboardT("nav.outfits"),
          badge: navigation.outfits,
        },
        {
          href: "/capsule-result",
          icon: "capsules",
          label: dashboardT("nav.capsules"),
          badge: navigation.capsules,
        },
        {
          href: "/uncapsulated",
          icon: "ban",
          label: dashboardT("nav.uncapsulated"),
          badge: navigation.uncapsulated,
        },
        {
          href: "/favorites",
          icon: "heart",
          label: dashboardT("nav.favorites"),
          badge: navigation.favorites,
        },
      ],
    },
    {
      label: dashboardT("nav.lists"),
      items: [
        {
          href: "/capsule-result?tab=shopping",
          icon: "list",
          label: dashboardT("nav.shoppingList"),
          badge: navigation.shoppingList,
        },
        {
          href: "/for-sale",
          icon: "tag",
          label: dashboardT("nav.forSale"),
          badge: navigation.forSale,
        },
        {
          href: "/for-repair",
          icon: "for-repair",
          label: dashboardT("nav.forRepair"),
          active: true,
          badge: navigation.forRepair,
        },
      ],
    },
  ];
  const moreItems: ForRepairNavItem[] = [
    {
      href: "/capsule-result?tab=outfits",
      icon: "bag",
      label: dashboardT("nav.outfits"),
      badge: navigation.outfits,
    },
    {
      href: "/uncapsulated",
      icon: "ban",
      label: dashboardT("nav.uncapsulated"),
      badge: navigation.uncapsulated,
    },
    {
      href: "/capsule-result?tab=shopping",
      icon: "list",
      label: dashboardT("nav.shoppingList"),
      badge: navigation.shoppingList,
    },
    {
      href: "/for-sale",
      icon: "tag",
      label: dashboardT("nav.forSale"),
      badge: navigation.forSale,
    },
    {
      href: "/for-repair",
      icon: "for-repair",
      label: dashboardT("nav.forRepair"),
      active: true,
      badge: navigation.forRepair,
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

  const openItem = (item: MyItemsEntry) => {
    setSelectedItemId(item.id);
    setDraft(buildDraftFromItem(item, repairNotes[item.id] ?? ""));
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

    setErrors({});

    const normalized = normalizeDraft(draft, snapshot, knownColors);

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === draft.id
          ? {
              ...item,
              ...normalized,
              imageUrl: draft.imageUrl,
              updatedAt: LOCAL_UPDATED_AT,
            }
          : item,
      ),
    );
    setRepairNotes((current) => ({
      ...current,
      [draft.id]: draft.repairNote.trim(),
    }));
    setNotice(t("notice.saved", { item: normalized.name }));
  };

  const toggleFavorite = (itemId: string) => {
    const item = items.find((currentItem) => currentItem.id === itemId);

    if (!item) {
      return;
    }

    const nextFavorite = !item.favorite;
    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === itemId
          ? {
              ...currentItem,
              favorite: nextFavorite,
              updatedAt: LOCAL_UPDATED_AT,
            }
          : currentItem,
      ),
    );
    setNavigation((currentNavigation) => ({
      ...currentNavigation,
      favorites: Math.max(
        0,
        currentNavigation.favorites + (nextFavorite ? 1 : -1),
      ),
    }));
  };

  const markFixed = (item: MyItemsEntry) => {
    setItems((currentItems) =>
      currentItems.filter((currentItem) => currentItem.id !== item.id),
    );
    setRepairNotes((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    setNavigation((currentNavigation) => ({
      ...currentNavigation,
      myItems: updateWardrobeStatisticCountForStatusChange(
        currentNavigation.myItems,
        item.status,
        "uncapsulated",
      ),
      uncapsulated: currentNavigation.uncapsulated + 1,
      forRepair: Math.max(0, currentNavigation.forRepair - 1),
    }));
    closeDetail();
    setNotice(t("notice.fixed", { item: item.name }));
  };

  const deleteItem = (item: MyItemsEntry) => {
    setItems((currentItems) =>
      currentItems.filter((currentItem) => currentItem.id !== item.id),
    );
    setRepairNotes((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    setNavigation((currentNavigation) => ({
      ...currentNavigation,
      myItems: updateWardrobeStatisticCountForRemoval(
        currentNavigation.myItems,
        item,
      ),
      forRepair: Math.max(0, currentNavigation.forRepair - 1),
      favorites: item.favorite
        ? Math.max(0, currentNavigation.favorites - 1)
        : currentNavigation.favorites,
    }));
    closeDetail();
    setNotice(t("notice.deleted", { item: item.name }));
  };

  const removeColor = (index: number) => {
    if (!draft || draft.colorHexes.length <= 1) {
      return;
    }

    updateDraft({
      colorHexes: draft.colorHexes.filter(
        (_, colorIndex) => colorIndex !== index,
      ),
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

  const handlePhotoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file || !draft) {
      return;
    }

    if (!SUPPORTED_LOCAL_PHOTO_TYPES.has(file.type)) {
      setErrors({ photo: t("validation.photoType") });
      return;
    }

    if (file.size > MAX_LOCAL_PHOTO_BYTES) {
      setErrors({ photo: t("validation.photoSize") });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    localPhotoUrlsRef.current.add(previewUrl);
    updateDraft({ imageUrl: previewUrl });
    setNotice(t("notice.photoReady"));
  };

  return (
    <div className="cz-page dashboard-page my-items-page for-repair-page">
      <div className="wallpaper-bg" />
      <div className="wallpaper-overlay" />

      <div className="dashboard-app">
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar-head">
            <Link className="dashboard-logo" href="/">
              Capsule Zero
            </Link>
            <div className="dashboard-user-row">
              <Link
                aria-label={dashboardT("nav.profile")}
                className="dashboard-avatar-link"
                href="/profile"
              >
                <span className="dashboard-avatar">
                  {snapshot.profile.initials}
                </span>
              </Link>
              <div className="dashboard-user-meta">
                <p className="dashboard-user-name">
                  {snapshot.profile.displayName}
                </p>
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
                    className={cn(
                      "dashboard-nav-item",
                      item.active && "dashboard-nav-item-active",
                    )}
                    href={item.href}
                    key={`${group.label}-${item.label}`}
                  >
                    <span className="dashboard-nav-icon">
                      <ForRepairIcon name={item.icon} />
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
                <ForRepairIcon name="settings" />
              </span>
              <span className="dashboard-nav-label">
                {dashboardT("nav.settings")}
              </span>
            </Link>
            <button
              className="dashboard-nav-item dashboard-nav-button"
              onClick={signOut}
              type="button"
            >
              <span className="dashboard-nav-icon">
                <ForRepairIcon name="logout" />
              </span>
              <span className="dashboard-nav-label">
                {dashboardT("logout")}
              </span>
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
              <p className="my-items-subtitle">
                {t("subtitle", { count: navigation.forRepair })}
              </p>
            </div>
            <div className="dashboard-topbar-actions">
              <LanguageSwitcher />
              <Link className="dashboard-primary-action" href="/my-items">
                <ForRepairIcon name="my-items" />
                <span>{t("openMyItems")}</span>
              </Link>
            </div>
          </header>

          <div className="my-items-content for-repair-content">
            <section
              className="for-sale-info for-repair-info"
              aria-label={t("infoLabel")}
            >
              <span className="for-sale-info-icon" aria-hidden="true">
                i
              </span>
              <p>{t("info")}</p>
            </section>

            <section
              className="my-items-filter-panel"
              aria-label={t("filters.label")}
            >
              <div className="my-items-filter-row">
                <div
                  className="my-items-chip-row"
                  aria-label={t("filters.categories")}
                >
                  <button
                    className={cn(
                      "my-items-chip",
                      categoryFilter === "all" && "my-items-chip-active",
                    )}
                    onClick={() => setCategoryFilter("all")}
                    type="button"
                  >
                    {t("filters.allCategories")}
                  </button>
                  {categories.map((category) => (
                    <button
                      className={cn(
                        "my-items-chip",
                        categoryFilter === category.id &&
                          "my-items-chip-active",
                      )}
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
                  <select
                    value={sortKey}
                    onChange={(event) =>
                      setSortKey(event.target.value as SortKey)
                    }
                  >
                    <option value="name">{t("sort.name")}</option>
                    <option value="category">{t("sort.category")}</option>
                    <option value="recent">{t("sort.recent")}</option>
                    <option value="price">{t("sort.price")}</option>
                  </select>
                </label>
              </div>

              <div
                className="my-items-color-row"
                aria-label={t("filters.colors")}
              >
                <button
                  className={cn(
                    "my-items-color-filter",
                    colorFilter === "all" && "my-items-color-filter-active",
                  )}
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
                      colorFilter === color.hex &&
                        "my-items-color-filter-active",
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
                    badges={[t(`statuses.${item.status}`)]}
                    favoriteLabel={t("favorite", { item: item.name })}
                    item={item}
                    itemColorsLabel={t("itemColors")}
                    key={item.id}
                    meta={item.brand ?? t(`sources.${item.sourceType}`)}
                    onFavorite={() => toggleFavorite(item.id)}
                    onOpen={() => openItem(item)}
                    renderHeartIcon={() => <ForRepairIcon name="heart" />}
                  />
                ))}
              </section>
            ) : (
              <section className="my-items-empty for-repair-empty">
                <span>
                  <ForRepairIcon name="for-repair" />
                </span>
                <h2>
                  {items.length ? t("empty.filteredTitle") : t("empty.title")}
                </h2>
                <p>
                  {items.length ? t("empty.filteredCopy") : t("empty.copy")}
                </p>
                <Link className="dashboard-primary-action" href="/my-items">
                  <ForRepairIcon name="my-items" />
                  <span>{t("openMyItems")}</span>
                </Link>
              </section>
            )}
          </div>
        </main>
      </div>

      <nav
        className={cn(
          "dashboard-bottom-nav",
          moreOpen && "dashboard-bottom-nav-menu-open",
        )}
        aria-label={dashboardT("nav.mobile")}
      >
        <BottomNavLink
          href="/dashboard"
          icon="grid"
          label={dashboardT("nav.dashboard")}
        />
        <BottomNavLink
          href="/my-items"
          icon="my-items"
          label={dashboardT("nav.myItems")}
        />
        <BottomNavLink
          href="/capsule-result"
          icon="capsules"
          label={dashboardT("nav.capsules")}
        />
        <BottomNavLink
          href="/favorites"
          icon="heart"
          label={dashboardT("nav.favorites")}
        />
        <button
          aria-expanded={moreOpen}
          aria-label={dashboardT("nav.more")}
          className="dashboard-bottom-item dashboard-bottom-button dashboard-bottom-item-active"
          onClick={() => setMoreOpen((value) => !value)}
          type="button"
        >
          <span className="dashboard-bottom-icon">
            <ForRepairIcon name="more" />
          </span>
          <span className="dashboard-bottom-label">
            {dashboardT("nav.more")}
          </span>
        </button>
      </nav>

      <button
        aria-label={dashboardT("closeMore")}
        className={cn(
          "dashboard-more-overlay",
          moreOpen && "dashboard-more-overlay-open",
        )}
        onClick={() => setMoreOpen(false)}
        type="button"
      />
      <div
        className={cn(
          "dashboard-more-sheet",
          moreOpen && "dashboard-more-sheet-open",
        )}
      >
        <div className="dashboard-more-handle" />
        <div className="dashboard-more-grid">
          {moreItems.map((item) => (
            <Link
              className={cn(
                "dashboard-more-item",
                item.active && "dashboard-more-item-active",
              )}
              href={item.href}
              key={`${item.href}-${item.label}`}
              onClick={() => setMoreOpen(false)}
            >
              <span className="dashboard-more-icon">
                <ForRepairIcon name={item.icon} />
              </span>
              <span className="dashboard-more-label">{item.label}</span>
              {typeof item.badge === "number" ? (
                <span className="dashboard-more-badge">{item.badge}</span>
              ) : null}
            </Link>
          ))}
        </div>
      </div>

      {selectedItem && draft ? (
        <WardrobeItemDetailPanel
          categoryOptions={snapshot.categoryOptions}
          deleteAction={{
            className: "my-items-secondary-button for-repair-delete-button",
            label: t("detail.delete"),
            onClick: () => deleteItem(selectedItem),
          }}
          draft={draft}
          errors={errors}
          extraFields={
            <>
              <WardrobeDetailField
                label={t("detail.source")}
                value={t(`sources.${selectedItem.sourceType}`)}
              />
              <WardrobeDetailField
                label={t("detail.status")}
                value={t(`statuses.${selectedItem.status}`)}
              />
              <label className="my-items-field for-repair-note-field">
                <span>{t("detail.repairNotes")}</span>
                <textarea
                  onChange={(event) =>
                    updateDraft({ repairNote: event.target.value })
                  }
                  placeholder={t("detail.repairNotesPlaceholder")}
                  value={draft.repairNote}
                />
              </label>
              <div className="my-items-membership">
                <p>{t("detail.capsules")}</p>
                <div className="my-items-no-capsules">
                  {t("detail.noCapsules")}
                </div>
              </div>
            </>
          }
          labels={{
            addColor: t("detail.addColor"),
            brand: t("detail.brand"),
            category: t("detail.category"),
            changePhoto: t("detail.changePhoto"),
            close: t("detail.close"),
            color: (count) => t("detail.color", { count }),
            colors: t("detail.colors"),
            dialogLabel: t("detail.title", { item: selectedItem.name }),
            material: t("detail.material"),
            name: t("detail.name"),
            photoFallback: t("detail.photoFallback"),
            price: t("detail.price"),
            removeColor: t("detail.removeColor"),
            save: t("detail.save"),
            title: t("detail.editTitle"),
          }}
          onAddColor={addColor}
          onChange={updateDraft}
          onClose={closeDetail}
          onColorChange={updateColor}
          onPhotoUpload={handlePhotoUpload}
          onRemoveColor={removeColor}
          onSave={saveDraft}
          photoInputRef={photoInputRef}
          renderIcon={(name) => <ForRepairIcon name={name} />}
          actionSlot={
            <button
              className="my-items-secondary-button"
              onClick={() => markFixed(selectedItem)}
              type="button"
            >
              <ForRepairIcon name="check" />
              <span>{t("detail.markFixed")}</span>
            </button>
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
    <Link
      className={cn(
        "dashboard-bottom-item",
        active && "dashboard-bottom-item-active",
      )}
      href={href}
    >
      <span className="dashboard-bottom-icon">
        <ForRepairIcon name={icon} />
      </span>
      <span className="dashboard-bottom-label">{label}</span>
    </Link>
  );
}

function buildDraftFromItem(
  item: MyItemsEntry,
  repairNote: string,
): ItemDraftState {
  return {
    id: item.id,
    name: item.name,
    categoryId: item.categoryId,
    colorHexes: item.colorPoints
      .map((color) => color.hex.toUpperCase())
      .slice(0, 3),
    brand: item.brand ?? "",
    material: item.material ?? "",
    price: typeof item.price === "number" ? String(item.price) : "",
    imageUrl: item.imageUrl,
    repairNote,
  };
}

function validateDraft(
  draft: ItemDraftState,
  t: ReturnType<typeof useTranslations<"forRepair">>,
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
  snapshot: ForRepairSnapshot,
  knownColors: ColorPoint[],
): Pick<
  MyItemsEntry,
  | "name"
  | "categoryId"
  | "categoryLabel"
  | "section"
  | "colorPoints"
  | "brand"
  | "material"
  | "price"
> {
  const category = snapshot.categoryOptions.find(
    (item) => item.id === draft.categoryId,
  );
  const price = Number(draft.price);

  return {
    name: draft.name.trim(),
    categoryId: draft.categoryId,
    categoryLabel: category?.label ?? draft.categoryId,
    section: "custom",
    colorPoints: draft.colorHexes.map((hex) =>
      buildColorPoint(hex, knownColors),
    ),
    brand: draft.brand.trim() || undefined,
    material: draft.material.trim() || undefined,
    price: Number.isFinite(price) && draft.price.trim() ? price : undefined,
  };
}

function buildColorPoint(hex: string, knownColors: ColorPoint[]): ColorPoint {
  const normalizedHex = hex.toUpperCase();
  const existing = knownColors.find(
    (color) => color.hex.toUpperCase() === normalizedHex,
  );

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

function uniqueColorPoints(colors: ColorPoint[]): ColorPoint[] {
  const byHex = new Map<string, ColorPoint>();

  colors.forEach((color) => {
    byHex.set(color.hex.toUpperCase(), {
      ...color,
      hex: color.hex.toUpperCase(),
    });
  });

  return [...byHex.values()];
}

function buildCategoryFilters(
  items: MyItemsEntry[],
): ForRepairSnapshot["categories"] {
  const counts = new Map<
    string,
    { id: string; label: string; count: number }
  >();

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

  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

function filterAndSortItems(
  items: MyItemsEntry[],
  categoryFilter: string,
  colorFilter: string,
  sortKey: SortKey,
): MyItemsEntry[] {
  const filtered = items
    .filter(
      (item) => categoryFilter === "all" || item.categoryId === categoryFilter,
    )
    .filter((item) =>
      colorFilter === "all"
        ? true
        : item.colorPoints.some(
            (color) => color.hex.toUpperCase() === colorFilter,
          ),
    );

  return [...filtered].sort((a, b) => {
    if (sortKey === "category") {
      return (
        a.categoryLabel.localeCompare(b.categoryLabel) ||
        a.name.localeCompare(b.name)
      );
    }

    if (sortKey === "recent") {
      return (
        Date.parse(b.updatedAt) - Date.parse(a.updatedAt) ||
        a.name.localeCompare(b.name)
      );
    }

    if (sortKey === "price") {
      return (b.price ?? -1) - (a.price ?? -1) || a.name.localeCompare(b.name);
    }

    return a.name.localeCompare(b.name);
  });
}

function ForRepairIcon({ name }: { name: IconName }) {
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
          <path
            d="M6.5 3.5h3C9.5 4.9 10.6 6 12 6s2.5-1.1 2.5-2.5h3L22 8l-3 3-2-2v12H7V9l-2 2-3-3 4.5-4.5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      );
    case "ban":
      return (
        <svg {...common}>
          <circle
            cx="12"
            cy="12"
            r="8"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="m6.4 6.4 11.2 11.2"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "capsules":
      return (
        <svg aria-hidden fill="none" height="18" viewBox="0 0 17 17" width="18">
          <path
            d="M2.5 3.5H7C7 2 6 .5 8 .5s1 1.5 1 3h4v3.5c1.5 0 3-1 3 1s-1.5 1-3 1V14H9c0-1.5 1-3-1-3s-1 1.5-1 3H2.5V9C4 9 5 10 5 8s-1-1-2.5-1V3.5Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.3"
          />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path
            d="m5 12 4 4L19 6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path
            d="m6 6 12 12M18 6 6 18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "for-repair":
      return (
        <svg {...common}>
          <path
            d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "grid":
      return (
        <svg {...common}>
          <rect
            height="7"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.7"
            width="7"
            x="3"
            y="3"
          />
          <rect
            height="7"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.7"
            width="7"
            x="14"
            y="3"
          />
          <rect
            height="7"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.7"
            width="7"
            x="3"
            y="14"
          />
          <rect
            height="7"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.7"
            width="7"
            x="14"
            y="14"
          />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path
            d="m12 20-7-7a4.2 4.2 0 0 1 6-6l1 1 1-1a4.2 4.2 0 0 1 6 6l-7 7Z"
            fill="currentColor"
            fillOpacity="var(--icon-fill-opacity, 0)"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "list":
      return (
        <svg {...common}>
          <path
            d="M5 7h14M5 12h11M5 17h8"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path
            d="M10 17l5-5-5-5M15 12H3M21 4v16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
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
          <rect
            height="9"
            rx="1"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.4"
            width="12"
            x="2.5"
            y="6"
          />
          <path
            d="m2.5 6 2.5-3.5h7L14.5 6"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.4"
          />
          <path
            d="M8.5 2.5V6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.4"
          />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <circle
            cx="12"
            cy="8"
            r="4"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M4.5 21a7.5 7.5 0 0 1 15 0"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle
            cx="12"
            cy="12"
            r="3"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M19 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.5-2.4 1a7.5 7.5 0 0 0-1.9-1.1L14.3 3h-4.6l-.3 2.8a7.5 7.5 0 0 0-1.9 1.1l-2.4-1-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.1l-2 1.5 2 3.5 2.4-1c.6.5 1.2.9 1.9 1.1l.3 2.8h4.6l.3-2.8c.7-.3 1.3-.6 1.9-1.1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1.1Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.4"
          />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path
            d="M4 5v6.2L12.8 20 20 12.8 11.2 4H5a1 1 0 0 0-1 1Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
          <circle cx="8" cy="8" r="1.2" fill="currentColor" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path
            d="M4 7h16M9 7V4h6v3M8 10v8M12 10v8M16 10v8M6 7l1 14h10l1-14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      );
  }
}
