"use client";

import { useRef, useState } from "react";
import { revokeSessionAction } from "@/features/profile/actions";
import { useTranslations } from "next-intl";
import type { ProfileSnapshot } from "./profile-data";

/** Metadata comes from Kratos; rows disappear only after confirmed writes. */
export function ProfileSessions({
  account,
}: {
  account: ProfileSnapshot["account"];
}) {
  const t = useTranslations("profile.account");
  const busy = useRef(false);
  const [pending, setPending] = useState<string | null>(null);
  const [ended, setEnded] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<
    "ended" | "endFailed" | "signInAgain" | null
  >(null);
  const sessions = account.sessions.filter(
    (session) => !ended.includes(session.id),
  );
  const canRevoke =
    account.sessionsRevocable && account.sessionsStatus === "available";
  const hasOthers = sessions.some((session) => !session.current);

  async function revoke(id: string | null) {
    if (busy.current) return;
    busy.current = true;
    setPending(id ?? "all");
    setFeedback(null);
    const targets = sessions
      .filter(
        (session) => !session.current && (id === null || session.id === id),
      )
      .map((session) => session.id);
    try {
      const result = await revokeSessionAction(id);
      if (result.ok) {
        setEnded((previous) => [...previous, ...targets]);
        setFeedback("ended");
      } else {
        setFeedback(
          result.code === "UNAUTHENTICATED" ? "signInAgain" : "endFailed",
        );
      }
    } catch {
      setFeedback("endFailed");
    } finally {
      busy.current = false;
      setPending(null);
    }
  }
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
        ) : sessions.length === 0 ? (
          <p
            className="profile-session-copy"
            data-testid="profile-sessions-empty"
          >
            {t("sessionsEmpty")}
          </p>
        ) : (
          sessions.map((session) => (
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
                      {session.authenticatedAtLabel} UTC
                    </time>
                  </small>
                )}
                <small>
                  {t("expires")}{" "}
                  <time
                    data-testid="profile-session-date"
                    dateTime={session.expiresAt}
                  >
                    {session.expiresAtLabel} UTC
                  </time>
                </small>
              </div>
              {session.current ? (
                <em>{t("current")}</em>
              ) : canRevoke ? (
                <button
                  className="profile-ghost-button"
                  data-testid="profile-revoke-session"
                  disabled={pending !== null}
                  type="button"
                  onClick={() => void revoke(session.id)}
                >
                  {t(pending === session.id ? "ending" : "endSession")}
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
      {canRevoke && hasOthers && (
        <button
          className="profile-ghost-button"
          data-testid="profile-revoke-others"
          disabled={pending !== null}
          type="button"
          onClick={() => void revoke(null)}
        >
          {t(pending === "all" ? "ending" : "endOthers")}
        </button>
      )}
      {feedback && (
        <p
          className={
            feedback === "ended"
              ? "profile-session-copy"
              : "profile-field-error"
          }
          data-testid="profile-session-feedback"
          role={feedback === "ended" ? "status" : "alert"}
        >
          {t(feedback)}
        </p>
      )}
    </>
  );
}
