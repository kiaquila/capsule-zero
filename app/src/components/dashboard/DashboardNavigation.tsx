"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { DashboardSnapshot } from "./dashboard-data";

export type DashboardNavigationKey =
  | "dashboard"
  | "my-items"
  | "outfits"
  | "capsules"
  | "uncapsulated"
  | "favorites"
  | "shopping-list"
  | "for-sale"
  | "for-repair"
  | "profile"
  | "settings";

export type DashboardIconName =
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

interface DashboardNavigationItem {
  key: DashboardNavigationKey;
  href: string;
  icon: DashboardIconName;
  label: string;
  badge?: number;
}

interface DashboardNavigationFrameProps {
  activeKey: DashboardNavigationKey;
  children: ReactNode;
  mobileActiveKey?:
    | "dashboard"
    | "my-items"
    | "capsules"
    | "favorites"
    | "more";
  navigation: DashboardSnapshot["navigation"];
  onSignOut: () => void;
  pageClassName?: string;
  profile: {
    avatarSrc?: string;
    displayName: string;
    initials: string;
    meta: string;
  };
}

export function DashboardNavigationFrame({
  activeKey,
  children,
  mobileActiveKey,
  navigation,
  onSignOut,
  pageClassName,
  profile,
}: DashboardNavigationFrameProps) {
  const t = useTranslations("dashboard");
  const [moreOpen, setMoreOpen] = useState(false);
  const navGroups = buildDashboardNavGroups(t, navigation);
  const moreItems = buildDashboardMoreItems(t, navigation);
  const bottomActiveKey = mobileActiveKey ?? activeKey;

  return (
    <div className={cn("cz-page dashboard-page", pageClassName)}>
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
                aria-label={t("nav.profile")}
                className="dashboard-avatar-link"
                href="/profile"
              >
                <span className="dashboard-avatar">
                  {profile.avatarSrc ? (
                    <Image
                      alt=""
                      height={38}
                      src={profile.avatarSrc}
                      unoptimized
                      width={38}
                    />
                  ) : (
                    profile.initials
                  )}
                </span>
              </Link>
              <div className="dashboard-user-meta">
                <p className="dashboard-user-name">{profile.displayName}</p>
                <p className="dashboard-user-email">{profile.meta}</p>
              </div>
            </div>
          </div>

          <nav className="dashboard-nav" aria-label={t("nav.main")}>
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="dashboard-nav-section">{group.label}</p>
                {group.items.map((item) => (
                  <Link
                    className={cn(
                      "dashboard-nav-item",
                      item.key === activeKey && "dashboard-nav-item-active",
                    )}
                    href={item.href}
                    key={item.key}
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
            <Link
              className={cn(
                "dashboard-nav-item",
                activeKey === "settings" && "dashboard-nav-item-active",
              )}
              href="/profile"
            >
              <span className="dashboard-nav-icon">
                <DashboardIcon name="settings" />
              </span>
              <span className="dashboard-nav-label">{t("nav.settings")}</span>
            </Link>
            <button
              className="dashboard-nav-item dashboard-nav-button"
              data-testid="nav-sign-out"
              onClick={onSignOut}
              type="button"
            >
              <span className="dashboard-nav-icon">
                <DashboardIcon name="logout" />
              </span>
              <span className="dashboard-nav-label">{t("logout")}</span>
            </button>
          </div>
        </aside>

        {children}
      </div>

      <nav
        className={cn(
          "dashboard-bottom-nav",
          moreOpen && "dashboard-bottom-nav-menu-open",
        )}
        aria-label={t("nav.mobile")}
      >
        <BottomNavLink
          active={bottomActiveKey === "dashboard"}
          href="/dashboard"
          icon="grid"
          label={t("nav.dashboard")}
        />
        <BottomNavLink
          active={bottomActiveKey === "my-items"}
          href="/my-items"
          icon="my-items"
          label={t("nav.myItems")}
        />
        <BottomNavLink
          active={bottomActiveKey === "capsules"}
          href="/capsule-result"
          icon="capsules"
          label={t("nav.capsules")}
        />
        <BottomNavLink
          active={bottomActiveKey === "favorites"}
          href="/favorites"
          icon="heart"
          label={t("nav.favorites")}
        />
        <button
          aria-expanded={moreOpen}
          data-testid="nav-more-toggle"
          aria-label={t("nav.more")}
          className={cn(
            "dashboard-bottom-item dashboard-bottom-button",
            bottomActiveKey === "more" && "dashboard-bottom-item-active",
          )}
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
                item.key === activeKey && "dashboard-more-item-active",
              )}
              href={item.href}
              key={item.key}
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
          <button
            className="dashboard-more-item dashboard-more-action"
            data-testid="nav-sign-out-mobile"
            onClick={() => {
              setMoreOpen(false);
              onSignOut();
            }}
            type="button"
          >
            <span className="dashboard-more-icon">
              <DashboardIcon name="logout" />
            </span>
            <span className="dashboard-more-label">{t("logout")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function buildDashboardNavGroups(
  t: ReturnType<typeof useTranslations<"dashboard">>,
  navigation: DashboardSnapshot["navigation"],
): Array<{ label: string; items: DashboardNavigationItem[] }> {
  return [
    {
      label: t("nav.overview"),
      items: [
        {
          key: "dashboard",
          href: "/dashboard",
          icon: "grid",
          label: t("nav.dashboard"),
        },
        {
          key: "my-items",
          href: "/my-items",
          icon: "my-items",
          label: t("nav.myItems"),
          badge: navigation.myItems,
        },
        {
          key: "outfits",
          href: "/capsule-result?tab=outfits",
          icon: "outfits",
          label: t("nav.outfits"),
          badge: navigation.outfits,
        },
        {
          key: "capsules",
          href: "/capsule-result",
          icon: "capsules",
          label: t("nav.capsules"),
          badge: navigation.capsules,
        },
        {
          key: "uncapsulated",
          href: "/uncapsulated",
          icon: "ban",
          label: t("nav.uncapsulated"),
          badge: navigation.uncapsulated,
        },
        {
          key: "favorites",
          href: "/favorites",
          icon: "heart",
          label: t("nav.favorites"),
          badge: navigation.favorites,
        },
      ],
    },
    {
      label: t("nav.lists"),
      items: [
        {
          key: "shopping-list",
          href: "/capsule-result?tab=shopping",
          icon: "list",
          label: t("nav.shoppingList"),
          badge: navigation.shoppingList,
        },
        {
          key: "for-sale",
          href: "/for-sale",
          icon: "tag",
          label: t("nav.forSale"),
          badge: navigation.forSale,
        },
        {
          key: "for-repair",
          href: "/for-repair",
          icon: "for-repair",
          label: t("nav.forRepair"),
          badge: navigation.forRepair,
        },
      ],
    },
  ] satisfies Array<{ label: string; items: DashboardNavigationItem[] }>;
}

function buildDashboardMoreItems(
  t: ReturnType<typeof useTranslations<"dashboard">>,
  navigation: DashboardSnapshot["navigation"],
): DashboardNavigationItem[] {
  return [
    {
      key: "outfits",
      href: "/capsule-result?tab=outfits",
      icon: "outfits",
      label: t("nav.outfits"),
      badge: navigation.outfits,
    },
    {
      key: "uncapsulated",
      href: "/uncapsulated",
      icon: "ban",
      label: t("nav.uncapsulated"),
      badge: navigation.uncapsulated,
    },
    {
      key: "shopping-list",
      href: "/capsule-result?tab=shopping",
      icon: "list",
      label: t("nav.shoppingList"),
      badge: navigation.shoppingList,
    },
    {
      key: "for-sale",
      href: "/for-sale",
      icon: "tag",
      label: t("nav.forSale"),
      badge: navigation.forSale,
    },
    {
      key: "for-repair",
      href: "/for-repair",
      icon: "for-repair",
      label: t("nav.forRepair"),
      badge: navigation.forRepair,
    },
    {
      key: "profile",
      href: "/profile",
      icon: "profile",
      label: t("nav.profile"),
    },
    {
      key: "settings",
      href: "/profile",
      icon: "settings",
      label: t("nav.settings"),
    },
  ] satisfies DashboardNavigationItem[];
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
        "dashboard-bottom-item",
        active && "dashboard-bottom-item-active",
      )}
      href={href}
    >
      <span className="dashboard-bottom-icon">
        <DashboardIcon name={icon} />
      </span>
      <span className="dashboard-bottom-label">{label}</span>
    </Link>
  );
}

export function DashboardIcon({ name }: { name: DashboardIconName }) {
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
        <svg {...common}>
          <path
            d="M7 4h10v6c0 5-5 8-5 8s-5-3-5-8V4Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
          <path
            d="M7 9h10"
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
            d="M10 17l5-5-5-5M15 12H3M21 4v16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
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
            <rect
              fill="currentColor"
              height="4.8"
              rx="1.5"
              width="3.6"
              x="5.2"
              y="-0.3"
            />
            <ellipse cx="7" cy="4.5" fill="currentColor" rx="4" ry="1.8" />
            <polygon fill="currentColor" points="6.5,5.5 7.5,5.5 7,13" />
          </g>
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
    case "spark":
      return (
        <svg {...common}>
          <path
            d="m12 3 2.2 6.2L20 12l-5.8 2.8L12 21l-2.2-6.2L4 12l5.8-2.8L12 3Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.7"
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
