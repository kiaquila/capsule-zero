import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { readAppSession } from "@/features/auth/session";
import { GuestSaveContinue } from "@/components/guest/GuestSaveContinue";
import "@/styles/guest.css";
export default async function GuestContinueRoute({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ transferId?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { transferId = "" } = await searchParams;
  const validId = /^[0-9a-f-]{36}$/i.test(transferId) ? transferId : "";
  const session = await readAppSession();
  if (!session)
    redirect(`/${locale}/auth?guestSave=1&guestTransferId=${validId}`);
  return (
    <div className="cz-page guest-page">
      <div className="wallpaper-bg" />
      <div className="wallpaper-overlay" />
      <main className="guest-main">
        <GuestSaveContinue userId={session.userId} transferId={validId} />
      </main>
    </div>
  );
}
