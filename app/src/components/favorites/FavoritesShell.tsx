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
import { signOutAction } from "@/features/auth/actions";
import { Link } from "@/i18n/navigation";
import type { ItemStatus } from "@/lib/providers";
import { cn } from "@/lib/utils";
import type { ColorGroup, ColorPoint } from "@/types";
import type { FavoritesSnapshot } from "./favorites-data";

interface FavoritesShellProps {
  snapshot: FavoritesSnapshot;
}

type FavoritesTab = "catalog" | "mine";
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
type DraftErrors = Partial<Record<"name" | "categoryId" | "colorHexes" | "photo", string>>;

interface ItemDraftState {
  id: string;
  name: string;
  categoryId: string;
  colorHexes: string[];
  brand: string;
  material: string;
  price: string;
  imageUrl?: string;
}

interface FavoritesNavItem {
  href: string;
  icon: IconName;
  label: string;
  active?: boolean;
  badge?: number;
}

const DEFAULT_COLOR = "#8C8C8C";
const LOCAL_UPDATED_AT = "2026-06-12T15:00:00.000Z";
const MAX_LOCAL_PHOTO_BYTES = 10 * 1024 * 1024;
const SUPPORTED_LOCAL_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function FavoritesShell({ snapshot }: FavoritesShellProps) {
  const t = useTranslations("favorites");
  const dashboardT = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();
  const [items, setItems] = useState(snapshot.items);
  const [navigation, setNavigation] = useState(snapshot.navigation);
  const [activeTab, setActiveTab] = useState<FavoritesTab>("mine");
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

  const totals = useMemo(() => buildTotals(items), [items]);
  const displayNavigation = useMemo(
    () => ({ ...navigation, favorites: totals.total }),
    [navigation, totals.total],
  );
  const tabItems = useMemo(
    () => items.filter((item) => (activeTab === "catalog" ? item.fromCatalog : !item.fromCatalog)),
    [activeTab, items],
  );
  const categories = useMemo(() => buildCategoryFilters(tabItems), [tabItems]);
  const colors = useMemo(() => buildColorFilters(tabItems), [tabItems]);
  const visibleItems = useMemo(
    () => filterAndSortFavorites(tabItems, categoryFilter, colorFilter, sortKey),
    [categoryFilter, colorFilter, sortKey, tabItems],
  );
  const knownColors = useMemo(
    () => uniqueColorPoints(items.flatMap((item) => item.colorPoints)),
    [items],
  );
  const selectedItem = selectedItemId
    ? items.find((item) => item.id === selectedItemId) ?? null
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

  const navGroups: Array<{ label: string; items: FavoritesNavItem[] }> = [
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
          badge: displayNavigation.myItems,
        },
        {
          href: "/capsule-result?tab=outfits",
          icon: "bag",
          label: dashboardT("nav.outfits"),
          badge: displayNavigation.outfits,
        },
        {
          href: "/capsule-result",
          icon: "capsules",
          label: dashboardT("nav.capsules"),
          badge: displayNavigation.capsules,
        },
        {
          href: "/uncapsulated",
          icon: "ban",
          label: dashboardT("nav.uncapsulated"),
          badge: displayNavigation.uncapsulated,
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
          active: true,
          badge: displayNavigation.favorites,
        },
        {
          href: "/capsule-result?tab=shopping",
          icon: "list",
          label: dashboardT("nav.shoppingList"),
          badge: displayNavigation.shoppingList,
        },
        {
          href: "/for-sale",
          icon: "tag",
          label: dashboardT("nav.forSale"),
          badge: displayNavigation.forSale,
        },
        {
          href: "/for-repair",
          icon: "for-repair",
          label: dashboardT("nav.forRepair"),
          badge: displayNavigation.forRepair,
        },
      ],
    },
  ];
  const moreItems: FavoritesNavItem[] = [
    {
      href: "/capsule-result?tab=outfits",
      icon: "bag",
      label: dashboardT("nav.outfits"),
      badge: displayNavigation.outfits,
    },
    {
      href: "/uncapsulated",
      icon: "ban",
      label: dashboardT("nav.uncapsulated"),
      badge: displayNavigation.uncapsulated,
    },
    {
      href: "/capsule-result?tab=shopping",
      icon: "list",
      label: dashboardT("nav.shoppingList"),
      badge: displayNavigation.shoppingList,
    },
    {
      href: "/for-sale",
      icon: "tag",
      label: dashboardT("nav.forSale"),
      badge: displayNavigation.forSale,
    },
    {
      href: "/for-repair",
      icon: "for-repair",
      label: dashboardT("nav.forRepair"),
      badge: displayNavigation.forRepair,
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

  const switchTab = (tab: FavoritesTab) => {
    setActiveTab(tab);
    setCategoryFilter("all");
    setColorFilter("all");
    setNotice(null);
  };

  const openItem = (item: MyItemsEntry) => {
    setSelectedItemId(item.id);
    setDraft(buildDraftFromItem(item));
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
    setNotice(t("notice.saved", { item: normalized.name }));
  };

  const removeFavorite = (item: MyItemsEntry) => {
    setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id));
    setNavigation((currentNavigation) => ({
      ...currentNavigation,
      favorites: Math.max(0, currentNavigation.favorites - 1),
    }));
    closeDetail();
    setNotice(t("notice.removed", { item: item.name }));
  };

  const addSelectedItemToCapsule = () => {
    if (!selectedItem) {
      return;
    }

    const itemToAdd = selectedItem;

    if (!snapshot.activeCapsule) {
      setNotice(t("notice.noCapsule"));
      return;
    }

    const activeCapsule = snapshot.activeCapsule;
    const alreadyInCapsule = itemToAdd.capsuleIds.includes(activeCapsule.id);

    if (alreadyInCapsule) {
      setNotice(t("notice.alreadyCapsule", { item: itemToAdd.name, capsule: activeCapsule.name }));
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemToAdd.id
          ? {
              ...item,
              status: "active",
              capsuleIds: [...item.capsuleIds, activeCapsule.id],
              capsules: [
                ...item.capsules,
                {
                  active: true,
                  id: activeCapsule.id,
                  name: activeCapsule.name,
                  palette: activeCapsule.palette,
                },
              ],
              updatedAt: LOCAL_UPDATED_AT,
            }
          : item,
      ),
    );
    setNavigation((currentNavigation) => adjustStatusNavigation(currentNavigation, itemToAdd.status, "active"));
    setNotice(t("notice.addedCapsule", { item: itemToAdd.name, capsule: activeCapsule.name }));
    closeDetail();
  };

  const deleteSelectedItem = () => {
    if (!selectedItem) {
      return;
    }

    const itemToDelete = selectedItem;
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemToDelete.id));
    setNavigation((currentNavigation) => removeItemFromNavigation(currentNavigation, itemToDelete));
    setNotice(t("notice.deleted", { item: itemToDelete.name }));
    closeDetail();
  };

  const moveSelectedItem = (status: Extract<ItemStatus, "for_repair" | "for_sale">) => {
    if (!selectedItem) {
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === selectedItem.id
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
    setNavigation((currentNavigation) => adjustStatusNavigation(currentNavigation, selectedItem.status, status));
    setNotice(
      status === "for_sale"
        ? t("notice.movedSale", { item: selectedItem.name })
        : t("notice.movedRepair", { item: selectedItem.name }),
    );
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
    <div className="cz-page dashboard-page my-items-page favorites-page">
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
                      <FavoritesIcon name={item.icon} />
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
                <FavoritesIcon name="settings" />
              </span>
              <span className="dashboard-nav-label">{dashboardT("nav.settings")}</span>
            </Link>
            <button className="dashboard-nav-item dashboard-nav-button" onClick={signOut} type="button">
              <span className="dashboard-nav-icon">
                <FavoritesIcon name="logout" />
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
              <p className="my-items-subtitle">{t("subtitle", { count: totals.total })}</p>
            </div>
            <div className="dashboard-topbar-actions">
              <LanguageSwitcher />
              <Link className="dashboard-primary-action" href="/my-items">
                <FavoritesIcon name="my-items" />
                <span>{t("openMyItems")}</span>
              </Link>
            </div>
          </header>

          <div className="my-items-content favorites-content">
            <div className="favorites-tabs" role="tablist" aria-label={t("tabs.label")}>
              <button
                aria-selected={activeTab === "mine"}
                className={cn("favorites-tab", activeTab === "mine" && "favorites-tab-active")}
                onClick={() => switchTab("mine")}
                role="tab"
                type="button"
              >
                <span>{t("tabs.mine")}</span>
                <small>{totals.mine}</small>
              </button>
              <button
                aria-selected={activeTab === "catalog"}
                className={cn("favorites-tab", activeTab === "catalog" && "favorites-tab-active")}
                onClick={() => switchTab("catalog")}
                role="tab"
                type="button"
              >
                <span>{t("tabs.catalog")}</span>
                <small>{totals.catalog}</small>
              </button>
            </div>

            <section className="my-items-filter-panel favorites-filter-panel" aria-label={t("filters.label")}>
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
                    key={`${activeTab}-${color.hex}-${color.name}`}
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
              <section className="my-items-grid favorites-grid" aria-label={t("gridLabel")}>
                {visibleItems.map((item) => (
                  <WardrobeItemCard
                    badges={[
                      item.fromCatalog ? t("badges.catalog") : t("badges.mine"),
                      t(`statuses.${item.status}`),
                    ]}
                    className="favorites-card"
                    favoriteActive
                    favoriteLabel={t("removeFavorite", { item: item.name })}
                    item={item}
                    itemColorsLabel={t("itemColors")}
                    key={item.id}
                    mainClassName="favorites-card-main"
                    meta={item.brand ?? t(`sources.${item.sourceType}`)}
                    onFavorite={() => removeFavorite(item)}
                    onOpen={() => openItem(item)}
                    renderHeartIcon={() => <FavoritesIcon name="heart" />}
                  />
                ))}
              </section>
            ) : (
              <section className="my-items-empty favorites-empty">
                <span>
                  <FavoritesIcon name="heart" />
                </span>
                <h2>{items.length ? t("empty.filteredTitle") : t("empty.title")}</h2>
                <p>{items.length ? t("empty.filteredCopy") : t("empty.copy")}</p>
                <Link className="dashboard-primary-action" href="/my-items">
                  <FavoritesIcon name="my-items" />
                  <span>{t("openMyItems")}</span>
                </Link>
              </section>
            )}
          </div>
        </main>
      </div>

      <nav className={cn("dashboard-bottom-nav", moreOpen && "dashboard-bottom-nav-menu-open")} aria-label={dashboardT("nav.mobile")}>
        <BottomNavLink href="/dashboard" icon="grid" label={dashboardT("nav.dashboard")} />
        <BottomNavLink href="/my-items" icon="my-items" label={dashboardT("nav.myItems")} />
        <BottomNavLink href="/capsule-result" icon="capsules" label={dashboardT("nav.capsules")} />
        <BottomNavLink active href="/favorites" icon="heart" label={dashboardT("nav.favorites")} />
        <button
          aria-expanded={moreOpen}
          aria-label={dashboardT("nav.more")}
          className="dashboard-bottom-item dashboard-bottom-button"
          onClick={() => setMoreOpen((value) => !value)}
          type="button"
        >
          <span className="dashboard-bottom-icon">
            <FavoritesIcon name="more" />
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
                <FavoritesIcon name={item.icon} />
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
            className: "my-items-secondary-button favorites-delete-button",
            label: t("detail.delete"),
            onClick: deleteSelectedItem,
          }}
          draft={draft}
          errors={errors}
          extraFields={
            <>
              <WardrobeDetailField label={t("detail.source")} value={t(`sources.${selectedItem.sourceType}`)} />
              <WardrobeDetailField label={t("detail.favoriteType")} value={selectedItem.fromCatalog ? t("tabs.catalog") : t("tabs.mine")} />
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
          renderIcon={(name) => <FavoritesIcon name={name} />}
          actionSlot={
            <>
              <button className="my-items-secondary-button" onClick={addSelectedItemToCapsule} type="button">
                <FavoritesIcon name="capsules" />
                <span>{t("detail.addToCapsule")}</span>
              </button>
              <button className="my-items-secondary-button" onClick={() => moveSelectedItem("for_sale")} type="button">
                <FavoritesIcon name="tag" />
                <span>{t("detail.moveSale")}</span>
              </button>
              <button className="my-items-secondary-button" onClick={() => moveSelectedItem("for_repair")} type="button">
                <FavoritesIcon name="for-repair" />
                <span>{t("detail.moveRepair")}</span>
              </button>
            </>
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
        <FavoritesIcon name={icon} />
      </span>
      <span className="dashboard-bottom-label">{label}</span>
    </Link>
  );
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
    imageUrl: item.imageUrl,
  };
}

function validateDraft(
  draft: ItemDraftState,
  t: ReturnType<typeof useTranslations<"favorites">>,
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
  snapshot: FavoritesSnapshot,
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

function uniqueColorPoints(colors: ColorPoint[]): ColorPoint[] {
  const byHex = new Map<string, ColorPoint>();

  colors.forEach((color) => {
    byHex.set(color.hex.toUpperCase(), { ...color, hex: color.hex.toUpperCase() });
  });

  return [...byHex.values()];
}

function buildTotals(items: MyItemsEntry[]) {
  const mine = items.filter((item) => !item.fromCatalog).length;
  const catalog = items.filter((item) => item.fromCatalog).length;

  return {
    catalog,
    mine,
    total: items.length,
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

function filterAndSortFavorites(
  items: MyItemsEntry[],
  categoryFilter: string,
  colorFilter: string,
  sortKey: SortKey,
): MyItemsEntry[] {
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
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.name.localeCompare(b.name);
    }

    if (sortKey === "price") {
      return (b.price ?? -1) - (a.price ?? -1) || a.name.localeCompare(b.name);
    }

    return a.name.localeCompare(b.name);
  });
}

function adjustStatusNavigation(
  navigation: FavoritesSnapshot["navigation"],
  previousStatus: ItemStatus,
  nextStatus: ItemStatus,
): FavoritesSnapshot["navigation"] {
  const nextNavigation = { ...navigation };

  if (previousStatus === nextStatus) {
    return nextNavigation;
  }

  if (previousStatus === "uncapsulated") {
    nextNavigation.uncapsulated = Math.max(0, nextNavigation.uncapsulated - 1);
  }

  if (previousStatus === "for_sale") {
    nextNavigation.forSale = Math.max(0, nextNavigation.forSale - 1);
  }

  if (previousStatus === "for_repair") {
    nextNavigation.forRepair = Math.max(0, nextNavigation.forRepair - 1);
  }

  if (nextStatus === "for_sale") {
    nextNavigation.forSale += 1;
  }

  if (nextStatus === "for_repair") {
    nextNavigation.forRepair += 1;
  }

  return nextNavigation;
}

function removeItemFromNavigation(
  navigation: FavoritesSnapshot["navigation"],
  item: MyItemsEntry,
): FavoritesSnapshot["navigation"] {
  const nextNavigation = { ...navigation };

  nextNavigation.myItems = Math.max(0, nextNavigation.myItems - 1);
  nextNavigation.favorites = item.favorite
    ? Math.max(0, nextNavigation.favorites - 1)
    : nextNavigation.favorites;

  if (item.status === "uncapsulated") {
    nextNavigation.uncapsulated = Math.max(0, nextNavigation.uncapsulated - 1);
  }

  if (item.status === "for_sale") {
    nextNavigation.forSale = Math.max(0, nextNavigation.forSale - 1);
  }

  if (item.status === "for_repair") {
    nextNavigation.forRepair = Math.max(0, nextNavigation.forRepair - 1);
  }

  return nextNavigation;
}

function FavoritesIcon({ name }: { name: IconName }) {
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
          <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
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
        <svg aria-hidden fill="none" height="18" viewBox="0 0 17 17" width="18">
          <rect height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.35" width="5.5" x="1.5" y="1.5" />
          <rect height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.35" width="5.5" x="10" y="1.5" />
          <rect height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.35" width="5.5" x="1.5" y="10" />
          <rect height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.35" width="5.5" x="10" y="10" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4l1.4 1.4L12 21.2l7.4-6.8 1.4-1.4a5.2 5.2 0 0 0 0-7.4Z" fill="currentColor" fillOpacity="var(--icon-fill-opacity, .92)" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
      );
    case "list":
      return (
        <svg aria-hidden fill="none" height="18" viewBox="0 0 17 17" width="18">
          <path d="M2.5 5h12M2.5 8.5h9M2.5 12h7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.35" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M10 17l5-5-5-5M15 12H3M21 4v16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      );
    case "more":
      return (
        <svg {...common}>
          <circle cx="5" cy="12" fill="currentColor" r="1.7" />
          <circle cx="12" cy="12" fill="currentColor" r="1.7" />
          <circle cx="19" cy="12" fill="currentColor" r="1.7" />
        </svg>
      );
    case "my-items":
      return (
        <svg aria-hidden fill="none" height="18" viewBox="0 0 17 17" width="18">
          <rect height="9" rx="1" stroke="currentColor" strokeWidth="1.3" width="12" x="2.5" y="6" />
          <path d="m2.5 6 2.5-3.5h7L14.5 6M8.5 2.5V6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.3" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1A2 2 0 0 1 7 4.4l.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1A2 2 0 0 1 19.6 7l-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1h.3a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.1Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
      );
    case "tag":
      return (
        <svg aria-hidden fill="none" height="18" viewBox="0 0 17 17" width="18">
          <path d="M8.5 1.5v12M11.5 4.5C11.5 3.5 10.1 3 8.5 3S5.5 3.8 5.5 5.2s3 2 3 2 3 .6 3 2.3-1.4 2.3-3 2.3-3-.5-3-1.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M6 8h12l-1 12H7L6 8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2M5 8h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </svg>
      );
  }
}
