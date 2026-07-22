"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  DashboardIcon,
  type DashboardIconName,
} from "@/components/dashboard/DashboardNavigation";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { signOutAction } from "@/features/auth/actions";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  calculateOutfitProductivity,
  calculatePreviewOutfitProductivity,
  formatLayeringCoverage,
} from "@/lib/outfit-productivity";
import {
  type CapsuleResultCategory,
  type CapsuleResultGap,
  type CapsuleResultItem,
  type CapsuleResultSnapshot,
} from "./capsule-result-data";

interface CapsuleResultShellProps {
  snapshot: CapsuleResultSnapshot;
}

type CapsuleResultTab = "items" | "outfits" | "gaps" | "shopping";
type OutfitView = "linear" | "moodboard";
type PickerState =
  | { mode: "add"; replaceItemId?: never }
  | { mode: "replace"; replaceItemId: string };
type IconName =
  | "add"
  | "arrow"
  | "bag"
  | "ban"
  | "capsule"
  | "check"
  | "dashboard"
  | "garment"
  | "grid"
  | "heart"
  | "list"
  | "logout"
  | "more"
  | "profile"
  | "repair"
  | "settings"
  | "tag"
  | "viewGrid"
  | "viewList"
  | "x";

interface OutfitLayer {
  id: string;
  label: string;
  colorHex: string;
  isGap: boolean;
}

interface OutfitCard {
  id: string;
  name: string;
  note: string;
  layers: OutfitLayer[];
}

export function CapsuleResultShell({ snapshot }: CapsuleResultShellProps) {
  const t = useTranslations("capsuleResult");
  const dashboardT = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));
  const [items, setItems] = useState<CapsuleResultItem[]>(snapshot.items);
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      [...snapshot.items, ...snapshot.availableItems].map((item) => [
        item.id,
        item.favorite,
      ]),
    ),
  );
  const [menuItemId, setMenuItemId] = useState<string | null>(null);
  const [removeItemId, setRemoveItemId] = useState<string | null>(null);
  const [pickerState, setPickerState] = useState<PickerState | null>(null);
  const [pickerNotice, setPickerNotice] = useState<string | null>(null);

  const currentItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        favorite: favorites[item.id] ?? item.favorite,
      })),
    [favorites, items],
  );
  const currentItemIds = useMemo(
    () => new Set(currentItems.map((item) => item.id)),
    [currentItems],
  );
  const candidates = useMemo(
    () =>
      uniqueItems([...snapshot.items, ...snapshot.availableItems]).filter(
        (item) => !currentItemIds.has(item.id),
      ),
    [currentItemIds, snapshot.availableItems, snapshot.items],
  );
  const preview = useMemo(
    () => buildPreview(snapshot, currentItems, t),
    [currentItems, snapshot, t],
  );
  const removeTarget = currentItems.find((item) => item.id === removeItemId);
  const hasCapsule = Boolean(snapshot.capsule);

  const signOut = async () => {
    await signOutAction();
    router.push(`/${locale}`);
    router.refresh();
  };

  const selectTab = (tab: CapsuleResultTab) => {
    router.replace(
      `/${locale}/capsule-result${tab === "items" ? "" : `?tab=${tab}`}`,
      { scroll: false },
    );
  };

  const toggleFavorite = (itemId: string) => {
    setFavorites((current) => ({
      ...current,
      [itemId]: !(current[itemId] ?? false),
    }));
  };

  const confirmRemove = () => {
    if (!removeItemId) {
      return;
    }

    setItems((current) => current.filter((item) => item.id !== removeItemId));
    setMenuItemId(null);
    setRemoveItemId(null);
  };

  const openPicker = (state: PickerState) => {
    setPickerNotice(null);
    setMenuItemId(null);
    setPickerState(state);
  };

  const selectCandidate = (candidate: CapsuleResultItem) => {
    if (!candidate.compatible) {
      setPickerNotice(t("picker.incompatible", { item: candidate.name }));
      return;
    }

    setFavorites((current) => ({
      ...current,
      [candidate.id]: current[candidate.id] ?? candidate.favorite,
    }));

    if (pickerState?.mode === "replace") {
      setItems((current) =>
        current.map((item) =>
          item.id === pickerState.replaceItemId ? candidate : item,
        ),
      );
    } else {
      setItems((current) =>
        current.some((item) => item.id === candidate.id)
          ? current
          : [...current, candidate],
      );
    }

    setPickerNotice(null);
    setPickerState(null);
  };

  return (
    <div className="cz-page capsule-result-page">
      <div className="wallpaper-bg" />
      <div className="wallpaper-overlay" />

      <div className="capsule-result-app">
        <aside className="capsule-result-sidebar">
          <div className="capsule-result-sidebar-head">
            <Link className="capsule-result-logo" href="/">
              Capsule Zero
            </Link>
            <div className="capsule-result-user">
              <Link aria-label={dashboardT("nav.profile")} href="/profile">
                <span className="capsule-result-avatar">
                  {snapshot.profile.initials}
                </span>
              </Link>
              <div className="capsule-result-user-meta">
                <p>{snapshot.profile.displayName}</p>
                <span>{snapshot.profile.email}</span>
              </div>
            </div>
          </div>

          <nav
            className="capsule-result-nav"
            aria-label={dashboardT("nav.main")}
          >
            <p className="capsule-result-nav-section">
              {dashboardT("nav.overview")}
            </p>
            <ResultNavLink
              href="/dashboard"
              icon="grid"
              label={dashboardT("nav.dashboard")}
            />
            <ResultNavLink
              href="/my-items"
              icon="my-items"
              label={dashboardT("nav.myItems")}
            />
            <ResultNavLink
              active={activeTab === "outfits"}
              href="/capsule-result?tab=outfits"
              icon="outfits"
              label={dashboardT("nav.outfits")}
            />
            <ResultNavLink
              active={activeTab === "items" || activeTab === "gaps"}
              href="/capsule-result"
              icon="capsules"
              label={dashboardT("nav.capsules")}
            />
            <ResultNavLink
              href="/uncapsulated"
              icon="ban"
              label={dashboardT("nav.uncapsulated")}
            />
            <ResultNavLink
              href="/favorites"
              icon="heart"
              label={dashboardT("nav.favorites")}
            />
            <p className="capsule-result-nav-section">
              {dashboardT("nav.lists")}
            </p>
            <ResultNavLink
              active={activeTab === "shopping"}
              href="/capsule-result?tab=shopping"
              icon="list"
              label={dashboardT("nav.shoppingList")}
            />
            <ResultNavLink
              href="/for-sale"
              icon="tag"
              label={dashboardT("nav.forSale")}
            />
            <ResultNavLink
              href="/for-repair"
              icon="for-repair"
              label={dashboardT("nav.forRepair")}
            />
          </nav>

          <div className="capsule-result-sidebar-foot">
            <Link className="capsule-result-nav-item" href="/profile">
              <span className="capsule-result-nav-icon">
                <DashboardIcon name="settings" />
              </span>
              <span>{dashboardT("nav.settings")}</span>
            </Link>
            <button
              className="capsule-result-nav-item"
              onClick={signOut}
              type="button"
            >
              <span className="capsule-result-nav-icon">
                <DashboardIcon name="logout" />
              </span>
              <span>{dashboardT("logout")}</span>
            </button>
          </div>
        </aside>

        <main className="capsule-result-main">
          <header className="capsule-result-topbar">
            <div>
              <Link className="capsule-result-back" href="/dashboard">
                <ResultIcon name="arrow" />
                <span>{t("backToDashboard")}</span>
              </Link>
              <h1>{hasCapsule ? t("title") : t("empty.title")}</h1>
              <p>{hasCapsule ? t("subtitle") : t("empty.subtitle")}</p>
            </div>
            <div className="capsule-result-topbar-actions">
              <LanguageSwitcher />
              <Link
                className="capsule-result-primary-action"
                href="/guided-journey"
              >
                <ResultIcon name="add" />
                <span>{t("newCapsule")}</span>
              </Link>
            </div>
          </header>

          {snapshot.capsule ? (
            <div className="capsule-result-content">
              <section className="capsule-result-hero">
                <div className="capsule-result-hero-body">
                  <p className="capsule-result-eyebrow">{t("activeCapsule")}</p>
                  <h2>{snapshot.capsule.name}</h2>
                  <div
                    className="capsule-result-palette"
                    aria-label={t("palette")}
                  >
                    {snapshot.capsule.palette.map((color) => (
                      <span
                        aria-label={color.name}
                        className="capsule-result-palette-dot"
                        key={`${color.hex}-${color.name}`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                    <span>{t("palette")}</span>
                  </div>
                  <div className="capsule-result-hero-stats">
                    <ResultMetric
                      label={t("items")}
                      value={preview.itemCount}
                    />
                    <ResultMetric
                      label={t("outfits")}
                      value={preview.outfitCount}
                    />
                    <ResultMetric
                      label={t("categories")}
                      value={preview.categoryCount}
                    />
                  </div>
                </div>

                <div className="capsule-result-opr">
                  <div className="capsule-result-opr-primary">
                    <p data-testid="capsule-result-opr-value">{preview.opr}</p>
                    <span>{t("opr")}</span>
                    <small>{t("oprHint")}</small>
                    <strong>{preview.oprDelta}</strong>
                  </div>
                  <div className="capsule-result-layering">
                    <span>{t("layeringCoverage")}</span>
                    <strong data-testid="capsule-result-layering-coverage">
                      {formatLayeringCoverage(
                        preview.layeringCoverage.score,
                        t("layeringUnavailable"),
                      )}
                    </strong>
                    <small data-testid="capsule-result-layering-diagnostics">
                      {t("layeringDiagnostics", {
                        base: preview.layeringCoverage.baseLookCount,
                        mid: preview.layeringCoverage.midCoveredLookCount,
                        outer: preview.layeringCoverage.outerCoveredLookCount,
                      })}
                    </small>
                  </div>
                </div>
              </section>

              <section
                className="capsule-result-tabs"
                aria-label={t("tabs.label")}
                data-testid="capsule-result-tabs"
              >
                {(
                  ["items", "outfits", "gaps", "shopping"] as CapsuleResultTab[]
                ).map((tab) => (
                  <button
                    aria-pressed={activeTab === tab}
                    className={cn(
                      "capsule-result-tab",
                      activeTab === tab && "capsule-result-tab-active",
                    )}
                    data-testid={`capsule-result-tab-${tab}`}
                    key={tab}
                    onClick={() => selectTab(tab)}
                    type="button"
                  >
                    {t(`tabs.${tab}`)}
                  </button>
                ))}
              </section>

              <section className="capsule-result-panel">
                {activeTab === "items" ? (
                  <ItemsTab
                    items={currentItems}
                    menuItemId={menuItemId}
                    onAdd={() => openPicker({ mode: "add" })}
                    onMenuToggle={setMenuItemId}
                    onRemove={setRemoveItemId}
                    onReplace={(itemId) =>
                      openPicker({ mode: "replace", replaceItemId: itemId })
                    }
                    onToggleFavorite={toggleFavorite}
                  />
                ) : null}

                {activeTab === "outfits" ? (
                  <OutfitsTab
                    outfitCount={preview.outfitCount}
                    outfits={preview.outfits}
                  />
                ) : null}

                {activeTab === "gaps" ? <GapsTab gaps={preview.gaps} /> : null}

                {activeTab === "shopping" ? (
                  <ShoppingTab rows={preview.shoppingRows} />
                ) : null}
              </section>
            </div>
          ) : (
            <section className="capsule-result-empty">
              <div className="capsule-result-empty-icon">
                <ResultIcon name="capsule" />
              </div>
              <h2>{t("empty.cardTitle")}</h2>
              <p>{t("empty.cardCopy")}</p>
              <Link
                className="capsule-result-primary-action"
                href="/guided-journey"
              >
                <ResultIcon name="add" />
                <span>{t("empty.cta")}</span>
              </Link>
            </section>
          )}
        </main>
      </div>

      <nav
        className="capsule-result-bottom-nav"
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
          active
          href="/capsule-result"
          icon="capsules"
          label={dashboardT("nav.capsules")}
        />
        <BottomNavLink
          href="/favorites"
          icon="heart"
          label={dashboardT("nav.favorites")}
        />
      </nav>

      {removeTarget ? (
        <div className="capsule-result-dialog-backdrop" role="presentation">
          <div
            aria-describedby="remove-item-copy"
            aria-labelledby="remove-item-title"
            aria-modal="true"
            className="capsule-result-dialog"
            role="dialog"
          >
            <h2 id="remove-item-title">{t("remove.title")}</h2>
            <p id="remove-item-copy">
              {t("remove.copy", { item: removeTarget.name })}
            </p>
            <div className="capsule-result-dialog-actions">
              <button onClick={() => setRemoveItemId(null)} type="button">
                {t("cancel")}
              </button>
              <button onClick={confirmRemove} type="button">
                {t("remove.confirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pickerState ? (
        <div className="capsule-result-dialog-backdrop" role="presentation">
          <div
            aria-labelledby="picker-title"
            aria-modal="true"
            className="capsule-result-picker"
            role="dialog"
          >
            <div className="capsule-result-picker-head">
              <div>
                <p>{t("picker.eyebrow")}</p>
                <h2 id="picker-title">
                  {pickerState.mode === "replace"
                    ? t("picker.replaceTitle")
                    : t("picker.addTitle")}
                </h2>
              </div>
              <button
                aria-label={t("close")}
                className="capsule-result-icon-button"
                onClick={() => setPickerState(null)}
                type="button"
              >
                <ResultIcon name="x" />
              </button>
            </div>
            {pickerNotice ? (
              <p className="capsule-result-picker-notice">{pickerNotice}</p>
            ) : null}
            <div className="capsule-result-picker-grid">
              {candidates.map((candidate) => (
                <button
                  aria-disabled={!candidate.compatible}
                  className={cn(
                    "capsule-result-picker-card",
                    !candidate.compatible &&
                      "capsule-result-picker-card-disabled",
                  )}
                  key={candidate.id}
                  onClick={() => selectCandidate(candidate)}
                  type="button"
                >
                  <ItemPreview item={candidate} />
                  <span className="capsule-result-picker-name">
                    {candidate.name}
                  </span>
                  <span className="capsule-result-picker-meta">
                    {candidate.categoryLabel} ·{" "}
                    {t(`sources.${candidate.source}`)}
                  </span>
                  {!candidate.compatible ? (
                    <>
                      <span className="capsule-result-picker-blocked">
                        {t("picker.blocked")}
                      </span>
                      <span className="capsule-result-picker-reason">
                        {t("picker.blockedReason")}
                      </span>
                    </>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ItemsTab({
  items,
  menuItemId,
  onAdd,
  onMenuToggle,
  onRemove,
  onReplace,
  onToggleFavorite,
}: {
  items: CapsuleResultItem[];
  menuItemId: string | null;
  onAdd: () => void;
  onMenuToggle: (itemId: string | null) => void;
  onRemove: (itemId: string) => void;
  onReplace: (itemId: string) => void;
  onToggleFavorite: (itemId: string) => void;
}) {
  const t = useTranslations("capsuleResult");

  return (
    <div className="capsule-result-item-grid">
      {items.map((item) => (
        <article className="capsule-result-item-card" key={item.id}>
          <ItemPreview item={item} />
          <div className="capsule-result-item-body">
            <div>
              <h3>{item.name}</h3>
              <p>
                {item.categoryLabel}
                {item.brand ? ` · ${item.brand}` : ""}
              </p>
            </div>
            <div
              className="capsule-result-item-colors"
              aria-label={t("itemColors")}
            >
              {item.colorPoints.map((color) => (
                <span
                  aria-label={color.name}
                  key={`${item.id}-${color.hex}`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
          <div className="capsule-result-item-actions">
            <button
              aria-pressed={item.favorite}
              aria-label={t("favorite", { item: item.name })}
              className={cn(
                "capsule-result-icon-button",
                item.favorite && "capsule-result-icon-button-active",
              )}
              onClick={() => onToggleFavorite(item.id)}
              type="button"
            >
              <ResultIcon name="heart" />
            </button>
            <div className="capsule-result-menu-wrap">
              <button
                aria-expanded={menuItemId === item.id}
                aria-label={t("actions", { item: item.name })}
                className="capsule-result-icon-button"
                onClick={() =>
                  onMenuToggle(menuItemId === item.id ? null : item.id)
                }
                type="button"
              >
                <ResultIcon name="more" />
              </button>
              {menuItemId === item.id ? (
                <div className="capsule-result-item-menu">
                  <button onClick={() => onReplace(item.id)} type="button">
                    {t("replace")}
                  </button>
                  <button onClick={() => onRemove(item.id)} type="button">
                    {t("remove.action")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </article>
      ))}

      <button className="capsule-result-add-card" onClick={onAdd} type="button">
        <span>
          <ResultIcon name="add" />
        </span>
        <strong>{t("addItem")}</strong>
        <small>{t("localOnly")}</small>
      </button>
    </div>
  );
}

function OutfitsTab({
  outfitCount,
  outfits,
}: {
  outfitCount: number;
  outfits: OutfitCard[];
}) {
  const t = useTranslations("capsuleResult");
  const [outfitView, setOutfitView] = useState<OutfitView>("linear");

  if (!outfits.length) {
    return (
      <PanelEmpty
        icon="tag"
        title={t("outfitsEmpty")}
        copy={t("outfitsEmptyCopy")}
      />
    );
  }

  return (
    <div>
      <div className="capsule-result-outfit-toolbar">
        <p className="capsule-result-countline">
          {t("outfitsGenerated", { count: outfitCount })}
        </p>
        <div className="capsule-result-outfit-view-toggle">
          <button
            aria-label={t("outfitViews.linear")}
            aria-pressed={outfitView === "linear"}
            className={cn(
              "capsule-result-outfit-view-button",
              outfitView === "linear" &&
                "capsule-result-outfit-view-button-active",
            )}
            onClick={() => setOutfitView("linear")}
            type="button"
          >
            <ResultIcon name="viewList" />
          </button>
          <button
            aria-label={t("outfitViews.moodboard")}
            aria-pressed={outfitView === "moodboard"}
            className={cn(
              "capsule-result-outfit-view-button",
              outfitView === "moodboard" &&
                "capsule-result-outfit-view-button-active",
            )}
            onClick={() => setOutfitView("moodboard")}
            type="button"
          >
            <ResultIcon name="viewGrid" />
          </button>
        </div>
      </div>
      <div
        className={cn(
          "capsule-result-outfit-grid",
          outfitView === "moodboard" && "capsule-result-outfit-grid-moodboard",
        )}
      >
        {outfits.map((outfit) => (
          <article
            className={cn(
              "capsule-result-outfit-card",
              outfitView === "moodboard" &&
                "capsule-result-outfit-card-moodboard",
            )}
            key={outfit.id}
          >
            <div className="capsule-result-outfit-head">
              <h3>{outfit.name}</h3>
              <span>{outfit.note}</span>
            </div>
            {outfitView === "moodboard" ? (
              <div className="capsule-result-outfit-collage">
                {visibleOutfitLayers(outfit.layers, outfitView).map((layer) => {
                  if ("extraCount" in layer) {
                    return (
                      <div
                        className="capsule-result-outfit-layer-more"
                        key="more"
                      >
                        +{layer.extraCount}
                      </div>
                    );
                  }

                  return (
                    <OutfitLayerTile
                      key={layer.id}
                      layer={layer}
                      view={outfitView}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="capsule-result-outfit-layers">
                {outfit.layers.map((layer) => (
                  <OutfitLayerTile
                    key={layer.id}
                    layer={layer}
                    view={outfitView}
                  />
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function OutfitLayerTile({
  layer,
  view,
}: {
  layer: OutfitLayer;
  view: OutfitView;
}) {
  return (
    <div
      className={cn(
        "capsule-result-outfit-layer",
        view === "moodboard" && "capsule-result-outfit-layer-moodboard",
        layer.isGap && "capsule-result-outfit-layer-gap",
      )}
    >
      <span className="capsule-result-outfit-layer-thumb">
        <span
          className="capsule-result-outfit-layer-color"
          style={{ backgroundColor: layer.colorHex }}
        />
        {layer.isGap ? (
          <ResultIcon name="add" />
        ) : (
          <ResultIcon name="garment" />
        )}
      </span>
      {view === "linear" ? <p>{layer.label}</p> : null}
    </div>
  );
}

function GapsTab({ gaps }: { gaps: CapsuleResultGap[] }) {
  const t = useTranslations("capsuleResult");

  if (!gaps.length) {
    return (
      <PanelEmpty
        icon="check"
        title={t("gapsComplete")}
        copy={t("gapsCompleteCopy")}
      />
    );
  }

  return (
    <div className="capsule-result-gap-list">
      {gaps.map((gap) => (
        <article className="capsule-result-gap-row" key={gap.id}>
          <span
            className={`capsule-result-gap-icon capsule-result-gap-icon-${gap.type}`}
          >
            <ResultIcon name={gap.type === "structural" ? "ban" : "add"} />
          </span>
          <div>
            <div className="capsule-result-gap-title">
              <h3>{gap.categoryLabel}</h3>
              <span style={{ backgroundColor: gap.colorHex }} />
              <strong>{gap.colorHint}</strong>
            </div>
            <p>{gap.reason}</p>
          </div>
          <em>{t(`gapTypes.${gap.type}`)}</em>
        </article>
      ))}
    </div>
  );
}

function ShoppingTab({ rows }: { rows: CapsuleResultGap[] }) {
  const t = useTranslations("capsuleResult");

  if (!rows.length) {
    return (
      <PanelEmpty
        icon="check"
        title={t("shoppingComplete")}
        copy={t("shoppingCompleteCopy")}
      />
    );
  }

  return (
    <div className="capsule-result-shopping-list">
      {rows.map((row) => (
        <Link
          className="capsule-result-shopping-row"
          href={`/guided-journey?tab=search&category=${row.categoryId}`}
          key={row.id}
        >
          <span
            className={`capsule-result-shopping-bar capsule-result-shopping-bar-${row.priority}`}
          />
          <span
            className="capsule-result-shopping-color"
            style={{ backgroundColor: row.colorHex }}
          />
          <span className="capsule-result-shopping-body">
            <strong>{row.categoryLabel}</strong>
            <small>{t("impact", { count: row.impact })}</small>
          </span>
          <span
            className={`capsule-result-shopping-priority capsule-result-shopping-priority-${row.priority}`}
          >
            {t(`priorities.${row.priority}`)}
          </span>
        </Link>
      ))}
    </div>
  );
}

function ItemPreview({ item }: { item: CapsuleResultItem }) {
  const primaryColor = item.colorPoints[0]?.hex ?? "#8C8C8C";

  return (
    <div className="capsule-result-item-preview">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" src={item.imageUrl} />
      ) : (
        <span
          className="capsule-result-preview-fallback"
          style={{ backgroundColor: primaryColor }}
        >
          <ResultIcon name="bag" />
        </span>
      )}
    </div>
  );
}

function PanelEmpty({
  copy,
  icon,
  title,
}: {
  copy: string;
  icon: IconName;
  title: string;
}) {
  return (
    <div className="capsule-result-panel-empty">
      <span>
        <ResultIcon name={icon} />
      </span>
      <h3>{title}</h3>
      <p>{copy}</p>
    </div>
  );
}

function ResultMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <p>{value}</p>
      <span>{label}</span>
    </div>
  );
}

function ResultNavLink({
  active,
  href,
  icon,
  label,
}: {
  active?: boolean;
  href: string;
  icon: DashboardIconName;
  label: string;
}) {
  return (
    <Link
      className={cn(
        "capsule-result-nav-item",
        active && "capsule-result-nav-item-active",
      )}
      href={href}
    >
      <span className="capsule-result-nav-icon">
        <DashboardIcon name={icon} />
      </span>
      <span>{label}</span>
    </Link>
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
  icon: DashboardIconName;
  label: string;
}) {
  return (
    <Link
      className={cn(
        "capsule-result-bottom-item",
        active && "capsule-result-bottom-item-active",
      )}
      href={href}
    >
      <span>
        <DashboardIcon name={icon} />
      </span>
      <small>{label}</small>
    </Link>
  );
}

function buildPreview(
  snapshot: CapsuleResultSnapshot,
  items: CapsuleResultItem[],
  t: ReturnType<typeof useTranslations<"capsuleResult">>,
) {
  const categoryCount =
    snapshot.capsule?.categoryCount ?? snapshot.categories.length;
  const itemCount = items.length;
  const productivity = haveSameItemIds(items, snapshot.items)
    ? calculateOutfitProductivity(snapshot.capsule?.outfitCount ?? 0, items)
    : calculatePreviewOutfitProductivity(items);
  const outfitCount = productivity.outfitCount;
  const opr = productivity.opr;
  const baseOpr = snapshot.capsule?.oprValue ?? 0;
  const delta = productivity.oprValue - baseOpr;
  const gaps = buildGaps(snapshot.categories, snapshot.gaps, items, t);

  return {
    itemCount,
    outfitCount,
    categoryCount,
    opr,
    layeringCoverage: productivity.layeringCoverage,
    oprDelta:
      delta === 0 ? (snapshot.capsule?.oprDelta ?? "+0.0") : formatDelta(delta),
    gaps,
    shoppingRows: gaps.slice(0, 5),
    outfits: buildOutfits(items, snapshot.categories, t),
  };
}

function haveSameItemIds(
  currentItems: CapsuleResultItem[],
  persistedItems: CapsuleResultItem[],
): boolean {
  if (currentItems.length !== persistedItems.length) {
    return false;
  }

  const persistedIds = new Set(persistedItems.map((item) => item.id));
  return currentItems.every((item) => persistedIds.has(item.id));
}

function buildGaps(
  categories: CapsuleResultCategory[],
  baseGaps: CapsuleResultGap[],
  items: CapsuleResultItem[],
  t: ReturnType<typeof useTranslations<"capsuleResult">>,
): CapsuleResultGap[] {
  const coveredCategories = new Set(items.map((item) => item.categoryId));
  const gapsByCategory = new Map(baseGaps.map((gap) => [gap.categoryId, gap]));

  return categories
    .filter((category) => !coveredCategories.has(category.id))
    .map((category, index) => {
      const existing = gapsByCategory.get(category.id);

      if (existing) {
        return {
          ...existing,
          impact: Math.max(4, existing.impact - index),
        };
      }

      return {
        id: `local-gap-${category.id}`,
        categoryId: category.id,
        categoryLabel: category.label,
        colorHint: category.colorHint,
        colorHex: category.colorHex,
        type: "combinability" as const,
        reason: t("derivedGapReason"),
        impact: Math.max(4, 9 - index),
        priority:
          index < 2
            ? ("high" as const)
            : index < 4
              ? ("medium" as const)
              : ("low" as const),
      };
    });
}

function buildOutfits(
  items: CapsuleResultItem[],
  categories: CapsuleResultCategory[],
  t: ReturnType<typeof useTranslations<"capsuleResult">>,
): OutfitCard[] {
  if (!items.length) {
    return [];
  }

  const tops = items.filter((item) => item.section === "tops");
  const bottoms = items.filter(
    (item) => item.section === "bottoms" || item.section === "dresses",
  );
  const shoes = items.filter((item) => item.section === "shoes");
  const bags = items.filter((item) => item.section === "bags");
  const accessories = items.filter((item) => item.section === "accessories");
  const outerwear = items.filter((item) => item.section === "outerwear");

  return [
    {
      id: "everyday",
      name: t("outfitNames.everyday"),
      note: t("outfitNotes.viewOnly"),
      layers: compactLayers([
        layerFromItem(tops[0]),
        layerFromItem(bottoms[0]),
        layerFromItem(shoes[0]) ?? layerFromCategory(categories, "shoes"),
        layerFromItem(bags[0]) ?? layerFromCategory(categories, "bags"),
      ]),
    },
    {
      id: "layered",
      name: t("outfitNames.layered"),
      note: t("outfitNotes.viewOnly"),
      layers: compactLayers([
        layerFromItem(tops[1] ?? tops[0]),
        layerFromItem(bottoms[0]),
        layerFromItem(outerwear[0]) ??
          layerFromCategory(categories, "outerwear"),
        layerFromItem(accessories[0]) ??
          layerFromCategory(categories, "accessories"),
      ]),
    },
    {
      id: "travel",
      name: t("outfitNames.travel"),
      note: t("outfitNotes.viewOnly"),
      layers: compactLayers([
        layerFromItem(tops[0] ?? items[0]),
        layerFromItem(bottoms[1] ?? bottoms[0]),
        layerFromItem(shoes[0]) ?? layerFromCategory(categories, "shoes"),
        layerFromItem(bags[0] ?? accessories[0]) ??
          layerFromCategory(categories, "bags"),
      ]),
    },
  ].filter((outfit) => outfit.layers.length >= 2);
}

function visibleOutfitLayers(
  layers: OutfitLayer[],
  outfitView: OutfitView,
): Array<OutfitLayer | { extraCount: number }> {
  if (outfitView === "linear" || layers.length <= 4) {
    return layers;
  }

  return [...layers.slice(0, 3), { extraCount: layers.length - 3 }];
}

function layerFromItem(
  item: CapsuleResultItem | undefined,
): OutfitLayer | null {
  if (!item) {
    return null;
  }

  return {
    id: item.id,
    label: item.categoryLabel,
    colorHex: item.colorPoints[0]?.hex ?? "#8C8C8C",
    isGap: false,
  };
}

function layerFromCategory(
  categories: CapsuleResultCategory[],
  section: CapsuleResultCategory["section"],
): OutfitLayer | null {
  const category = categories.find((item) => item.section === section);

  if (!category) {
    return null;
  }

  return {
    id: `gap-layer-${category.id}`,
    label: category.label,
    colorHex: category.colorHex,
    isGap: true,
  };
}

function compactLayers(layers: Array<OutfitLayer | null>): OutfitLayer[] {
  return layers.filter((layer): layer is OutfitLayer => Boolean(layer));
}

function formatDelta(delta: number): string {
  if (delta === 0) {
    return "+0.0";
  }

  return `${delta > 0 ? "+" : ""}${delta.toFixed(1)}`;
}

function parseTab(raw: string | null): CapsuleResultTab {
  if (raw === "outfits" || raw === "gaps" || raw === "shopping") {
    return raw;
  }

  return "items";
}

function uniqueItems(items: CapsuleResultItem[]): CapsuleResultItem[] {
  const seen = new Set<string>();
  const unique: CapsuleResultItem[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    unique.push(item);
  }

  return unique;
}

function ResultIcon({ name }: { name: IconName }) {
  const common = {
    "aria-hidden": true,
    fill: "none",
    height: 18,
    viewBox: "0 0 24 24",
    width: 18,
  };

  switch (name) {
    case "add":
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
    case "arrow":
      return (
        <svg {...common}>
          <path
            d="M19 12H5M11 6l-6 6 6 6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "bag":
      return (
        <svg {...common}>
          <path
            d="M6 8h12l-1 12H7L6 8Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
          <path
            d="M9 8V6a3 3 0 0 1 6 0v2"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.7"
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
    case "capsule":
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
            strokeWidth="1.9"
          />
        </svg>
      );
    case "dashboard":
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
    case "garment":
      return (
        <svg aria-hidden fill="none" height="18" viewBox="0 0 18 18" width="18">
          <path
            d="M9 3s-2.8 2-2.8 4.4L2.5 9.4V15h13V9.4l-3.7-2C11.8 5 9 3 9 3Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1"
          />
        </svg>
      );
    case "grid":
      return (
        <svg {...common}>
          <rect
            height="6"
            rx="1.3"
            stroke="currentColor"
            strokeWidth="1.6"
            width="6"
            x="4"
            y="4"
          />
          <rect
            height="6"
            rx="1.3"
            stroke="currentColor"
            strokeWidth="1.6"
            width="6"
            x="14"
            y="4"
          />
          <rect
            height="6"
            rx="1.3"
            stroke="currentColor"
            strokeWidth="1.6"
            width="6"
            x="4"
            y="14"
          />
          <rect
            height="6"
            rx="1.3"
            stroke="currentColor"
            strokeWidth="1.6"
            width="6"
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
    case "repair":
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
    case "viewGrid":
      return (
        <svg aria-hidden fill="none" height="16" viewBox="0 0 16 16" width="16">
          <rect fill="currentColor" height="6" rx="1.5" width="6" x="1" y="1" />
          <rect fill="currentColor" height="6" rx="1.5" width="6" x="9" y="1" />
          <rect fill="currentColor" height="6" rx="1.5" width="6" x="1" y="9" />
          <rect fill="currentColor" height="6" rx="1.5" width="6" x="9" y="9" />
        </svg>
      );
    case "viewList":
      return (
        <svg aria-hidden fill="none" height="16" viewBox="0 0 16 16" width="16">
          <rect
            fill="currentColor"
            height="2.5"
            rx="1"
            width="14"
            x="1"
            y="2"
          />
          <rect
            fill="currentColor"
            height="2.5"
            rx="1"
            width="14"
            x="1"
            y="6.75"
          />
          <rect
            fill="currentColor"
            height="2.5"
            rx="1"
            width="14"
            x="1"
            y="11.5"
          />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path
            d="m6 6 12 12M18 6 6 18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.9"
          />
        </svg>
      );
  }
}
