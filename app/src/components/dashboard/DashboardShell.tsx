"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { VerifyEmailBanner } from "@/components/auth/VerifyEmailBanner";
import { signOutAction } from "@/features/auth/actions";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  DashboardIcon,
  DashboardNavigationFrame,
  type DashboardIconName,
} from "./DashboardNavigation";
import type { DashboardSnapshot } from "./dashboard-data";

interface DashboardShellProps {
  snapshot: DashboardSnapshot;
  /** Present while the signed-in user's email is unverified (spec 035). */
  verifyEmail?: { email: string; flowId?: string };
}

export function DashboardShell({
  snapshot,
  verifyEmail,
}: DashboardShellProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();

  const signOut = async () => {
    await signOutAction();
    router.push(`/${locale}`);
    router.refresh();
  };

  return (
    <DashboardNavigationFrame
      activeKey="dashboard"
      mobileActiveKey="dashboard"
      navigation={snapshot.navigation}
      onSignOut={signOut}
      profile={{
        displayName: snapshot.profile.displayName,
        initials: snapshot.profile.initials,
        meta: snapshot.profile.email,
      }}
    >
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-greeting">
              {t("greeting", { name: snapshot.profile.displayName })}
            </p>
            <p className="dashboard-date">{t("dateLine")}</p>
          </div>
          <div className="dashboard-topbar-actions">
            <LanguageSwitcher />
            <Link className="dashboard-primary-action" href="/guided-journey">
              <DashboardIcon name="plus" />
              <span>{t("addItem")}</span>
            </Link>
          </div>
        </header>

        <div className="dashboard-content">
          {verifyEmail ? (
            <VerifyEmailBanner
              email={verifyEmail.email}
              initialFlowId={verifyEmail.flowId}
            />
          ) : null}
          {snapshot.activeCapsule ? (
            <section className="dashboard-glass dashboard-capsule-card">
              <div className="dashboard-capsule-body">
                <p className="dashboard-capsule-eyebrow">
                  <DashboardIcon name="pin" />
                  <span>{t("activeCapsule")}</span>
                </p>
                <h1>{snapshot.activeCapsule.name}</h1>

                <div
                  className="dashboard-palette-row"
                  aria-label={t("palette")}
                >
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
                  <span className="dashboard-palette-label">
                    {t("palette")}
                  </span>
                </div>

                <div className="dashboard-capsule-stats">
                  <Metric
                    value={snapshot.activeCapsule.itemCount}
                    label={t("items")}
                  />
                  <Metric
                    value={snapshot.activeCapsule.outfitCount}
                    label={t("outfits")}
                  />
                  <Metric
                    value={snapshot.activeCapsule.categoryCount}
                    label={t("categories")}
                  />
                </div>

                <div className="dashboard-capsule-actions">
                  <Link
                    className="dashboard-ghost-action"
                    href="/capsule-result"
                  >
                    {t("openCapsule")}
                  </Link>
                  <Link
                    className="dashboard-ghost-action"
                    href="/capsule-result?tab=outfits"
                  >
                    {t("outfits")}
                  </Link>
                  <Link
                    className="dashboard-ghost-action"
                    href="/dashboard#shopping-list"
                  >
                    {t("shoppingList")}
                  </Link>
                </div>
              </div>

              <div className="dashboard-opr-widget">
                <p className="dashboard-opr-value">
                  {snapshot.activeCapsule.opr}
                </p>
                <p className="dashboard-opr-label">{t("opr")}</p>
                <p className="dashboard-opr-hint">{t("oprHint")}</p>
              </div>
            </section>
          ) : (
            <section className="dashboard-glass dashboard-empty-card">
              <p>{t("emptyEyebrow")}</p>
              <h1>{t("emptyTitle")}</h1>
              <Link className="dashboard-primary-action" href="/guided-journey">
                <DashboardIcon name="plus" />
                <span>{t("createFirstCapsule")}</span>
              </Link>
            </section>
          )}

          <section className="dashboard-stats-row" aria-label={t("statsLabel")}>
            <StatCard
              label={t("totalItems")}
              sublabel={t("inWardrobe")}
              value={snapshot.stats.totalItems}
            />
            <StatCard
              label={t("totalOutfits")}
              sublabel={t("acrossCapsules")}
              value={snapshot.stats.totalOutfits}
            />
            <StatCard
              label={t("uncapsulated")}
              sublabel={t("collectIntoCapsule")}
              value={snapshot.stats.uncapsulated}
            />
          </section>

          <section className="dashboard-duo-grid">
            <div className="dashboard-glass dashboard-panel" id="shopping-list">
              <PanelHeader
                href="/dashboard#shopping-list"
                linkLabel={t("all")}
                title={t("shoppingList")}
              />
              {snapshot.shoppingPreview.map((item) => (
                <div className="dashboard-shop-item" key={item.id}>
                  <span
                    className={`dashboard-shop-bar dashboard-shop-bar-${item.priority}`}
                  />
                  <span className="dashboard-shop-name">{item.name}</span>
                  <span className="dashboard-shop-meta">
                    {t("outfitImpact", { count: item.impact })}
                  </span>
                </div>
              ))}
            </div>

            <div className="dashboard-glass dashboard-panel">
              <PanelHeader
                href="/my-items"
                linkLabel={t("allItems")}
                title={t("recentlyAdded")}
              />
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

          <section
            className="dashboard-sections-row"
            aria-label={t("quickAccess")}
          >
            {snapshot.quickAccess.map((item) => (
              <Link
                className="dashboard-glass dashboard-section-card"
                href={quickHref(item.id)}
                key={item.id}
              >
                <span className="dashboard-section-icon">
                  <DashboardIcon name={quickIcon(item.id)} />
                </span>
                <span className="dashboard-section-count">{item.count}</span>
                <span className="dashboard-section-label">
                  {t(`quick.${item.id}`)}
                </span>
              </Link>
            ))}
          </section>
        </div>
      </main>
    </DashboardNavigationFrame>
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

function ageLabel(
  t: ReturnType<typeof useTranslations<"dashboard">>,
  item: DashboardSnapshot["recentItems"][number],
) {
  if (item.age === "today") {
    return t("today");
  }

  if (item.age === "week") {
    return t("weekAgo", { count: item.ageCount });
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

function quickIcon(
  id: DashboardSnapshot["quickAccess"][number]["id"],
): DashboardIconName {
  const icons = {
    favorites: "heart",
    for_sale: "tag",
    for_repair: "for-repair",
    uncapsulated: "ban",
  } satisfies Record<
    DashboardSnapshot["quickAccess"][number]["id"],
    DashboardIconName
  >;

  return icons[id];
}
