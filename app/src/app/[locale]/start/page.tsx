import { setRequestLocale } from "next-intl/server";
import { GuestFlowLoader } from "@/components/guest/GuestFlowLoader";
import "@/styles/guest.css";

interface StartRouteProps {
  params: Promise<{ locale: string }>;
}

// Гостевой онбординг: польза до регистрации (PRODUCT-PLAN, Этап 1).
export default async function StartRoute({ params }: StartRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <GuestFlowLoader />;
}
