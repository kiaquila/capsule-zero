"use client";

import type { ReactNode } from "react";

// Standard in-app notification surface (spec 035 review round 2): a glass
// panel with an info glyph in the top-right corner, aligned with the other
// content cards of the page it sits on. Any screen that needs an inline
// notification composes this shell and supplies its own body (copy, forms,
// actions) as children — do not hand-roll one-off banner markup.

interface NotificationBannerProps {
  title: string;
  description?: string;
  testId?: string;
  children?: ReactNode;
}

export function NotificationBanner({
  title,
  description,
  testId,
  children,
}: NotificationBannerProps) {
  return (
    <section className="dashboard-glass notification-banner" data-testid={testId}>
      <span aria-hidden="true" className="notification-banner-icon">
        <InfoIcon />
      </span>
      <div className="notification-banner-copy">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function InfoIcon() {
  return (
    <svg fill="none" height="20" viewBox="0 0 24 24" width="20">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 11v6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="7.5" fill="currentColor" r="1" />
    </svg>
  );
}
