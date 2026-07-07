package auth

// Spec 037 (Google sign-in) — failing-first handler tests for the Google
// OIDC endpoints and the provider-availability probe. The complete happy
// path needs the profile repository (respondWithSession) and is covered by
// the kratos client tests plus the provider-agnostic e2e; the post-rollout
// operator smoke covers the real consent dance (plan.md rows 3 and 9).

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/kiaquila/capsule-zero/api/internal/kratos"
)

func TestProvidersReportsGoogleAvailability(t *testing.T) {
	for _, enabled := range []bool{true, false} {
		handler := Handler{Kratos: fakeIdentityClient{}, GoogleSignInEnabled: enabled}
		request := httptest.NewRequest(http.MethodGet, "/api/auth/providers", nil)
		recorder := httptest.NewRecorder()

		handler.Providers(recorder, request)

		if recorder.Code != http.StatusOK {
			t.Fatalf("enabled=%v: status = %d, want 200", enabled, recorder.Code)
		}
		if body := decodeJSONBody(t, recorder); body["google"] != enabled {
			t.Fatalf("enabled=%v: body = %v", enabled, body)
		}
	}
}

func TestGoogleStartReturnsRedirectAndExchangeCode(t *testing.T) {
	handler := Handler{
		Kratos: fakeIdentityClient{
			oidcRedirectURL:  "https://accounts.google.com/o/oauth2/v2/auth?state=xyz",
			oidcExchangeCode: "init-code-1",
		},
		GoogleSignInEnabled: true,
	}
	request := httptest.NewRequest(http.MethodPost, "/api/auth/google/start",
		strings.NewReader(`{"returnTo":"https://capsulezero.app/en/auth/google/callback"}`))
	recorder := httptest.NewRecorder()

	handler.GoogleStart(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", recorder.Code)
	}
	body := decodeJSONBody(t, recorder)
	if body["redirectUrl"] != "https://accounts.google.com/o/oauth2/v2/auth?state=xyz" {
		t.Fatalf("redirectUrl = %v", body["redirectUrl"])
	}
	if body["exchangeCode"] != "init-code-1" {
		t.Fatalf("exchangeCode = %v", body["exchangeCode"])
	}
}

func TestGoogleStartDisabledReturns404(t *testing.T) {
	// Negative scenario 3: with AUTH_GOOGLE_ENABLED off the endpoint is
	// conceptually absent — the button is hidden and direct calls 404.
	handler := Handler{Kratos: fakeIdentityClient{}, GoogleSignInEnabled: false}
	request := httptest.NewRequest(http.MethodPost, "/api/auth/google/start",
		strings.NewReader(`{"returnTo":"https://capsulezero.app/en/auth/google/callback"}`))
	recorder := httptest.NewRecorder()

	handler.GoogleStart(recorder, request)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", recorder.Code)
	}
}

func TestGoogleStartRequiresReturnTo(t *testing.T) {
	handler := Handler{Kratos: fakeIdentityClient{}, GoogleSignInEnabled: true}
	request := httptest.NewRequest(http.MethodPost, "/api/auth/google/start",
		strings.NewReader(`{"returnTo":""}`))
	recorder := httptest.NewRecorder()

	handler.GoogleStart(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", recorder.Code)
	}
	if body := decodeErrorBody(t, recorder); body.Error.Code != "VALIDATION_ERROR" {
		t.Fatalf("code = %q, want VALIDATION_ERROR", body.Error.Code)
	}
}

func TestGoogleCompleteRejectsInvalidCodes(t *testing.T) {
	// Negative scenario 2: wrong/expired/reused exchange codes never issue a
	// session; the machine code lets the web localize the failure.
	handler := Handler{
		Kratos:              fakeIdentityClient{oidcExchangeErr: kratos.ErrInvalidCredentials},
		GoogleSignInEnabled: true,
	}
	request := httptest.NewRequest(http.MethodPost, "/api/auth/google/complete",
		strings.NewReader(`{"exchangeCode":"bad-init","returnToCode":"bad-return"}`))
	recorder := httptest.NewRecorder()

	handler.GoogleComplete(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", recorder.Code)
	}
	if body := decodeErrorBody(t, recorder); body.Error.Code != "GOOGLE_SIGN_IN_FAILED" {
		t.Fatalf("code = %q, want GOOGLE_SIGN_IN_FAILED", body.Error.Code)
	}
}

func TestGoogleCompleteDisabledReturns404(t *testing.T) {
	handler := Handler{Kratos: fakeIdentityClient{}, GoogleSignInEnabled: false}
	request := httptest.NewRequest(http.MethodPost, "/api/auth/google/complete",
		strings.NewReader(`{"exchangeCode":"init","returnToCode":"ret"}`))
	recorder := httptest.NewRecorder()

	handler.GoogleComplete(recorder, request)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", recorder.Code)
	}
}

func TestGoogleCompleteRequiresBothCodes(t *testing.T) {
	handler := Handler{Kratos: fakeIdentityClient{}, GoogleSignInEnabled: true}
	for _, body := range []string{
		`{"exchangeCode":"","returnToCode":"ret"}`,
		`{"exchangeCode":"init","returnToCode":""}`,
	} {
		request := httptest.NewRequest(http.MethodPost, "/api/auth/google/complete",
			strings.NewReader(body))
		recorder := httptest.NewRecorder()

		handler.GoogleComplete(recorder, request)

		if recorder.Code != http.StatusBadRequest {
			t.Fatalf("body %s: status = %d, want 400", body, recorder.Code)
		}
	}
}
