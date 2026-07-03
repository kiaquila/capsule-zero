"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter as useNextRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { DashboardNavigationFrame } from "@/components/dashboard/DashboardNavigation";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { signOutAction } from "@/features/auth/actions";
import { saveProfileAction } from "@/features/profile/actions";
import { ProfilePasswordForm } from "./ProfilePasswordForm";
import {
  createProfileFormSchema,
  type ProfileFormInput,
  type ProfileValidationMessages,
} from "@/features/profile/schemas";
import { cn } from "@/lib/utils";
import type { ProfileSnapshot } from "./profile-data";

interface ProfileShellProps {
  snapshot: ProfileSnapshot;
}

type IconName = "camera" | "desktop" | "mobile" | "tablet" | "trash";

const MAX_AVATAR_BYTES = 10 * 1024 * 1024;
const SUPPORTED_AVATAR_TYPES = new Set(["image/jpeg", "image/png"]);

export function ProfileShell({ snapshot }: ProfileShellProps) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const nextRouter = useNextRouter();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef(new Set<string>());
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(
    snapshot.profile.avatarUrl ?? "",
  );
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [profileHeader, setProfileHeader] = useState({
    displayName: snapshot.profile.displayName,
    initials: snapshot.profile.initials,
    username: snapshot.profile.username,
  });

  const validationMessages = useMemo<ProfileValidationMessages>(
    () => ({
      firstName: t("validation.firstName"),
      lastName: t("validation.lastName"),
      nameLength: t("validation.nameLength"),
      displayNameLength: t("validation.displayNameLength"),
      usernameLength: t("validation.usernameLength"),
      usernamePattern: t("validation.usernamePattern"),
      email: t("validation.email"),
      phoneLength: t("validation.phoneLength"),
      date: t("validation.date"),
      cityLength: t("validation.cityLength"),
    }),
    [t],
  );
  const profileSchema = useMemo(
    () => createProfileFormSchema(validationMessages),
    [validationMessages],
  );

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      firstName: snapshot.profile.firstName,
      lastName: snapshot.profile.lastName,
      username: snapshot.profile.username,
      email: snapshot.profile.email,
      phone: snapshot.profile.phone,
      dateOfBirth: snapshot.profile.dateOfBirth,
      country: snapshot.profile.country,
      city: snapshot.profile.city,
      shoeSize: snapshot.profile.shoeSize,
      topSize: snapshot.profile.topSize,
      bottomSize: snapshot.profile.bottomSize,
      emailNotifications: snapshot.preferences.emailNotifications,
      pushNotifications: snapshot.preferences.pushNotifications,
      googleAuthenticator: snapshot.preferences.googleAuthenticator,
      pushSecondFactor: snapshot.preferences.pushSecondFactor,
    },
  });

  const emailNotifications =
    useWatch({ control, name: "emailNotifications" }) ?? false;
  const pushNotifications =
    useWatch({ control, name: "pushNotifications" }) ?? false;
  const googleAuthenticator =
    useWatch({ control, name: "googleAuthenticator" }) ?? false;
  const pushSecondFactor =
    useWatch({ control, name: "pushSecondFactor" }) ?? false;

  useEffect(() => {
    const objectUrls = objectUrlsRef.current;

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.clear();
    };
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => setNotice(null), 3600);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  const signOut = async () => {
    await signOutAction();
    nextRouter.push(`/${locale}`);
    nextRouter.refresh();
  };

  const toggleBoolean = (
    field: keyof Pick<
      ProfileFormInput,
      | "emailNotifications"
      | "googleAuthenticator"
      | "pushNotifications"
      | "pushSecondFactor"
    >,
  ) => {
    const currentValues = {
      emailNotifications,
      googleAuthenticator,
      pushNotifications,
      pushSecondFactor,
    };

    setValue(field, !currentValues[field], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const chooseAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    if (!SUPPORTED_AVATAR_TYPES.has(file.type)) {
      setAvatarError(t("avatar.validation.type"));
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError(t("avatar.validation.size"));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    objectUrlsRef.current.add(previewUrl);
    setAvatarPreview(previewUrl);
    setAvatarError(null);
    setNotice(t("notice.avatarReady"));
  };

  const removeAvatar = () => {
    setAvatarPreview("");
    setAvatarError(null);
    setNotice(t("notice.avatarRemoved"));
  };

  const submitProfile = async (values: ProfileFormInput) => {
    setSaving(true);
    const result = await saveProfileAction(values);
    setSaving(false);

    if (!result.ok || !result.profile) {
      if (result.message === "USERNAME_TAKEN") {
        setError("username", { message: t("validation.usernameTaken") });
      }
      setNotice(t("notice.saveError"));
      return;
    }

    setProfileHeader({
      displayName: result.profile.displayName,
      initials: result.profile.initials,
      username: result.profile.username,
    });
    reset(values);
    setNotice(t("notice.saved"));
  };

  return (
    <DashboardNavigationFrame
      activeKey="settings"
      mobileActiveKey="more"
      navigation={snapshot.navigation}
      onSignOut={signOut}
      pageClassName="profile-page"
      profile={{
        avatarSrc: avatarPreview,
        displayName: profileHeader.displayName,
        initials: profileHeader.initials,
        meta: formatUsername(profileHeader.username),
      }}
    >
      <main className="dashboard-main profile-main">
        <header className="dashboard-topbar profile-topbar">
          <div>
            <h1 className="profile-title">
              {t.rich("title", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </h1>
            <p className="profile-subtitle">{t("subtitle")}</p>
          </div>
          <div className="dashboard-topbar-actions">
            <LanguageSwitcher />
          </div>
        </header>

        <form
          className="profile-content"
          noValidate
          onSubmit={handleSubmit(submitProfile)}
        >
          <section
            className="dashboard-glass profile-card profile-header-card"
            aria-label={t("headerLabel")}
          >
            <div className="profile-avatar-wrap">
              <button
                aria-label={t("avatar.change")}
                className="profile-avatar-button"
                onClick={() => avatarInputRef.current?.click()}
                type="button"
              >
                {avatarPreview ? (
                  <Image
                    alt=""
                    height={72}
                    src={avatarPreview}
                    unoptimized
                    width={72}
                  />
                ) : (
                  <span>{profileHeader.initials}</span>
                )}
              </button>
              <button
                aria-label={t("avatar.change")}
                className="profile-avatar-edit"
                onClick={() => avatarInputRef.current?.click()}
                type="button"
              >
                <ProfileIcon name="camera" />
              </button>
              <input
                accept="image/jpeg,image/png"
                className="profile-file-input"
                onChange={chooseAvatar}
                ref={avatarInputRef}
                type="file"
              />
            </div>
            <div className="profile-header-info">
              <h2>{profileHeader.displayName}</h2>
              <p>{formatUsername(profileHeader.username)}</p>
              <div className="profile-avatar-actions">
                <button
                  className="profile-ghost-button profile-remove-photo-button"
                  disabled={!avatarPreview}
                  onClick={removeAvatar}
                  type="button"
                >
                  {t("avatar.remove")}
                </button>
              </div>
              {avatarError ? (
                <p className="profile-field-error">{avatarError}</p>
              ) : null}
            </div>
          </section>

          <section className="dashboard-glass profile-card">
            <h2 className="profile-section-title">{t("sections.personal")}</h2>

            <div className="profile-field-grid">
              <ProfileTextField
                error={errors.firstName?.message}
                label={t("fields.firstName")}
                registration={register("firstName")}
              />
              <ProfileTextField
                error={errors.lastName?.message}
                label={t("fields.lastName")}
                registration={register("lastName")}
              />
            </div>

            <div className="profile-field-grid">
              <ProfileTextField
                error={errors.username?.message}
                label={t("fields.username")}
                registration={register("username")}
              />
              <ProfileTextField
                error={errors.email?.message}
                label={t("fields.email")}
                registration={register("email")}
                type="email"
              />
            </div>

            <div className="profile-field-grid">
              <ProfileTextField
                error={errors.phone?.message}
                label={t("fields.phone")}
                placeholder={t("fields.phonePlaceholder")}
                registration={register("phone")}
                type="tel"
              />
              <ProfileTextField
                error={errors.dateOfBirth?.message}
                label={t("fields.birthday")}
                registration={register("dateOfBirth")}
                type="date"
              />
            </div>

            <div className="profile-field-grid">
              <label className="profile-field">
                <span>{t("fields.country")}</span>
                <select className="profile-select" {...register("country")}>
                  {snapshot.options.countries.map((country) => (
                    <option key={country.value || "none"} value={country.value}>
                      {country.value
                        ? t(`countries.${country.value}`)
                        : t("countries.none")}
                    </option>
                  ))}
                </select>
              </label>
              <ProfileTextField
                error={errors.city?.message}
                label={t("fields.city")}
                registration={register("city")}
              />
            </div>

            <div className="profile-field-grid profile-field-grid-3">
              <label className="profile-field">
                <span>{t("fields.shoeSize")}</span>
                <select className="profile-select" {...register("shoeSize")}>
                  {snapshot.options.shoeSizes.map((size) => (
                    <option key={size || "empty"} value={size}>
                      {size || "-"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="profile-field">
                <span>{t("fields.topSize")}</span>
                <select className="profile-select" {...register("topSize")}>
                  {snapshot.options.clothingSizes.map((size) => (
                    <option key={size || "empty"} value={size}>
                      {size || "-"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="profile-field">
                <span>{t("fields.bottomSize")}</span>
                <select className="profile-select" {...register("bottomSize")}>
                  {snapshot.options.clothingSizes.map((size) => (
                    <option key={size || "empty"} value={size}>
                      {size || "-"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="profile-actions-row">
              <button
                className="profile-save-button"
                disabled={saving}
                type="submit"
              >
                {saving ? t("buttons.saving") : t("buttons.save")}
              </button>
            </div>
          </section>

          <section className="dashboard-glass profile-card">
            <h2 className="profile-section-title">
              {t("sections.notifications")}
            </h2>
            <ToggleRow
              checked={emailNotifications}
              label={t("notifications.email")}
              onToggle={() => toggleBoolean("emailNotifications")}
            />
            <ToggleRow
              checked={pushNotifications}
              label={t("notifications.push")}
              onToggle={() => toggleBoolean("pushNotifications")}
            />
          </section>

          <section className="dashboard-glass profile-card">
            <h2 className="profile-section-title">{t("sections.security")}</h2>

            <div className="profile-security-block">
              <h3>{t("twoFactor.title")}</h3>
              <ToggleRow
                checked={googleAuthenticator}
                description={t("twoFactor.googleDesc")}
                label={t("twoFactor.google")}
                onToggle={() => toggleBoolean("googleAuthenticator")}
              />
              <ToggleRow
                checked={pushSecondFactor}
                description={t("twoFactor.pushDesc")}
                label={t("twoFactor.push")}
                onToggle={() => toggleBoolean("pushSecondFactor")}
              />
            </div>

            <div className="profile-divider" />

            <div className="profile-security-block">
              <h3>{t("password.title")}</h3>
              <ProfilePasswordForm onSuccess={setNotice} />
            </div>
          </section>

          <section className="dashboard-glass profile-card">
            <h2 className="profile-section-title">{t("sections.account")}</h2>

            <div className="profile-account-head">
              <div className="profile-account-id">
                <span>{t("account.userId")}</span>
                <strong>{snapshot.account.userIdLabel}</strong>
              </div>
            </div>

            <div className="profile-divider" />

            <h3 className="profile-session-title">{t("account.sessions")}</h3>
            <div className="profile-sessions">
              {snapshot.account.sessions.map((session) => (
                <div className="profile-session" key={session.id}>
                  <span className="profile-session-icon">
                    <ProfileIcon name={sessionIcon(session.type)} />
                  </span>
                  <span className="profile-session-copy">
                    <strong>{t(`sessions.${session.id}.device`)}</strong>
                    <small>
                      {session.location} ·{" "}
                      {t(`sessions.${session.id}.lastSeen`)}
                    </small>
                  </span>
                  {session.current ? <em>{t("account.current")}</em> : null}
                </div>
              ))}
            </div>
          </section>
        </form>
        <div className="profile-delete-zone">
          <button
            className={cn(
              "profile-delete-button",
              deleteArmed && "profile-delete-button-armed",
            )}
            onClick={() => {
              setDeleteArmed(true);
              setNotice(t("notice.deleteMock"));
            }}
            type="button"
          >
            <ProfileIcon name="trash" />
            <span>
              {deleteArmed
                ? t("buttons.deleteUnavailable")
                : t("buttons.deleteAccount")}
            </span>
          </button>
        </div>

        {notice ? (
          <div
            className="my-items-toast profile-toast"
            role="status"
            aria-live="polite"
          >
            {notice}
          </div>
        ) : null}
      </main>
    </DashboardNavigationFrame>
  );
}

export function ProfileTextField({
  error,
  label,
  placeholder,
  registration,
  testId,
  type = "text",
}: {
  error?: string;
  label: string;
  placeholder?: string;
  registration: UseFormRegisterReturn;
  testId?: string;
  type?: string;
}) {
  return (
    <label className="profile-field">
      <span>{label}</span>
      <input
        aria-invalid={Boolean(error)}
        className={cn("profile-input", error && "profile-input-error")}
        data-testid={testId}
        placeholder={placeholder}
        type={type}
        {...registration}
      />
      {error ? <small className="profile-field-error">{error}</small> : null}
    </label>
  );
}

function ToggleRow({
  checked,
  description,
  label,
  onToggle,
}: {
  checked: boolean;
  description?: string;
  label: string;
  onToggle: () => void;
}) {
  return (
    <div className="profile-toggle-row">
      <span className="profile-toggle-copy">
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <button
        aria-checked={checked}
        aria-label={label}
        className={cn("profile-toggle", checked && "profile-toggle-on")}
        onClick={onToggle}
        role="switch"
        type="button"
      >
        <span />
      </button>
    </div>
  );
}

function formatUsername(username: string) {
  return username.startsWith("@") ? username : `@${username}`;
}

function sessionIcon(
  type: ProfileSnapshot["account"]["sessions"][number]["type"],
): IconName {
  if (type === "mobile") {
    return "mobile";
  }

  if (type === "tablet") {
    return "tablet";
  }

  return "desktop";
}

function ProfileIcon({ name }: { name: IconName }) {
  const common = {
    "aria-hidden": true,
    fill: "none",
    height: 18,
    viewBox: "0 0 24 24",
    width: 18,
  };

  switch (name) {
    case "camera":
      return (
        <svg {...common}>
          <path
            d="M4 8h3l1.5-2h7L17 8h3v10H4V8Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
          <circle
            cx="12"
            cy="13"
            r="3"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "desktop":
      return (
        <svg {...common}>
          <rect
            height="12"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.7"
            width="18"
            x="3"
            y="4"
          />
          <path
            d="M8 20h8M12 16v4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "mobile":
      return (
        <svg {...common}>
          <rect
            height="18"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.7"
            width="11"
            x="6.5"
            y="3"
          />
          <path
            d="M12 17.5h.01"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2.4"
          />
        </svg>
      );
    case "tablet":
      return (
        <svg {...common}>
          <rect
            height="18"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.7"
            width="14"
            x="5"
            y="3"
          />
          <path
            d="M12 17.5h.01"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2.4"
          />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path
            d="M4 7h16M9 7V4h6v3M8 10v8M12 10v8M16 10v8M6 7l1 14h10l1-14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      );
  }
}
