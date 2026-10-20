"use client";

import dynamic from "next/dynamic";

// Гостевое состояние живёт в localStorage браузера — рендерим только на клиенте.
export const GuestFlowLoader = dynamic(
  () => import("./GuestFlow").then((m) => m.GuestFlow),
  {
    ssr: false,
    loading: () => (
      <div className="cz-page guest-page">
        <div className="wallpaper-bg" />
        <div className="wallpaper-overlay" />
      </div>
    ),
  },
);
