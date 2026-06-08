"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/features/auth/actions";

interface DashboardShellProps {
  email: string;
}

export function DashboardShell({ email }: DashboardShellProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();

  const signOut = async () => {
    await signOutAction();
    router.push(`/${locale}`);
    router.refresh();
  };

  return (
    <div className="cz-page dashboard-page">
      <div className="wallpaper-bg" />
      <div className="wallpaper-overlay" />

      <main className="dashboard-main">
        <section className="dashboard-panel glass">
          <p>{t("welcome")}</p>
          <h1>{t("title")}</h1>
          <p className="dashboard-session">
            {t("sessionLabel")} {email}
          </p>
          <button className="auth-primary dashboard-logout" onClick={signOut} type="button">
            {t("logout")}
          </button>
        </section>
      </main>
    </div>
  );
}
