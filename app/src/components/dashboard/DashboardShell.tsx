"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { signOutAction } from "@/features/auth/actions";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { DashboardSnapshot } from "./dashboard-data";

interface DashboardShellProps {
  snapshot: DashboardSnapshot;
}

type IconName =
  | "bag"
  | "ban"
  | "capsule"
  | "capsules"
  | "for-repair"
  | "grid"
  | "heart"
  | "list"
  | "logout"
  | "more"
  | "my-items"
  | "outfits"
  | "pin"
  | "plus"
  | "profile"
  | "settings"
  | "spark"
  | "tag"
  | "wrench";

interface DashboardNavItem {
  href: string;
  icon: IconName;
  label: string;
  active?: boolean;
  badge?: number;
}

export function DashboardShell({ snapshot }: DashboardShellProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const signOut = async () => {
    await signOutAction();
    router.push(`/${locale}`);
    router.refresh();
  };

  const navGroups: Array<{ label: string; items: DashboardNavItem[] }> = [
    {
      label: t("nav.overview"),
      items: [
        {
          href: "/dashboard",
          icon: "grid" as const,
          label: t("nav.dashboard"),
          active: true,
        },
      ],
    },
    {
      label: t("nav.wardrobe"),
      items: [
        {
          href: "/my-items",
          icon: "my-items" as const,
          label: t("nav.myItems"),
          badge: snapshot.navigation.myItems,
        },
        {
          href: "/capsule-result",
          icon: "outfits" as const,
          label: t("nav.outfits"),
          badge: snapshot.navigation.outfits,
        },
        {
          href: "/capsule-result",
          icon: "capsules" as const,
          label: t("nav.capsules"),
          badge: snapshot.navigation.capsules,
        },
        {
          href: "/uncapsulated",
          icon: "ban" as const,
          label: t("nav.uncapsulated"),
          badge: snapshot.navigation.uncapsulated,
        },
      ],
    },
    {
      label: t("nav.lists"),
      items: [
        {
          href: "/favorites",
          icon: "heart" as const,
          label: t("nav.favorites"),
          badge: snapshot.navigation.favorites,
        },
        {
          href: "/dashboard#shopping-list",
          icon: "list" as const,
          label: t("nav.shoppingList"),
          badge: snapshot.navigation.shoppingList,
        },
        {
          href: "/for-sale",
          icon: "tag" as const,
          label: t("nav.forSale"),
          badge: snapshot.navigation.forSale,
        },
        {
          href: "/for-repair",
          icon: "for-repair" as const,
          label: t("nav.forRepair"),
          badge: snapshot.navigation.forRepair,
        },
      ],
    },
  ];

  const moreItems: DashboardNavItem[] = [
    {
      href: "/capsule-result",
      icon: "outfits" as const,
      label: t("nav.outfits"),
      badge: snapshot.navigation.outfits,
    },
    {
      href: "/uncapsulated",
      icon: "ban" as const,
      label: t("nav.uncapsulated"),
      badge: snapshot.navigation.uncapsulated,
    },
    {
      href: "/dashboard#shopping-list",
      icon: "list" as const,
      label: t("nav.shoppingList"),
      badge: snapshot.navigation.shoppingList,
    },
    {
      href: "/for-sale",
      icon: "tag" as const,
      label: t("nav.forSale"),
      badge: snapshot.navigation.forSale,
    },
    {
      href: "/for-repair",
      icon: "for-repair" as const,
      label: t("nav.forRepair"),
      badge: snapshot.navigation.forRepair,
    },
    {
      href: "/profile",
      icon: "profile" as const,
      label: t("nav.profile"),
    },
    {
      href: "/profile",
      icon: "settings" as const,
      label: t("nav.settings"),
    },
  ];

  return (
    <div className="cz-page dashboard-page">
      <div className="wallpaper-bg" />
      <div className="wallpaper-overlay" />

      <div className="dashboard-app">
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar-head">
            <Link className="dashboard-logo" href="/">
              Capsule Zero
            </Link>
            <div className="dashboard-user-row">
              <Link aria-label={t("nav.profile")} className="dashboard-avatar-link" href="/profile">
                <span className="dashboard-avatar">{snapshot.profile.initials}</span>
              </Link>
              <div className="dashboard-user-meta">
                <p className="dashboard-user-name">{snapshot.profile.displayName}</p>
                <p className="dashboard-user-email">{snapshot.profile.email}</p>
              </div>
            </div>
          </div>

          <nav className="dashboard-nav" aria-label={t("nav.main")}>
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
                      <DashboardIcon name={item.icon} />
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
                <DashboardIcon name="settings" />
              </span>
              <span className="dashboard-nav-label">{t("nav.settings")}</span>
            </Link>
            <button className="dashboard-nav-item dashboard-nav-button" onClick={signOut} type="button">
              <span className="dashboard-nav-icon">
                <DashboardIcon name="logout" />
              </span>
              <span className="dashboard-nav-label">{t("logout")}</span>
            </button>
          </div>
        </aside>

        <main className="dashboard-main">
          <header className="dashboard-topbar">
            <div>
              <p className="dashboard-greeting">{t("greeting", { name: snapshot.profile.displayName })}</p>
              <p className="dashboard-date">{t("dateLine")}</p>
            </div>
            <div className="dashboard-topbar-actions">
              <LanguageSwitcher />
              <button
                aria-disabled="true"
                className="dashboard-primary-action dashboard-primary-action-disabled"
                disabled
                type="button"
              >
                <DashboardIcon name="plus" />
                <span>{t("addItem")}</span>
              </button>
            </div>
          </header>

          <div className="dashboard-content">
            {snapshot.activeCapsule ? (
              <section className="dashboard-glass dashboard-capsule-card">
                <div className="dashboard-capsule-body">
                  <p className="dashboard-capsule-eyebrow">
                    <DashboardIcon name="pin" />
                    <span>{t("activeCapsule")}</span>
                  </p>
                  <h1>{snapshot.activeCapsule.name}</h1>

                  <div className="dashboard-palette-row" aria-label={t("palette")}>
                    {snapshot.activeCapsule.palette.map((color) => (
                      <span
                        aria-label={color.name}
                        className={cn(
                          "dashboard-palette-dot",
                          color.size === "large" && "dashboard-palette-dot-large",
                        )}
                        key={`${color.hex}-${color.name}`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                    <span className="dashboard-palette-label">{t("palette")}</span>
                  </div>

                  <div className="dashboard-capsule-stats">
                    <Metric value={snapshot.activeCapsule.itemCount} label={t("items")} />
                    <Metric value={snapshot.activeCapsule.outfitCount} label={t("outfits")} />
                    <Metric value={snapshot.activeCapsule.categoryCount} label={t("categories")} />
                  </div>

                  <div className="dashboard-capsule-actions">
                    <button
                      aria-disabled="true"
                      className="dashboard-ghost-action dashboard-ghost-action-disabled"
                      disabled
                      type="button"
                    >
                      {t("openCapsule")}
                    </button>
                    <button
                      aria-disabled="true"
                      className="dashboard-ghost-action dashboard-ghost-action-disabled"
                      disabled
                      type="button"
                    >
                      {t("outfits")}
                    </button>
                    <Link className="dashboard-ghost-action" href="/dashboard#shopping-list">
                      {t("shoppingList")}
                    </Link>
                  </div>
                </div>

                <div className="dashboard-opr-widget">
                  <p className="dashboard-opr-value">{snapshot.activeCapsule.opr}</p>
                  <p className="dashboard-opr-label">{t("opr")}</p>
                  <p className="dashboard-opr-hint">{t("oprHint")}</p>
                </div>
              </section>
            ) : (
              <section className="dashboard-glass dashboard-empty-card">
                <p>{t("emptyEyebrow")}</p>
                <h1>{t("emptyTitle")}</h1>
                <button
                  aria-disabled="true"
                  className="dashboard-primary-action dashboard-primary-action-disabled"
                  disabled
                  type="button"
                >
                  <DashboardIcon name="plus" />
                  <span>{t("createFirstCapsule")}</span>
                </button>
              </section>
            )}

            <section className="dashboard-stats-row" aria-label={t("statsLabel")}>
              <StatCard label={t("totalItems")} sublabel={t("inWardrobe")} value={snapshot.stats.totalItems} />
              <StatCard label={t("totalOutfits")} sublabel={t("acrossCapsules")} value={snapshot.stats.totalOutfits} />
              <StatCard label={t("uncapsulated")} sublabel={t("collectIntoCapsule")} value={snapshot.stats.uncapsulated} />
            </section>

            <section className="dashboard-duo-grid">
              <div className="dashboard-glass dashboard-panel" id="shopping-list">
                <PanelHeader href="/dashboard#shopping-list" linkLabel={t("all")} title={t("shoppingList")} />
                {snapshot.shoppingPreview.map((item) => (
                  <div className="dashboard-shop-item" key={item.id}>
                    <span className={`dashboard-shop-bar dashboard-shop-bar-${item.priority}`} />
                    <span className="dashboard-shop-name">{item.name}</span>
                    <span className="dashboard-shop-meta">
                      {t("outfitImpact", { count: item.impact })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="dashboard-glass dashboard-panel">
                <PanelHeader href="/my-items" linkLabel={t("allItems")} title={t("recentlyAdded")} />
                {snapshot.recentItems.map((item) => (
                  <div className="dashboard-recent-item" key={item.id}>
                    <span className="dashboard-recent-thumb">
                      <DashboardIcon name="bag" />
                    </span>
                    <span className="dashboard-recent-meta">
                      <span className="dashboard-recent-name">{item.name}</span>
                      <span className="dashboard-recent-category">
                        {item.category} · {ageLabel(t, item)}
                      </span>
                    </span>
                    <span
                      aria-label={item.name}
                      className="dashboard-recent-color"
                      style={{ backgroundColor: item.colorHex }}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="dashboard-sections-row" aria-label={t("quickAccess")}>
              {snapshot.quickAccess.map((item) => (
                <Link className="dashboard-glass dashboard-section-card" href={quickHref(item.id)} key={item.id}>
                  <span className="dashboard-section-icon">
                    <DashboardIcon name={quickIcon(item.id)} />
                  </span>
                  <span className="dashboard-section-count">{item.count}</span>
                  <span className="dashboard-section-label">{t(`quick.${item.id}`)}</span>
                </Link>
              ))}
            </section>
          </div>
        </main>
      </div>

      <nav className={cn("dashboard-bottom-nav", moreOpen && "dashboard-bottom-nav-menu-open")} aria-label={t("nav.mobile")}>
        <BottomNavLink active href="/dashboard" icon="grid" label={t("nav.dashboard")} />
        <BottomNavLink href="/my-items" icon="my-items" label={t("nav.myItems")} />
        <BottomNavLink href="/capsule-result" icon="capsules" label={t("nav.capsules")} />
        <BottomNavLink href="/favorites" icon="heart" label={t("nav.favorites")} />
        <button
          aria-label={t("nav.more")}
          aria-expanded={moreOpen}
          className="dashboard-bottom-item dashboard-bottom-button"
          onClick={() => setMoreOpen((value) => !value)}
          type="button"
        >
          <span className="dashboard-bottom-icon">
            <DashboardIcon name="more" />
          </span>
          <span className="dashboard-bottom-label">{t("nav.more")}</span>
        </button>
      </nav>

      <button
        aria-label={t("closeMore")}
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
                <DashboardIcon name={item.icon} />
              </span>
              <span className="dashboard-more-label">{item.label}</span>
              {typeof item.badge === "number" ? (
                <span className="dashboard-more-badge">{item.badge}</span>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="dashboard-metric-value">{value}</p>
      <p className="dashboard-metric-label">{label}</p>
    </div>
  );
}

function StatCard({
  label,
  sublabel,
  value,
}: {
  label: string;
  sublabel: string;
  value: number;
}) {
  return (
    <div className="dashboard-glass dashboard-stat-card">
      <p className="dashboard-stat-value">{value}</p>
      <p className="dashboard-stat-label">{label}</p>
      <p className="dashboard-stat-sub">{sublabel}</p>
    </div>
  );
}

function PanelHeader({
  href,
  linkLabel,
  title,
}: {
  href: string;
  linkLabel: string;
  title: string;
}) {
  return (
    <div className="dashboard-panel-head">
      <h2>{title}</h2>
      <Link className="dashboard-panel-link" href={href}>
        {linkLabel}
      </Link>
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
        <DashboardIcon name={icon} />
      </span>
      <span className="dashboard-bottom-label">{label}</span>
    </Link>
  );
}

function ageLabel(
  t: ReturnType<typeof useTranslations<"dashboard">>,
  item: DashboardSnapshot["recentItems"][number],
) {
  if (item.age === "today") {
    return t("today");
  }

  if (item.age === "week") {
    return t("weekAgo");
  }

  return t("daysAgo", { count: item.ageCount });
}

function quickHref(id: DashboardSnapshot["quickAccess"][number]["id"]) {
  const hrefs = {
    favorites: "/favorites",
    for_sale: "/for-sale",
    for_repair: "/for-repair",
    uncapsulated: "/uncapsulated",
  } satisfies Record<DashboardSnapshot["quickAccess"][number]["id"], string>;

  return hrefs[id];
}

function quickIcon(id: DashboardSnapshot["quickAccess"][number]["id"]): IconName {
  const icons = {
    favorites: "heart",
    for_sale: "tag",
    for_repair: "for-repair",
    uncapsulated: "ban",
  } satisfies Record<DashboardSnapshot["quickAccess"][number]["id"], IconName>;

  return icons[id];
}

function DashboardIcon({ name }: { name: IconName }) {
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
          <path d="M6 8h12l-1 12H7L6 8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </svg>
      );
    case "ban":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
          <path d="m6.4 6.4 11.2 11.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </svg>
      );
    case "capsule":
      return (
        <svg {...common}>
          <path
            d="M7 4h10v6c0 5-5 8-5 8s-5-3-5-8V4Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
          <path d="M7 9h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
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
          <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" width="7" x="3" y="3" />
          <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" width="7" x="14" y="3" />
          <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" width="7" x="3" y="14" />
          <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" width="7" x="14" y="14" />
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
          <path d="M5 7h14M5 12h11M5 17h8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
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
    case "logout":
      return (
        <svg {...common}>
          <path
            d="M10 5V4a2 2 0 0 1 2-2h7v20h-7a2 2 0 0 1-2-2v-1"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path d="M3 12h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="m10 8 4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
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
          <path d="m2.5 6 2.5-3.5h7L14.5 6" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" />
          <path d="M8.5 2.5V6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        </svg>
      );
    case "outfits":
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
    case "pin":
      return (
        <svg aria-hidden height="27" viewBox="0 -1 14 15" width="27">
          <g transform="rotate(45 7 7)">
            <rect fill="currentColor" height="4.8" rx="1.5" width="3.6" x="5.2" y="-0.3" />
            <ellipse cx="7" cy="4.5" fill="currentColor" rx="4" ry="1.8" />
            <polygon fill="currentColor" points="6.5,5.5 7.5,5.5 7,13" />
          </g>
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
          <path
            d="M19 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.5-2.4 1a7.5 7.5 0 0 0-1.9-1.1L14.3 3h-4.6l-.3 2.8a7.5 7.5 0 0 0-1.9 1.1l-2.4-1-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.1l-2 1.5 2 3.5 2.4-1c.6.5 1.2.9 1.9 1.1l.3 2.8h4.6l.3-2.8c.7-.3 1.3-.6 1.9-1.1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1.1Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.4"
          />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path d="m12 3 2.2 6.2L20 12l-5.8 2.8L12 21l-2.2-6.2L4 12l5.8-2.8L12 3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="M4 5v6.2L12.8 20 20 12.8 11.2 4H5a1 1 0 0 0-1 1Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
          <circle cx="8" cy="8" r="1.2" fill="currentColor" />
        </svg>
      );
    case "wrench":
      return (
        <svg {...common}>
          <path
            d="M15 6a4.5 4.5 0 0 0 5 5l-8.5 8.5a3 3 0 0 1-4.2-4.2L15.8 6.8A4 4 0 0 1 15 6Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      );
  }
}
