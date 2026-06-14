"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter as useNextRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { signOutAction } from "@/features/auth/actions";
import { saveProfileAction } from "@/features/profile/actions";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ProfileSnapshot } from "./profile-data";

interface ProfileShellProps {
  snapshot: ProfileSnapshot;
}

type IconName =
  | "ban"
  | "bell"
  | "camera"
  | "capsules"
  | "check"
  | "desktop"
  | "grid"
  | "heart"
  | "list"
  | "lock"
  | "logout"
  | "mail"
  | "mobile"
  | "more"
  | "my-items"
  | "outfits"
  | "profile"
  | "settings"
  | "shield"
  | "tag"
  | "tablet"
  | "trash"
  | "wrench";

type ProfileFormValues = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  country: string;
  city: string;
  shoeSize: string;
  topSize: string;
  bottomSize: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  preferredLoginMethod: "email" | "sms";
  googleAuthenticator: boolean;
  pushSecondFactor: boolean;
};

interface ProfileNavItem {
  href: string;
  icon: IconName;
  label: string;
  active?: boolean;
  badge?: number;
}

const MAX_AVATAR_BYTES = 10 * 1024 * 1024;
const SUPPORTED_AVATAR_TYPES = new Set(["image/jpeg", "image/png"]);

export function ProfileShell({ snapshot }: ProfileShellProps) {
  const t = useTranslations("profile");
  const dashboardT = useTranslations("dashboard");
  const locale = useLocale();
  const nextRouter = useNextRouter();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef(new Set<string>());
  const [moreOpen, setMoreOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(snapshot.profile.avatarUrl ?? "");
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [profileHeader, setProfileHeader] = useState({
    displayName: snapshot.profile.displayName,
    initials: snapshot.profile.initials,
    username: snapshot.profile.username,
  });

  const profileSchema = useMemo(
    () =>
      z.object({
        firstName: z.string().trim().min(1, t("validation.firstName")).max(40, t("validation.nameLength")),
        lastName: z.string().trim().min(1, t("validation.lastName")).max(40, t("validation.nameLength")),
        username: z
          .string()
          .trim()
          .toLowerCase()
          .min(3, t("validation.usernameLength"))
          .max(30, t("validation.usernameLength"))
          .regex(/^[a-z0-9_]+$/, t("validation.usernamePattern")),
        email: z.string().trim().email(t("validation.email")).max(120, t("validation.email")),
        phone: z.string().trim().max(40, t("validation.phoneLength")),
        dateOfBirth: z.string().trim().max(20, t("validation.date")),
        country: z.string().trim().max(80),
        city: z.string().trim().max(80, t("validation.cityLength")),
        shoeSize: z.string().trim().max(8),
        topSize: z.string().trim().max(8),
        bottomSize: z.string().trim().max(8),
        emailNotifications: z.boolean(),
        pushNotifications: z.boolean(),
        preferredLoginMethod: z.enum(["email", "sms"]),
        googleAuthenticator: z.boolean(),
        pushSecondFactor: z.boolean(),
      }),
    [t],
  );

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
  } = useForm<ProfileFormValues>({
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
      preferredLoginMethod: snapshot.preferences.preferredLoginMethod,
      googleAuthenticator: snapshot.preferences.googleAuthenticator,
      pushSecondFactor: snapshot.preferences.pushSecondFactor,
    },
  });

  const emailNotifications = useWatch({ control, name: "emailNotifications" }) ?? false;
  const pushNotifications = useWatch({ control, name: "pushNotifications" }) ?? false;
  const preferredLoginMethod = useWatch({ control, name: "preferredLoginMethod" }) ?? "email";
  const googleAuthenticator = useWatch({ control, name: "googleAuthenticator" }) ?? false;
  const pushSecondFactor = useWatch({ control, name: "pushSecondFactor" }) ?? false;
  const phoneValue = useWatch({ control, name: "phone" }) ?? "";
  const emailValue = useWatch({ control, name: "email" }) ?? "";
  const loginWarning = buildLoginWarning({
    email: emailValue,
    method: preferredLoginMethod,
    phone: phoneValue,
    t,
  });

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

  const navGroups: Array<{ label: string; items: ProfileNavItem[] }> = [
    {
      label: dashboardT("nav.overview"),
      items: [
        {
          href: "/dashboard",
          icon: "grid",
          label: dashboardT("nav.dashboard"),
        },
      ],
    },
    {
      label: dashboardT("nav.wardrobe"),
      items: [
        {
          href: "/my-items",
          icon: "my-items",
          label: dashboardT("nav.myItems"),
          badge: snapshot.navigation.myItems,
        },
        {
          href: "/capsule-result?tab=outfits",
          icon: "outfits",
          label: dashboardT("nav.outfits"),
          badge: snapshot.navigation.outfits,
        },
        {
          href: "/capsule-result",
          icon: "capsules",
          label: dashboardT("nav.capsules"),
          badge: snapshot.navigation.capsules,
        },
        {
          href: "/uncapsulated",
          icon: "ban",
          label: dashboardT("nav.uncapsulated"),
          badge: snapshot.navigation.uncapsulated,
        },
      ],
    },
    {
      label: dashboardT("nav.lists"),
      items: [
        {
          href: "/favorites",
          icon: "heart",
          label: dashboardT("nav.favorites"),
          badge: snapshot.navigation.favorites,
        },
        {
          href: "/capsule-result?tab=shopping",
          icon: "list",
          label: dashboardT("nav.shoppingList"),
          badge: snapshot.navigation.shoppingList,
        },
        {
          href: "/for-sale",
          icon: "tag",
          label: dashboardT("nav.forSale"),
          badge: snapshot.navigation.forSale,
        },
        {
          href: "/for-repair",
          icon: "wrench",
          label: dashboardT("nav.forRepair"),
          badge: snapshot.navigation.forRepair,
        },
      ],
    },
  ];
  const moreItems: ProfileNavItem[] = [
    {
      href: "/capsule-result?tab=outfits",
      icon: "outfits",
      label: dashboardT("nav.outfits"),
      badge: snapshot.navigation.outfits,
    },
    {
      href: "/uncapsulated",
      icon: "ban",
      label: dashboardT("nav.uncapsulated"),
      badge: snapshot.navigation.uncapsulated,
    },
    {
      href: "/capsule-result?tab=shopping",
      icon: "list",
      label: dashboardT("nav.shoppingList"),
      badge: snapshot.navigation.shoppingList,
    },
    {
      href: "/for-sale",
      icon: "tag",
      label: dashboardT("nav.forSale"),
      badge: snapshot.navigation.forSale,
    },
    {
      href: "/for-repair",
      icon: "wrench",
      label: dashboardT("nav.forRepair"),
      badge: snapshot.navigation.forRepair,
    },
    {
      href: "/profile",
      icon: "profile",
      label: dashboardT("nav.profile"),
      active: true,
    },
    {
      href: "/profile",
      icon: "settings",
      label: dashboardT("nav.settings"),
      active: true,
    },
  ];

  const signOut = async () => {
    await signOutAction();
    nextRouter.push(`/${locale}`);
    nextRouter.refresh();
  };

  const toggleBoolean = (field: keyof Pick<
    ProfileFormValues,
    "emailNotifications" | "googleAuthenticator" | "pushNotifications" | "pushSecondFactor"
  >) => {
    const currentValues = {
      emailNotifications,
      googleAuthenticator,
      pushNotifications,
      pushSecondFactor,
    };

    setValue(field, !currentValues[field], { shouldDirty: true, shouldValidate: true });
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

  const submitProfile = async (values: ProfileFormValues) => {
    if (values.preferredLoginMethod === "sms" && !values.phone.trim()) {
      setNotice(t("login.warningPhone"));
      return;
    }

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
    <div className="cz-page dashboard-page profile-page">
      <div className="wallpaper-bg" />
      <div className="wallpaper-overlay" />

      <div className="dashboard-app">
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar-head">
            <Link className="dashboard-logo" href="/">
              Capsule Zero
            </Link>
            <div className="dashboard-user-row">
              <Link aria-label={dashboardT("nav.profile")} className="dashboard-avatar-link" href="/profile">
                <span className="dashboard-avatar">{profileHeader.initials}</span>
              </Link>
              <div className="dashboard-user-meta">
                <p className="dashboard-user-name">{profileHeader.displayName}</p>
                <p className="dashboard-user-email">{formatUsername(profileHeader.username)}</p>
              </div>
            </div>
          </div>

          <nav className="dashboard-nav" aria-label={dashboardT("nav.main")}>
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="dashboard-nav-section">{group.label}</p>
                {group.items.map((item) => (
                  <Link className="dashboard-nav-item" href={item.href} key={`${group.label}-${item.label}`}>
                    <span className="dashboard-nav-icon">
                      <ProfileIcon name={item.icon} />
                    </span>
                    <span className="dashboard-nav-label">{item.label}</span>
                    {typeof item.badge === "number" ? (
                      <span className="dashboard-nav-badge">{item.badge}</span>
                    ) : null}
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          <div className="dashboard-sidebar-foot">
            <Link className="dashboard-nav-item dashboard-nav-item-active" href="/profile">
              <span className="dashboard-nav-icon">
                <ProfileIcon name="settings" />
              </span>
              <span className="dashboard-nav-label">{dashboardT("nav.settings")}</span>
            </Link>
            <button className="dashboard-nav-item dashboard-nav-button" onClick={signOut} type="button">
              <span className="dashboard-nav-icon">
                <ProfileIcon name="logout" />
              </span>
              <span className="dashboard-nav-label">{dashboardT("logout")}</span>
            </button>
          </div>
        </aside>

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

          <form className="profile-content" onSubmit={handleSubmit(submitProfile)}>
            <section className="dashboard-glass profile-card profile-header-card" aria-label={t("headerLabel")}>
              <div className="profile-avatar-wrap">
                <button
                  aria-label={t("avatar.change")}
                  className="profile-avatar-button"
                  onClick={() => avatarInputRef.current?.click()}
                  type="button"
                >
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" src={avatarPreview} />
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
                  <button className="profile-ghost-button" disabled={!avatarPreview} onClick={removeAvatar} type="button">
                    {t("avatar.remove")}
                  </button>
                </div>
                {avatarError ? <p className="profile-field-error">{avatarError}</p> : null}
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
                        {country.value ? t(`countries.${country.value}`) : t("countries.none")}
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
                <button className="profile-save-button" disabled={saving} type="submit">
                  {saving ? t("buttons.saving") : t("buttons.save")}
                </button>
              </div>
            </section>

            <section className="dashboard-glass profile-card">
              <h2 className="profile-section-title">{t("sections.notifications")}</h2>
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
                <h3>{t("login.title")}</h3>
                <div className="profile-radio-group" role="radiogroup" aria-label={t("login.title")}>
                  <RadioRow
                    checked={preferredLoginMethod === "email"}
                    description={t("login.emailDesc")}
                    label={t("login.email")}
                    onSelect={() => setValue("preferredLoginMethod", "email", { shouldDirty: true, shouldValidate: true })}
                  />
                  <RadioRow
                    checked={preferredLoginMethod === "sms"}
                    description={t("login.smsDesc")}
                    label={t("login.sms")}
                    onSelect={() => setValue("preferredLoginMethod", "sms", { shouldDirty: true, shouldValidate: true })}
                  />
                </div>
                {loginWarning ? (
                  <div className="profile-warning" role="status">
                    <ProfileIcon name="shield" />
                    <span>{loginWarning}</span>
                  </div>
                ) : null}
              </div>

              <div className="profile-divider" />

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
                <button
                  className="profile-ghost-button"
                  onClick={() => setNotice(t("notice.passwordMock"))}
                  type="button"
                >
                  {t("buttons.changePassword")}
                </button>
              </div>
            </section>

            <section className="dashboard-glass profile-card">
              <h2 className="profile-section-title">{t("sections.account")}</h2>

              <div className="profile-account-head">
                <div className="profile-account-id">
                  <span>{t("account.userId")}</span>
                  <strong>{snapshot.account.userIdLabel}</strong>
                </div>
                <button className="profile-warning-button profile-logout-inline" onClick={signOut} type="button">
                  <ProfileIcon name="logout" />
                  <span>{dashboardT("logout")}</span>
                </button>
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
                        {session.location} · {t(`sessions.${session.id}.lastSeen`)}
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
              className={cn("profile-delete-button", deleteArmed && "profile-delete-button-armed")}
              onClick={() => {
                setDeleteArmed(true);
                setNotice(t("notice.deleteMock"));
              }}
              type="button"
            >
              <ProfileIcon name="trash" />
              <span>{deleteArmed ? t("buttons.deleteUnavailable") : t("buttons.deleteAccount")}</span>
            </button>
          </div>
        </main>
      </div>

      <nav className={cn("dashboard-bottom-nav", moreOpen && "dashboard-bottom-nav-menu-open")} aria-label={dashboardT("nav.mobile")}>
        <BottomNavLink href="/dashboard" icon="grid" label={dashboardT("nav.dashboard")} />
        <BottomNavLink href="/my-items" icon="my-items" label={dashboardT("nav.myItems")} />
        <BottomNavLink href="/capsule-result" icon="capsules" label={dashboardT("nav.capsules")} />
        <BottomNavLink href="/favorites" icon="heart" label={dashboardT("nav.favorites")} />
        <button
          aria-expanded={moreOpen}
          aria-label={dashboardT("nav.more")}
          className="dashboard-bottom-item dashboard-bottom-button dashboard-bottom-item-active"
          onClick={() => setMoreOpen((value) => !value)}
          type="button"
        >
          <span className="dashboard-bottom-icon">
            <ProfileIcon name="more" />
          </span>
          <span className="dashboard-bottom-label">{dashboardT("nav.more")}</span>
        </button>
      </nav>

      <button
        aria-label={dashboardT("closeMore")}
        className={cn("dashboard-more-overlay", moreOpen && "dashboard-more-overlay-open")}
        onClick={() => setMoreOpen(false)}
        type="button"
      />
      <div className={cn("dashboard-more-sheet", moreOpen && "dashboard-more-sheet-open")}>
        <div className="dashboard-more-handle" />
        <div className="dashboard-more-grid">
          {moreItems.map((item) => (
            <Link
              className={cn("dashboard-more-item", item.active && "dashboard-more-item-active")}
              href={item.href}
              key={`${item.href}-${item.label}`}
              onClick={() => setMoreOpen(false)}
            >
              <span className="dashboard-more-icon">
                <ProfileIcon name={item.icon} />
              </span>
              <span className="dashboard-more-label">{item.label}</span>
              {typeof item.badge === "number" ? (
                <span className="dashboard-more-badge">{item.badge}</span>
              ) : null}
            </Link>
          ))}
        </div>
      </div>

      {notice ? (
        <div className="my-items-toast profile-toast" role="status" aria-live="polite">
          {notice}
        </div>
      ) : null}
    </div>
  );
}

function ProfileTextField({
  error,
  label,
  placeholder,
  registration,
  type = "text",
}: {
  error?: string;
  label: string;
  placeholder?: string;
  registration: UseFormRegisterReturn;
  type?: string;
}) {
  return (
    <label className="profile-field">
      <span>{label}</span>
      <input
        aria-invalid={Boolean(error)}
        className={cn("profile-input", error && "profile-input-error")}
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

function RadioRow({
  checked,
  description,
  label,
  onSelect,
}: {
  checked: boolean;
  description: string;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      aria-checked={checked}
      className={cn("profile-radio-row", checked && "profile-radio-row-selected")}
      onClick={onSelect}
      role="radio"
      type="button"
    >
      <span className="profile-radio-circle">
        <span />
      </span>
      <span className="profile-radio-copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
    </button>
  );
}

function BottomNavLink({
  active,
  href,
  icon,
  label,
}: {
  active?: boolean;
  href: string;
  icon: IconName;
  label: string;
}) {
  return (
    <Link className={cn("dashboard-bottom-item", active && "dashboard-bottom-item-active")} href={href}>
      <span className="dashboard-bottom-icon">
        <ProfileIcon name={icon} />
      </span>
      <span className="dashboard-bottom-label">{label}</span>
    </Link>
  );
}

function buildLoginWarning({
  email,
  method,
  phone,
  t,
}: {
  email: string;
  method: ProfileFormValues["preferredLoginMethod"];
  phone: string;
  t: ReturnType<typeof useTranslations<"profile">>;
}) {
  if (method === "sms" && !phone.trim()) {
    return t("login.warningPhone");
  }

  if (method === "email" && !email.trim()) {
    return t("login.warningEmail");
  }

  return "";
}

function formatUsername(username: string) {
  return username.startsWith("@") ? username : `@${username}`;
}

function sessionIcon(type: ProfileSnapshot["account"]["sessions"][number]["type"]): IconName {
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
    case "ban":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
          <path d="m6.4 6.4 11.2 11.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
          <path d="M10 21h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </svg>
      );
    case "camera":
      return (
        <svg {...common}>
          <path d="M4 8h3l1.5-2h7L17 8h3v10H4V8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
          <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "capsules":
      return (
        <svg aria-hidden fill="none" height="18" viewBox="0 0 17 17" width="18">
          <path
            d="M2.5 3.5H7C7 2 6 .5 8 .5s1 1.5 1 3h4v3.5c1.5 0 3-1 3 1s-1.5 1-3 1V14H9c0-1.5 1-3-1-3s-1 1.5-1 3H2.5V9C4 9 5 10 5 8s-1-1-2.5-1V3.5Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.3"
          />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      );
    case "desktop":
      return (
        <svg {...common}>
          <rect height="12" rx="2" stroke="currentColor" strokeWidth="1.7" width="18" x="3" y="4" />
          <path d="M8 20h8M12 16v4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </svg>
      );
    case "grid":
      return (
        <svg {...common}>
          <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" width="7" x="3" y="3" />
          <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" width="7" x="14" y="3" />
          <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" width="7" x="3" y="14" />
          <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" width="7" x="14" y="14" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="m12 20-7-7a4.2 4.2 0 0 1 6-6l1 1 1-1a4.2 4.2 0 0 1 6 6l-7 7Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
      );
    case "list":
      return (
        <svg {...common}>
          <path d="M5 7h14M5 12h11M5 17h8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect height="10" rx="2" stroke="currentColor" strokeWidth="1.7" width="14" x="5" y="10" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M10 5V4a2 2 0 0 1 2-2h7v20h-7a2 2 0 0 1-2-2v-1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M3 12h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="m10 8 4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect height="14" rx="2" stroke="currentColor" strokeWidth="1.7" width="18" x="3" y="5" />
          <path d="m4 7 8 6 8-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
      );
    case "mobile":
      return (
        <svg {...common}>
          <rect height="18" rx="2" stroke="currentColor" strokeWidth="1.7" width="11" x="6.5" y="3" />
          <path d="M12 17.5h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
        </svg>
      );
    case "more":
      return (
        <svg {...common} fill="currentColor">
          <circle cx="6" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="18" cy="12" r="1.8" />
        </svg>
      );
    case "my-items":
      return (
        <svg aria-hidden fill="none" height="18" viewBox="0 0 17 17" width="18">
          <rect height="9" rx="1" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" width="12" x="2.5" y="6" />
          <path d="m2.5 6 2.5-3.5h7L14.5 6" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" />
          <path d="M8.5 2.5V6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        </svg>
      );
    case "outfits":
      return (
        <svg {...common}>
          <path
            d="M6.5 3.5h3C9.5 4.9 10.6 6 12 6s2.5-1.1 2.5-2.5h3L22 8l-3 3-2-2v12H7V9l-2 2-3-3 4.5-4.5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
          <path d="M4.5 21a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M19 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.5-2.4 1a7.5 7.5 0 0 0-1.9-1.1L14.3 3h-4.6l-.3 2.8a7.5 7.5 0 0 0-1.9 1.1l-2.4-1-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.1l-2 1.5 2 3.5 2.4-1c.6.5 1.2.9 1.9 1.1l.3 2.8h4.6l.3-2.8c.7-.3 1.3-.6 1.9-1.1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1.1Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.4"
          />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 20 6v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
          <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="M4 5v6.2L12.8 20 20 12.8 11.2 4H5a1 1 0 0 0-1 1Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
          <circle cx="8" cy="8" r="1.2" fill="currentColor" />
        </svg>
      );
    case "tablet":
      return (
        <svg {...common}>
          <rect height="18" rx="2" stroke="currentColor" strokeWidth="1.7" width="14" x="5" y="3" />
          <path d="M12 17.5h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M4 7h16M9 7V4h6v3M8 10v8M12 10v8M16 10v8M6 7l1 14h10l1-14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
      );
    case "wrench":
      return (
        <svg {...common}>
          <path
            d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
  }
}
