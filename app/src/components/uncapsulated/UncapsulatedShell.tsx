"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { signOutAction } from "@/features/auth/actions";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ColorGroup, ColorPoint } from "@/types";
import type { MyItemsEntry } from "@/components/my-items/my-items-data";
import type { UncapsulatedSnapshot } from "./uncapsulated-data";

interface UncapsulatedShellProps {
  snapshot: UncapsulatedSnapshot;
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

interface UncapsulatedNavItem {
  href: string;
  icon: IconName;
  label: string;
  active?: boolean;
  badge?: number;
}

const DEFAULT_COLOR = "#8C8C8C";
const LOCAL_UPDATED_AT = "2026-06-11T15:00:00.000Z";
const MAX_LOCAL_PHOTO_BYTES = 10 * 1024 * 1024;
const SUPPORTED_LOCAL_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function UncapsulatedShell({ snapshot }: UncapsulatedShellProps) {
  const t = useTranslations("uncapsulated");
  const dashboardT = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();
  const [items, setItems] = useState(snapshot.items);
  const [navigation, setNavigation] = useState(snapshot.navigation);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ItemDraftState | null>(null);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [capsuleCandidateId, setCapsuleCandidateId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const localPhotoUrlsRef = useRef(new Set<string>());

  const categories = useMemo(() => buildCategoryFilters(items), [items]);
  const knownColors = useMemo(
    () => uniqueColorPoints(items.flatMap((item) => item.colorPoints)),
    [items],
  );
  const visibleItems = useMemo(
    () => filterItems(items, categoryFilter),
    [categoryFilter, items],
  );
  const selectedItem = selectedItemId
    ? items.find((item) => item.id === selectedItemId) ?? null
    : null;
  const capsuleCandidate = capsuleCandidateId
    ? items.find((item) => item.id === capsuleCandidateId) ?? null
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

  const navGroups: Array<{ label: string; items: UncapsulatedNavItem[] }> = [
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
          active: true,
          badge: navigation.uncapsulated,
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
          badge: navigation.favorites,
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
          badge: navigation.forRepair,
        },
      ],
    },
  ];
  const moreItems: UncapsulatedNavItem[] = [
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
      active: true,
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

  const deleteSelectedItem = () => {
    if (!draft) {
      return;
    }

    const item = items.find((currentItem) => currentItem.id === draft.id);
    const itemName = item?.name ?? draft.name;

    setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== draft.id));
    setNavigation((currentNavigation) => ({
      ...currentNavigation,
      myItems: Math.max(0, currentNavigation.myItems - 1),
      uncapsulated: Math.max(0, currentNavigation.uncapsulated - 1),
      favorites: item?.favorite
        ? Math.max(0, currentNavigation.favorites - 1)
        : currentNavigation.favorites,
    }));
    closeDetail();
    setNotice(t("notice.deleted", { item: itemName }));
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

  const requestAddToCapsule = (item: MyItemsEntry) => {
    if (!snapshot.activeCapsule) {
      setNotice(t("notice.noCapsule"));
      return;
    }

    setCapsuleCandidateId(item.id);
    setNotice(null);
  };

  const confirmAddToCapsule = () => {
    if (!capsuleCandidate || !snapshot.activeCapsule) {
      return;
    }

    completeDecision(capsuleCandidate, "capsule");
    setNotice(
      t("notice.addedCapsule", {
        capsule: snapshot.activeCapsule.name,
        item: capsuleCandidate.name,
      }),
    );
    setCapsuleCandidateId(null);
    closeDetail();
  };

  const moveToSale = (item: MyItemsEntry) => {
    completeDecision(item, "sale");
    setNotice(t("notice.movedSale", { item: item.name }));
    closeDetail();
  };

  const moveToRepair = (item: MyItemsEntry) => {
    completeDecision(item, "repair");
    setNotice(t("notice.movedRepair", { item: item.name }));
    closeDetail();
  };

  const completeDecision = (
    item: MyItemsEntry,
    decision: "capsule" | "repair" | "sale",
  ) => {
    setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id));
    setNavigation((currentNavigation) => ({
      ...currentNavigation,
      uncapsulated: Math.max(0, currentNavigation.uncapsulated - 1),
      forSale:
        decision === "sale"
          ? currentNavigation.forSale + 1
          : currentNavigation.forSale,
      forRepair:
        decision === "repair"
          ? currentNavigation.forRepair + 1
          : currentNavigation.forRepair,
    }));
  };

  return (
    <div className="cz-page dashboard-page my-items-page uncapsulated-page">
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
                      <UncapsulatedIcon name={item.icon} />
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
                <UncapsulatedIcon name="settings" />
              </span>
              <span className="dashboard-nav-label">{dashboardT("nav.settings")}</span>
            </Link>
            <button className="dashboard-nav-item dashboard-nav-button" onClick={signOut} type="button">
              <span className="dashboard-nav-icon">
                <UncapsulatedIcon name="logout" />
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
              <p className="my-items-subtitle">{t("subtitle", { count: navigation.uncapsulated })}</p>
            </div>
            <div className="dashboard-topbar-actions">
              <LanguageSwitcher />
              <Link className="dashboard-primary-action" href="/my-items">
                <UncapsulatedIcon name="my-items" />
                <span>{t("openMyItems")}</span>
              </Link>
            </div>
          </header>

          <div className="my-items-content uncapsulated-content">
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
              </div>
            </section>

            {visibleItems.length > 0 ? (
              <section className="my-items-grid uncapsulated-grid" aria-label={t("gridLabel")}>
                {visibleItems.map((item) => (
                  <UncapsulatedItemCard
                    item={item}
                    key={item.id}
                    onAddToCapsule={() => requestAddToCapsule(item)}
                    onMoveToRepair={() => moveToRepair(item)}
                    onMoveToSale={() => moveToSale(item)}
                    onOpen={() => openItem(item)}
                    t={t}
                  />
                ))}
              </section>
            ) : (
              <section className="my-items-empty">
                <span>
                  <UncapsulatedIcon name="ban" />
                </span>
                <h2>{items.length ? t("empty.filteredTitle") : t("empty.title")}</h2>
                <p>{items.length ? t("empty.filteredCopy") : t("empty.copy")}</p>
                <Link className="dashboard-primary-action" href="/my-items">
                  <UncapsulatedIcon name="my-items" />
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
        <BottomNavLink href="/favorites" icon="heart" label={dashboardT("nav.favorites")} />
        <button
          aria-expanded={moreOpen}
          aria-label={dashboardT("nav.more")}
          className="dashboard-bottom-item dashboard-bottom-button dashboard-bottom-item-active"
          onClick={() => setMoreOpen((value) => !value)}
          type="button"
        >
          <span className="dashboard-bottom-icon">
            <UncapsulatedIcon name="more" />
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
              className={cn("dashboard-more-item", item.active && "dashboard-more-item-active")}
              href={item.href}
              key={`${item.href}-${item.label}`}
              onClick={() => setMoreOpen(false)}
            >
              <span className="dashboard-more-icon">
                <UncapsulatedIcon name={item.icon} />
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
        <div className="my-items-detail-wrap" role="dialog" aria-modal="true" aria-label={t("detail.title", { item: selectedItem.name })}>
          <button
            aria-label={t("detail.close")}
            className="my-items-detail-backdrop"
            onClick={closeDetail}
            type="button"
          />
          <aside className="my-items-detail-panel">
            <header className="my-items-detail-head">
              <h2>{t("detail.editTitle")}</h2>
              <button aria-label={t("detail.close")} className="my-items-icon-button" onClick={closeDetail} type="button">
                <UncapsulatedIcon name="close" />
              </button>
            </header>

            <div className="my-items-detail-body">
              <div className="my-items-detail-photo">
                {draft.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" src={draft.imageUrl} />
                ) : (
                  <>
                    <ItemFallbackIcon colorHex={draft.colorHexes[0] ?? DEFAULT_COLOR} />
                    <span>{t("detail.photoFallback")}</span>
                  </>
                )}
                <button onClick={() => photoInputRef.current?.click()} type="button">
                  {t("detail.changePhoto")}
                </button>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="my-items-photo-input"
                  onChange={handlePhotoUpload}
                  ref={photoInputRef}
                  type="file"
                />
                {errors.photo ? <small className="my-items-photo-error">{errors.photo}</small> : null}
              </div>

              <label className="my-items-field">
                <span>{t("detail.name")}</span>
                <input
                  aria-invalid={Boolean(errors.name)}
                  onChange={(event) => updateDraft({ name: event.target.value })}
                  value={draft.name}
                />
                {errors.name ? <small>{errors.name}</small> : null}
              </label>

              <label className="my-items-field">
                <span>{t("detail.category")}</span>
                <select
                  aria-invalid={Boolean(errors.categoryId)}
                  onChange={(event) => updateDraft({ categoryId: event.target.value })}
                  value={draft.categoryId}
                >
                  {snapshot.categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.categoryId ? <small>{errors.categoryId}</small> : null}
              </label>

              <div className="my-items-field">
                <span>{t("detail.colors")}</span>
                <div className="my-items-edit-colors">
                  {draft.colorHexes.map((hex, index) => (
                    <div className="my-items-edit-color" key={`${hex}-${index}`}>
                      <span className="my-items-edit-color-swatch" style={{ backgroundColor: hex }} />
                      <input
                        aria-label={t("detail.color", { count: index + 1 })}
                        onChange={(event) => updateColor(index, event.target.value)}
                        type="color"
                        value={hex}
                      />
                      {draft.colorHexes.length > 1 ? (
                        <button
                          aria-label={t("detail.removeColor")}
                          onClick={() => removeColor(index)}
                          type="button"
                        >
                          <UncapsulatedIcon name="close" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                  <button
                    aria-label={t("detail.addColor")}
                    className="my-items-add-color"
                    disabled={draft.colorHexes.length >= 3}
                    onClick={addColor}
                    type="button"
                  >
                    <UncapsulatedIcon name="plus" />
                  </button>
                </div>
                {errors.colorHexes ? <small>{errors.colorHexes}</small> : null}
              </div>

              <label className="my-items-field">
                <span>{t("detail.brand")}</span>
                <input onChange={(event) => updateDraft({ brand: event.target.value })} value={draft.brand} />
              </label>

              <label className="my-items-field">
                <span>{t("detail.material")}</span>
                <input onChange={(event) => updateDraft({ material: event.target.value })} value={draft.material} />
              </label>

              <label className="my-items-field">
                <span>{t("detail.price")}</span>
                <input
                  inputMode="decimal"
                  onChange={(event) => updateDraft({ price: event.target.value })}
                  placeholder="0"
                  value={draft.price}
                />
              </label>

              <DetailField label={t("detail.source")} value={t(`sources.${selectedItem.sourceType}`)} />

              <div className="my-items-membership">
                <p>{t("detail.capsules")}</p>
                <div className="my-items-no-capsules">{t("detail.noCapsules")}</div>
              </div>
            </div>

            <footer className="my-items-detail-actions">
              <button className="my-items-save-button" onClick={saveDraft} type="button">
                <UncapsulatedIcon name="check" />
                <span>{t("detail.save")}</span>
              </button>
              <button className="my-items-secondary-button uncapsulated-delete-button" onClick={deleteSelectedItem} type="button">
                <UncapsulatedIcon name="trash" />
                <span>{t("detail.delete")}</span>
              </button>
              <button className="my-items-secondary-button" onClick={() => requestAddToCapsule(selectedItem)} type="button">
                <UncapsulatedIcon name="capsules" />
                <span>{t("actions.addToCapsule")}</span>
              </button>
              <button className="my-items-secondary-button" onClick={() => moveToSale(selectedItem)} type="button">
                <UncapsulatedIcon name="tag" />
                <span>{t("actions.moveSale")}</span>
              </button>
              <button className="my-items-secondary-button" onClick={() => moveToRepair(selectedItem)} type="button">
                <UncapsulatedIcon name="for-repair" />
                <span>{t("actions.moveRepair")}</span>
              </button>
            </footer>
          </aside>
        </div>
      ) : null}

      {capsuleCandidate && snapshot.activeCapsule ? (
        <div className="uncapsulated-capsule-wrap" role="dialog" aria-modal="true" aria-label={t("capsule.title")}>
          <button
            aria-label={t("capsule.cancel")}
            className="uncapsulated-capsule-backdrop"
            onClick={() => setCapsuleCandidateId(null)}
            type="button"
          />
          <section className="uncapsulated-capsule-modal">
            <header>
              <h2>{t("capsule.title")}</h2>
              <button aria-label={t("capsule.cancel")} className="my-items-icon-button" onClick={() => setCapsuleCandidateId(null)} type="button">
                <UncapsulatedIcon name="close" />
              </button>
            </header>
            <div className="uncapsulated-capsule-card">
              <span className="uncapsulated-capsule-palette">
                {snapshot.activeCapsule.palette.slice(0, 6).map((color) => (
                  <span key={`${snapshot.activeCapsule?.id}-${color.hex}`} style={{ backgroundColor: color.hex }} />
                ))}
              </span>
              <div>
                <p>{snapshot.activeCapsule.name}</p>
                <small>
                  {t("capsule.meta", {
                    items: snapshot.activeCapsule.itemCount,
                    outfits: snapshot.activeCapsule.outfitCount,
                  })}
                </small>
              </div>
            </div>
            <p className="uncapsulated-capsule-copy">
              {t("capsule.copy", {
                capsule: snapshot.activeCapsule.name,
                item: capsuleCandidate.name,
              })}
            </p>
            <footer>
              <button className="my-items-secondary-button" onClick={() => setCapsuleCandidateId(null)} type="button">
                {t("capsule.cancel")}
              </button>
              <button className="my-items-save-button" onClick={confirmAddToCapsule} type="button">
                <UncapsulatedIcon name="check" />
                <span>{t("capsule.confirm")}</span>
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {notice ? (
        <div className="my-items-toast" role="status" aria-live="polite">
          {notice}
        </div>
      ) : null}
    </div>
  );
}

function UncapsulatedItemCard({
  item,
  onAddToCapsule,
  onMoveToRepair,
  onMoveToSale,
  onOpen,
  t,
}: {
  item: MyItemsEntry;
  onAddToCapsule: () => void;
  onMoveToRepair: () => void;
  onMoveToSale: () => void;
  onOpen: () => void;
  t: ReturnType<typeof useTranslations<"uncapsulated">>;
}) {
  const mainColor = item.colorPoints[0]?.hex ?? DEFAULT_COLOR;

  return (
    <article className="my-items-card uncapsulated-card">
      <button className="my-items-card-main uncapsulated-card-main" onClick={onOpen} type="button">
        <span className="my-items-thumb">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" src={item.imageUrl} />
          ) : (
            <ItemFallbackIcon colorHex={mainColor} />
          )}
        </span>
        <span className="my-items-card-body">
          <span className="my-items-card-name">{item.name}</span>
          <span className="my-items-card-row">
            <span>{item.categoryLabel}</span>
            <span className="my-items-card-colors" aria-label={t("itemColors")}>
              {item.colorPoints.map((color) => (
                <span
                  key={`${item.id}-${color.hex}`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </span>
          </span>
          <span className="my-items-card-meta">
            {item.brand ?? t(`sources.${item.sourceType}`)}
          </span>
          <span className="my-items-card-badges">
            <small>{t("badges.noCapsule")}</small>
            <small>{t(`statuses.${item.status}`)}</small>
          </span>
        </span>
      </button>
      <div className="uncapsulated-card-actions" aria-label={t("actions.label", { item: item.name })}>
        <button onClick={onAddToCapsule} type="button">
          <UncapsulatedIcon name="capsules" />
          <span>{t("actions.addShort")}</span>
        </button>
        <button onClick={onMoveToSale} type="button">
          <UncapsulatedIcon name="tag" />
          <span>{t("actions.saleShort")}</span>
        </button>
        <button onClick={onMoveToRepair} type="button">
          <UncapsulatedIcon name="for-repair" />
          <span>{t("actions.repairShort")}</span>
        </button>
      </div>
    </article>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="uncapsulated-detail-field">
      <p>{label}</p>
      <span>{value}</span>
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
        <UncapsulatedIcon name={icon} />
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
  t: ReturnType<typeof useTranslations<"uncapsulated">>,
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
  snapshot: UncapsulatedSnapshot,
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

function buildCategoryFilters(items: MyItemsEntry[]): UncapsulatedSnapshot["categories"] {
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

function filterItems(items: MyItemsEntry[], categoryFilter: string): MyItemsEntry[] {
  return [...items]
    .filter((item) => categoryFilter === "all" || item.categoryId === categoryFilter)
    .sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel) || a.name.localeCompare(b.name));
}

function ItemFallbackIcon({ colorHex }: { colorHex: string }) {
  const stroke = isColorDark(colorHex) ? "rgba(255,255,255,.42)" : "rgba(0,0,0,.28)";

  return (
    <svg aria-hidden fill="none" height="44" viewBox="0 0 44 44" width="44">
      <path
        d="M22 8s-6.8 4.2-6.8 10.3L7 22.8V36h30V22.8l-8.2-4.5C28.8 12.2 22 8 22 8Z"
        fill={`${colorHex}22`}
        stroke={stroke}
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M15.2 18.3h13.6" stroke={stroke} strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function isColorDark(hex: string): boolean {
  const value = hex.replace("#", "");
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);

  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
}

function UncapsulatedIcon({ name }: { name: IconName }) {
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
