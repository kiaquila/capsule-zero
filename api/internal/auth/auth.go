// Package auth wires Kratos identity flows and the profile repository into the
// HTTP surface the web `api` provider consumes (AuthPort + ProfileRepository).
package auth

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/kiaquila/capsule-zero/api/internal/httpx"
	"github.com/kiaquila/capsule-zero/api/internal/kratos"
	"github.com/kiaquila/capsule-zero/api/internal/profiles"
)

type ctxKey int

const sessionTokenKey ctxKey = iota

type identityClient interface {
	Register(context.Context, string, string, string, string) (*kratos.Session, error)
	Login(context.Context, string, string) (*kratos.Session, error)
	WhoAmI(context.Context, string) (*kratos.Session, error)
	Recovery(context.Context, string) error
	Logout(context.Context, string) error
}

// Handler holds the dependencies for the auth/profile endpoints.
type Handler struct {
	Kratos   identityClient
	Profiles *profiles.Repo
}

// --- DTOs (match the web contract in app/src/lib/providers/contracts.ts) ---

type locationDTO struct {
	Country string `json:"country,omitempty"`
	City    string `json:"city,omitempty"`
}

type userDTO struct {
	ID        string       `json:"id"`
	Email     string       `json:"email"`
	Name      string       `json:"name,omitempty"`
	AvatarURL string       `json:"avatarUrl,omitempty"`
	Location  *locationDTO `json:"location,omitempty"`
	CreatedAt time.Time    `json:"createdAt"`
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

	session, err := h.Kratos.Register(r.Context(), in.Email, in.Password, in.Name, locale)
	if err != nil {
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
			httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Invalid email or password.")
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

// Recovery: POST /api/auth/recovery
func (h *Handler) Recovery(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email string `json:"email"`
	}
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Malformed request body.")
		return
	}
	// Never reveal whether the address exists.
	if err := h.Kratos.Recovery(r.Context(), in.Email); err != nil {
		httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Password recovery is temporarily unavailable.")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"delivery": "email", "email": in.Email})
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
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Malformed request body.")
		return
	}

	profile, err := h.Profiles.Apply(r.Context(), userID, profiles.Update{
		DisplayName: in.DisplayName,
		Locale:      in.Locale,
		Country:     in.Country,
		City:        in.City,
		AvatarURL:   in.AvatarURL,
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

	httpx.WriteJSON(w, http.StatusOK, authResponse{
		Session: &sessionDTO{Token: session.Token, ExpiresAt: session.ExpiresAt},
		User:    buildUser(profile, session.Identity.Traits.Name.First),
		Profile: &profile,
	})
}

func buildUser(p profiles.Profile, firstName string) *userDTO {
	name := firstName
	if name == "" {
		name = p.DisplayName
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
