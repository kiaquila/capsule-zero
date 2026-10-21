"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ProfileSnapshot } from "./profile-data";

/** Read-only inventory; metadata is supplied by Kratos, never inferred. */
export function ProfileSessions({
  account,
}: {
  account: ProfileSnapshot["account"];
}) {
  const t = useTranslations("profile.account");
  const locale = useLocale();
  const format = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
  return (
    <>
      <h3 className="profile-session-title">{t("sessions")}</h3>
      <div className="profile-sessions">
        {account.sessionsStatus === "unavailable" ? (
          <p
            className="profile-session-copy"
            data-testid="profile-sessions-unavailable"
          >
            {t("sessionsUnavailable")}
          </p>
        ) : account.sessions.length === 0 ? (
          <p
            className="profile-session-copy"
            data-testid="profile-sessions-empty"
          >
            {t("sessionsEmpty")}
          </p>
        ) : (
          account.sessions.map((session) => (
            <div
              className="profile-session"
              data-testid="profile-session"
              key={session.id}
            >
              <div className="profile-session-copy">
                <strong>{t("session")}</strong>
                {session.authenticatedAt && (
                  <small>
                    {t("signedIn")}{" "}
                    <time
                      data-testid="profile-session-date"
                      dateTime={session.authenticatedAt}
                    >
                      {format.format(new Date(session.authenticatedAt))} UTC
                    </time>
                  </small>
                )}
                <small>
                  {t("expires")}{" "}
                  <time
                    data-testid="profile-session-date"
                    dateTime={session.expiresAt}
                  >
                    {format.format(new Date(session.expiresAt))} UTC
                  </time>
                </small>
              </div>
              {session.current && <em>{t("current")}</em>}
            </div>
          ))
        )}
      </div>
    </>
  );
}
