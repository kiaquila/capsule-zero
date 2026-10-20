"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { SavedGuest } from "@/lib/providers";
import { evaluate } from "@/features/guest/outfits";
import { GuestResultStep } from "./GuestResultStep";
export function SavedGuestResult({ saved }: { saved: SavedGuest }) {
  const t = useTranslations("guest");
  return (
    <>
      <div className="guest-hero">
        <p
          className="guest-note"
          role="status"
          data-testid="guest-saved-confirmation"
        >
          {t("savedInAccount")}
        </p>
      </div>
      <GuestResultStep
        readOnly
        evaluation={evaluate(saved.items)}
        pickedItems={saved.items}
        recommendations={[]}
        onAdd={() => {}}
        onEdit={() => {}}
        onSave={() => {}}
      />
      <Link
        className="guest-ghost guest-back guest-account-link"
        href="/dashboard"
        data-testid="guest-account-dashboard"
      >
        {t("accountDashboard")}
      </Link>
    </>
  );
}
