package auth

// Google sign-in endpoints (spec 037) — the HTTP surface over the Kratos
// native-app OIDC flow. Kept out of auth.go to respect the module-size soft
// gate; the session/profile hand-off reuses respondWithSession unchanged.

import (
	"errors"
	"net/http"
	"strings"

	"github.com/kiaquila/capsule-zero/api/internal/httpx"
	"github.com/kiaquila/capsule-zero/api/internal/kratos"
)

// Providers: GET /api/auth/providers — which social sign-in providers this
// deployment offers. The web shows or hides the Google button from this.
func (h *Handler) Providers(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"google": h.GoogleSignInEnabled})
}

// GoogleStart: POST /api/auth/google/start — begins the native OIDC flow and
// hands the browser its Google consent URL plus the exchange (init) code the
// completion call must present again.
func (h *Handler) GoogleStart(w http.ResponseWriter, r *http.Request) {
	if !h.GoogleSignInEnabled {
		// Negative scenario 3: with the provider off the endpoint is absent.
		httpx.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Google sign-in is not enabled.")
		return
	}
	var in struct {
		ReturnTo string `json:"returnTo"`
	}
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Malformed request body.")
		return
	}
	if strings.TrimSpace(in.ReturnTo) == "" {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "returnTo is required.")
		return
	}

	redirectURL, exchangeCode, err := h.Kratos.OIDCStart(r.Context(), "google", in.ReturnTo)
	if err != nil {
		// A flow rejection here means Kratos-side OIDC config drift (provider
		// missing / return_to not allowed) — an operator problem, not user
		// input, so it stays a generic upstream failure.
		httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Google sign-in is temporarily unavailable.")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{
		"redirectUrl":  redirectURL,
		"exchangeCode": exchangeCode,
	})
}

// GoogleComplete: POST /api/auth/google/complete — exchanges the init code +
// callback return_to code for a Kratos session and answers with the standard
// auth response (session, user, profile).
func (h *Handler) GoogleComplete(w http.ResponseWriter, r *http.Request) {
	if !h.GoogleSignInEnabled {
		httpx.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Google sign-in is not enabled.")
		return
	}
	var in struct {
		ExchangeCode string `json:"exchangeCode"`
		ReturnToCode string `json:"returnToCode"`
	}
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Malformed request body.")
		return
	}
	if in.ExchangeCode == "" || in.ReturnToCode == "" {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Both exchange codes are required.")
		return
	}

	session, err := h.Kratos.OIDCExchange(r.Context(), in.ExchangeCode, in.ReturnToCode)
	if err != nil {
		if errors.Is(err, kratos.ErrInvalidCredentials) {
			// Wrong / expired / reused codes never issue a session (negative
			// scenario 2); the machine code is localized by the web client.
			httpx.WriteError(w, http.StatusUnauthorized, "GOOGLE_SIGN_IN_FAILED",
				"Google sign-in could not be completed. Please try again.")
			return
		}
		httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Google sign-in is temporarily unavailable.")
		return
	}

	h.respondWithSession(w, r.Context(), session)
}
