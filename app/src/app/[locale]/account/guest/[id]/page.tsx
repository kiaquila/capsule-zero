import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { readAppSession } from "@/features/auth/session";
import { createProviderRegistry } from "@/lib/providers";
import { SavedGuestResult } from "@/components/guest/SavedGuestResult";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import "@/styles/guest.css";
export default async function SavedGuestRoute({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const session = await readAppSession();
  if (!session) redirect(`/${locale}/auth`);
  const port = createProviderRegistry().guestProgress;
  if (!port || !/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const saved = await port.get(session.userId, id).catch(() => null);
  if (!saved) notFound();
  return (
    <div className="cz-page guest-page">
      <div className="wallpaper-bg" />
      <div className="wallpaper-overlay" />
      <header className="guest-header">
        <a className="landing-logo" href={`/${locale}/dashboard`}>
          Capsule Zero
        </a>
        <LanguageSwitcher />
      </header>
      <main className="guest-main">
        <SavedGuestResult saved={saved} />
      </main>
    </div>
  );
}
