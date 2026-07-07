// Package auth wires Kratos identity flows and the profile repository into the
// HTTP surface the web `api` provider consumes (AuthPort + ProfileRepository).
package auth

import (
	"context"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/kiaquila/capsule-zero/api/internal/httpx"
	"github.com/kiaquila/capsule-zero/api/internal/kratos"
	"github.com/kiaquila/capsule-zero/api/internal/profiles"
)

// maxProfileFieldRunes mirrors the ProfileUpdateRequest maxLength (see
// docs_capsule_zero/adr/openapi.yaml) for the free-text profile fields.
const maxProfileFieldRunes = 80

// maxAvatarURLRunes mirrors the ProfileUpdateRequest avatarUrl maxLength.
const maxAvatarURLRunes = 2048

// minPasswordRunes mirrors the web Zod schema and kratos.yml
// min_password_length so a policy rejection is caught before the Kratos
// round-trip.
const minPasswordRunes = 8

type ctxKey int

const sessionTokenKey ctxKey = iota

type identityClient interface {
	Register(context.Context, string, string, string, string) (*kratos.Session, error)
	Login(context.Context, string, string) (*kratos.Session, error)
	WhoAmI(context.Context, string) (*kratos.Session, error)
	RecoveryStart(context.Context, string) (string, error)
	RecoveryComplete(ctx context.Context, flowID, code, newPassword string) (*kratos.Session, error)
	VerificationStart(context.Context, string) (string, error)
	VerificationComplete(ctx context.Context, flowID, code string) error
	SettingsPassword(ctx context.Context, token, newPassword string) error
	Logout(context.Context, string) error
	OIDCStart(ctx context.Context, provider, returnTo string) (string, string, error)
	OIDCExchange(ctx context.Context, initCode, returnToCode string) (*kratos.Session, error)
}

// Handler holds the dependencies for the auth/profile endpoints.
type Handler struct {
	Kratos   identityClient
	Profiles *profiles.Repo
	// GoogleSignInEnabled gates the /api/auth/google/* endpoints and the
	// provider-availability probe (spec 037, AUTH_GOOGLE_ENABLED).
	GoogleSignInEnabled bool
}

// --- DTOs (match the web contract in app/src/lib/providers/contracts.ts) ---

type locationDTO struct {
	Country string `json:"country,omitempty"`
	City    string `json:"city,omitempty"`
}

type userDTO struct {
	ID            string       `json:"id"`
	Email         string       `json:"email"`
	Name          string       `json:"name,omitempty"`
	AvatarURL     string       `json:"avatarUrl,omitempty"`
	Location      *locationDTO `json:"location,omitempty"`
	EmailVerified bool         `json:"emailVerified"`
	CreatedAt     time.Time    `json:"createdAt"`
}

type sessionDTO struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expiresAt"`
}

type authResponse struct {
	Session                   *sessionDTO       `json:"session,omitempty"`
	User                      *userDTO          `json:"user,omitempty"`
	Profile                   *profiles.Profile `json:"profile,omitempty"`
	RequiresEmailConfirmation bool              `json:"requiresEmailConfirmation"`
	// VerificationFlowID carries the after-sign-up email verification flow so
	// the web banner can submit the emailed code against the right flow.
	VerificationFlowID string `json:"verificationFlowId,omitempty"`
}

// --- Handlers ---

// Registration: POST /api/auth/registration
func (h *Handler) Registration(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Name     string `json:"name"`
		Locale   string `json:"locale"`
	}
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Malformed request body.")
		return
	}
	locale, err := profiles.NormalizeLocale(in.Locale)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Unsupported locale.")
		return
	}
	// Name is optional (AuthRegistrationRequest), but when provided it is trimmed
	// and must be a non-blank string of at most 80 runes — matching the profile
	// display-name rules. The Kratos identity schema permits up to 256 and
	// EnsureForIdentity persists the trait as display_name, so an unbounded or
	// whitespace-only name would otherwise back-door an invalid profile field.
	name := strings.TrimSpace(in.Name)
	if in.Name != "" && name == "" {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Name cannot be only whitespace.")
		return
	}
	if utf8.RuneCountInString(name) > maxProfileFieldRunes {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Name must be 80 characters or fewer.")
		return
	}

	session, err := h.Kratos.Register(r.Context(), in.Email, in.Password, name, locale)
	if err != nil {
		if errors.Is(err, kratos.ErrIdentifierExists) {
			// Do not echo Kratos's "an account already exists" text: that would
			// give unauthenticated callers an account-enumeration oracle (A07).
			// Return the same generic validation shape as any other rejected
			// field so an existing address is indistinguishable from a typo.
			httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR",
				"We couldn't complete your registration. Please check your details and try again.")
			return
		}
		if errors.Is(err, kratos.ErrFlowRejected) {
			httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", kratosMessage(err))
			return
		}
		httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Registration is temporarily unavailable.")
		return
	}
	if session == nil {
		// Verification required before a session is issued.
		httpx.WriteJSON(w, http.StatusOK, authResponse{RequiresEmailConfirmation: true})
		return
	}

	h.respondWithSession(w, r.Context(), session)
}

// Login: POST /api/auth/login
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Malformed request body.")
		return
	}

	session, err := h.Kratos.Login(r.Context(), in.Email, in.Password)
	if err != nil {
		if errors.Is(err, kratos.ErrInvalidCredentials) {
			httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Invalid email or password")
			return
		}
		httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Authentication is temporarily unavailable.")
		return
	}

	h.respondWithSession(w, r.Context(), session)
}

// WhoAmI: GET /api/auth/whoami — resolves the current session (getCurrentSession).
func (h *Handler) WhoAmI(w http.ResponseWriter, r *http.Request) {
	token := bearerToken(r)
	if token == "" {
		httpx.WriteJSON(w, http.StatusOK, authResponse{})
		return
	}

	session, err := h.Kratos.WhoAmI(r.Context(), token)
	if err != nil {
		if errors.Is(err, kratos.ErrInvalidCredentials) {
			// Expired / invalid token resolves to "no session", not an error.
			httpx.WriteJSON(w, http.StatusOK, authResponse{})
			return
		}
		httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Session check is temporarily unavailable.")
		return
	}

	h.respondWithSession(w, r.Context(), session)
}

// Recovery: POST /api/auth/recovery — starts a code-method recovery flow and
// returns the flow id the completion call must reference.
func (h *Handler) Recovery(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email string `json:"email"`
	}
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Malformed request body.")
		return
	}
	// Never reveal whether the address exists.
	flowID, err := h.Kratos.RecoveryStart(r.Context(), in.Email)
	if err != nil {
		httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Password recovery is temporarily unavailable.")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{
		"delivery": "email",
		"email":    in.Email,
		"flowId":   flowID,
	})
}

// RecoveryComplete: POST /api/auth/recovery/complete — exchanges the emailed
// code for a session, sets the new password, and signs the user in.
func (h *Handler) RecoveryComplete(w http.ResponseWriter, r *http.Request) {
	var in struct {
		FlowID                 string `json:"flowId"`
		Code                   string `json:"code"`
		NewPassword            string `json:"newPassword"`
		RecoveryContinuationID string `json:"recoveryContinuationId"`
	}
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Malformed request body.")
		return
	}
	if utf8.RuneCountInString(in.NewPassword) < minPasswordRunes {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Password must be at least 8 characters.")
		return
	}
	if in.RecoveryContinuationID != "" {
		h.completeRecoveryContinuation(w, r, in.RecoveryContinuationID, in.NewPassword)
		return
	}
	if in.FlowID == "" || in.Code == "" {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Recovery code and flow are required.")
		return
	}

	session, err := h.Kratos.RecoveryComplete(r.Context(), in.FlowID, in.Code, in.NewPassword)
	if err != nil {
		if errors.Is(err, kratos.ErrPasswordRejected) {
			h.writeRecoveryPasswordRejected(w, err, "")
			return
		}
		if errors.Is(err, kratos.ErrFlowRejected) {
			// Machine-readable code: the web client localizes it (spec 035 fix
			// round 2 — raw Kratos English must never reach the user).
			httpx.WriteError(w, http.StatusBadRequest, "INVALID_CODE", kratosMessage(err))
			return
		}
		httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Password recovery is temporarily unavailable.")
		return
	}

	h.respondWithSession(w, r.Context(), session)
}

func (h *Handler) completeRecoveryContinuation(
	w http.ResponseWriter,
	r *http.Request,
	continuationID string,
	newPassword string,
) {
	token, ok := recoveryContinuations.get(continuationID)
	if !ok {
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_CODE", "Recovery session expired. Request a new code.")
		return
	}
	if err := h.Kratos.SettingsPassword(r.Context(), token, newPassword); err != nil {
		if errors.Is(err, kratos.ErrPasswordRejected) {
			h.writeRecoveryPasswordRejected(w, err, continuationID)
			return
		}
		if errors.Is(err, kratos.ErrFlowRejected) {
			recoveryContinuations.delete(continuationID)
			httpx.WriteError(w, http.StatusBadRequest, "INVALID_CODE", "Recovery session expired. Request a new code.")
			return
		}
		httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Password recovery is temporarily unavailable.")
		return
	}
	session, err := h.Kratos.WhoAmI(r.Context(), token)
	if err != nil {
		httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Password recovery is temporarily unavailable.")
		return
	}
	recoveryContinuations.delete(continuationID)
	h.respondWithSession(w, r.Context(), session)
}

func (h *Handler) writeRecoveryPasswordRejected(w http.ResponseWriter, err error, continuationID string) {
	if continuationID == "" {
		if token, ok := kratos.RecoverySessionToken(err); ok {
			issuedID, issueErr := recoveryContinuations.issue(token)
			if issueErr != nil {
				httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Password recovery is temporarily unavailable.")
				return
			}
			continuationID = issuedID
		}
	}
	var details map[string]any
	if continuationID != "" {
		details = map[string]any{"recoveryContinuationId": continuationID}
	}
	httpx.WriteErrorDetails(w, http.StatusBadRequest, "VALIDATION_ERROR", kratosMessage(err), details)
}

// VerificationStart: POST /api/auth/verification — starts (or resends) a
// code-method email verification flow.
func (h *Handler) VerificationStart(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email string `json:"email"`
	}
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Malformed request body.")
		return
	}
	// Same enumeration-safe posture as recovery.
	flowID, err := h.Kratos.VerificationStart(r.Context(), in.Email)
	if err != nil {
		httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Email verification is temporarily unavailable.")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{
		"delivery": "email",
		"email":    in.Email,
		"flowId":   flowID,
	})
}

// VerificationComplete: POST /api/auth/verification/complete
func (h *Handler) VerificationComplete(w http.ResponseWriter, r *http.Request) {
	var in struct {
		FlowID string `json:"flowId"`
		Code   string `json:"code"`
	}
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Malformed request body.")
		return
	}
	if in.FlowID == "" || in.Code == "" {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Verification code and flow are required.")
		return
	}
	if err := h.Kratos.VerificationComplete(r.Context(), in.FlowID, in.Code); err != nil {
		if errors.Is(err, kratos.ErrFlowRejected) {
			httpx.WriteError(w, http.StatusBadRequest, "INVALID_CODE", kratosMessage(err))
			return
		}
		httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Email verification is temporarily unavailable.")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"ok": true})
}

// ChangePassword: POST /api/auth/password — requires a session and the current
// password. Re-authenticating mints a fresh privileged session, so the change
// works regardless of how old the presented session is, and the current
// password is verified as a side effect.
func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	token := bearerToken(r)
	if token == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Sign in required.")
		return
	}
	session, err := h.Kratos.WhoAmI(r.Context(), token)
	if err != nil {
		if errors.Is(err, kratos.ErrInvalidCredentials) {
			httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Sign in required.")
			return
		}
		httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Session check is temporarily unavailable.")
		return
	}

	var in struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Malformed request body.")
		return
	}
	if utf8.RuneCountInString(in.NewPassword) < minPasswordRunes {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Password must be at least 8 characters.")
		return
	}

	fresh, err := h.Kratos.Login(r.Context(), session.Identity.Traits.Email, in.CurrentPassword)
	if err != nil {
		if errors.Is(err, kratos.ErrInvalidCredentials) {
			httpx.WriteError(w, http.StatusBadRequest, "INVALID_CURRENT_PASSWORD", "Current password is incorrect.")
			return
		}
		httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Password change is temporarily unavailable.")
		return
	}

	if err := h.Kratos.SettingsPassword(r.Context(), fresh.Token, in.NewPassword); err != nil {
		if errors.Is(err, kratos.ErrFlowRejected) {
			httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", kratosMessage(err))
			return
		}
		httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Password change is temporarily unavailable.")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"ok": true})
}

// Logout: POST /api/auth/logout
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	if token := bearerToken(r); token != "" {
		if err := h.Kratos.Logout(r.Context(), token); err != nil {
			if errors.Is(err, kratos.ErrInvalidCredentials) {
				httpx.WriteJSON(w, http.StatusOK, map[string]any{"ok": true})
				return
			}
			httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Logout is temporarily unavailable.")
			return
		}
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"ok": true})
}

// GetProfile: GET /api/profile (requires session middleware).
func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(sessionTokenKey).(string)
	profile, err := h.Profiles.GetByUserID(r.Context(), userID)
	if err != nil {
		writeProfileError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, profile)
}

// PatchProfile: PATCH /api/profile (requires session middleware).
func (h *Handler) PatchProfile(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(sessionTokenKey).(string)

	var in struct {
		DisplayName *string `json:"displayName"`
		Locale      *string `json:"locale"`
		Country     *string `json:"country"`
		City        *string `json:"city"`
		AvatarURL   *string `json:"avatarUrl"`
	}
	raw, err := httpx.DecodeJSONObject(r, &in)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Malformed request body.")
		return
	}
	// ProfileUpdateRequest is set-or-leave and does not accept null, but
	// encoding/json decodes an explicit null into the same nil pointer as an
	// omitted field — without this check {"country":null} would skip validation
	// and no-op with 200 instead of the contract's validation error.
	for _, field := range []string{"displayName", "locale", "country", "city", "avatarUrl"} {
		if value, ok := raw[field]; ok && httpx.IsJSONNull(value) {
			httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR",
				"null is not accepted; omit a field to keep its stored value.")
			return
		}
	}

	// Trim the free-text fields so a surrounding-whitespace value is neither
	// stored verbatim nor able to slip past the blank/length checks, then enforce
	// the ProfileUpdateRequest contract before persisting: the repository only
	// normalizes locale, so a non-web API client could otherwise store an empty
	// display name, a blank/over-long country/city, or a non-https avatar URL as
	// a "successful" update.
	displayName := trimOptional(in.DisplayName)
	country := trimOptional(in.Country)
	city := trimOptional(in.City)
	avatarURL := trimOptional(in.AvatarURL)
	locale := trimOptional(in.Locale)
	if msg, ok := validateProfileUpdate(displayName, country, city, avatarURL, locale); !ok {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", msg)
		return
	}

	profile, err := h.Profiles.Apply(r.Context(), userID, profiles.Update{
		DisplayName: displayName,
		Locale:      locale,
		Country:     country,
		City:        city,
		AvatarURL:   avatarURL,
	})
	if err != nil {
		writeProfileError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, profile)
}

// RequireSession is middleware that resolves the Kratos session token to a
// profile UUID and stores it in the request context. Unauthenticated requests
// get 401 before the handler runs; upstream identity outages stay visible as
// temporary server errors.
func (h *Handler) RequireSession(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := bearerToken(r)
		if token == "" {
			httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Sign in required.")
			return
		}
		session, err := h.Kratos.WhoAmI(r.Context(), token)
		if err != nil {
			if errors.Is(err, kratos.ErrInvalidCredentials) {
				httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Sign in required.")
				return
			}
			httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Session check is temporarily unavailable.")
			return
		}
		profile, err := h.Profiles.EnsureForIdentity(
			r.Context(), session.Identity.ID,
			session.Identity.Traits.Email,
			session.Identity.Traits.Name.First,
			session.Identity.Traits.Locale,
		)
		if err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not resolve profile.")
			return
		}
		ctx := context.WithValue(r.Context(), sessionTokenKey, profile.UserID)
		next(w, r.WithContext(ctx))
	}
}

func (h *Handler) respondWithSession(w http.ResponseWriter, ctx context.Context, session *kratos.Session) {
	profile, err := h.Profiles.EnsureForIdentity(
		ctx, session.Identity.ID,
		session.Identity.Traits.Email,
		session.Identity.Traits.Name.First,
		session.Identity.Traits.Locale,
	)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not resolve profile.")
		return
	}

	user := buildUser(profile, session.Identity.Traits.Name.First)
	user.EmailVerified = session.Identity.EmailVerified()

	httpx.WriteJSON(w, http.StatusOK, authResponse{
		Session:            &sessionDTO{Token: session.Token, ExpiresAt: session.ExpiresAt},
		User:               user,
		Profile:            &profile,
		VerificationFlowID: session.VerificationFlowID,
	})
}

func buildUser(p profiles.Profile, firstName string) *userDTO {
	// Prefer the stored profile display name: EnsureForIdentity keeps a
	// user-edited display_name (only seeding it from the Kratos trait while
	// empty), so returning the trait here would surface a stale name after a
	// PATCH /api/profile edit. Fall back to the trait only when no display name
	// has been set yet.
	name := p.DisplayName
	if name == "" {
		name = firstName
	}
	user := &userDTO{
		ID:        p.UserID,
		Email:     p.Email,
		Name:      name,
		AvatarURL: p.AvatarURL,
		CreatedAt: p.CreatedAt,
	}
	if p.Country != "" || p.City != "" {
		user.Location = &locationDTO{Country: p.Country, City: p.City}
	}
	return user
}

func bearerToken(r *http.Request) string {
	if h := r.Header.Get("Authorization"); strings.HasPrefix(h, "Bearer ") {
		return strings.TrimSpace(strings.TrimPrefix(h, "Bearer "))
	}
	return strings.TrimSpace(r.Header.Get("X-Session-Token"))
}

func kratosMessage(err error) string {
	msg := err.Error()
	if idx := strings.LastIndex(msg, ": "); idx >= 0 {
		return strings.TrimSpace(msg[idx+2:])
	}
	return msg
}

// trimOptional trims surrounding whitespace from a provided (non-nil) string,
// leaving an omitted field untouched.
func trimOptional(s *string) *string {
	if s == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*s)
	return &trimmed
}

// validateProfileUpdate enforces the ProfileUpdateRequest contract constraints on
// the mutable text fields. Only provided (non-nil) fields are checked; an omitted
// field is left unchanged by the repository. Returns a user-facing message and
// false when a field is invalid.
func validateProfileUpdate(displayName, country, city, avatarURL, locale *string) (string, bool) {
	// A provided-but-blank locale must not fall through to NormalizeLocale,
	// whose ""->"en" default exists for omitted registration/identity traits:
	// here it would let {"locale":""} silently reset a RU profile to EN while
	// "" is outside the OpenAPI Locale enum. Enum validation stays in Apply.
	if locale != nil && *locale == "" {
		return "Locale cannot be blank; omit the field to keep the stored value.", false
	}
	if displayName != nil {
		if strings.TrimSpace(*displayName) == "" {
			return "Display name cannot be empty.", false
		}
		if utf8.RuneCountInString(*displayName) > maxProfileFieldRunes {
			return "Display name must be 80 characters or fewer.", false
		}
	}
	if country != nil {
		if *country == "" {
			return "Country cannot be blank; omit the field to keep the stored value.", false
		}
		if utf8.RuneCountInString(*country) > maxProfileFieldRunes {
			return "Country must be 80 characters or fewer.", false
		}
	}
	if city != nil {
		if *city == "" {
			return "City cannot be blank; omit the field to keep the stored value.", false
		}
		if utf8.RuneCountInString(*city) > maxProfileFieldRunes {
			return "City must be 80 characters or fewer.", false
		}
	}
	if avatarURL != nil {
		// Constrain the stored value to an absolute https URL so future
		// consumers that render it as <img src>/<a href> or fetch it
		// server-side do not inherit a javascript:/data:/file: or
		// internal-address vector from a direct API client.
		if utf8.RuneCountInString(*avatarURL) > maxAvatarURLRunes {
			return "Avatar URL must be 2048 characters or fewer.", false
		}
		parsed, err := url.Parse(*avatarURL)
		if err != nil || parsed.Scheme != "https" || parsed.Host == "" {
			return "Avatar URL must be an absolute https URL.", false
		}
	}
	return "", true
}

func writeProfileError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, profiles.ErrNotFound):
		httpx.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Profile not found.")
	case errors.Is(err, profiles.ErrUnsupportedLocale):
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Unsupported locale.")
	default:
		httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Profile storage is temporarily unavailable.")
	}
}
