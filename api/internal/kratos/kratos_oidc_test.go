package kratos

// Spec 037 (Google sign-in) — failing-first tests for the native-app OIDC
// flow: an API login flow created with return_session_token_exchange_code
// yields the Google redirect URL plus an exchange code, and the callback's
// return_to code is later exchanged for a session token over the internal
// network (/sessions/token-exchange). Shapes follow the Ory native-app
// social sign-in contract and are pinned here.

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestOIDCStartReturnsRedirectAndExchangeCode(t *testing.T) {
	var submitted map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodGet && r.URL.Path == "/self-service/login/api":
			if got := r.URL.Query().Get("return_session_token_exchange_code"); got != "true" {
				t.Errorf("return_session_token_exchange_code = %q, want true", got)
			}
			if got := r.URL.Query().Get("return_to"); got != "https://capsulezero.app/en/auth/google/callback" {
				t.Errorf("return_to = %q", got)
			}
			_ = json.NewEncoder(w).Encode(map[string]any{
				"id":                          "login-flow-1",
				"session_token_exchange_code": "init-code-1",
			})
		case r.Method == http.MethodPost && r.URL.Path == "/self-service/login":
			if got := r.URL.Query().Get("flow"); got != "login-flow-1" {
				t.Errorf("submit flow = %q, want login-flow-1", got)
			}
			submitted = decodeBody(t, r)
			// Kratos answers an OIDC submit on an API flow with 422 and the
			// browser redirect target for the provider's consent screen.
			w.WriteHeader(http.StatusUnprocessableEntity)
			_ = json.NewEncoder(w).Encode(map[string]any{
				"error":               map[string]any{"id": "browser_location_change_required"},
				"redirect_browser_to": "https://accounts.google.com/o/oauth2/v2/auth?state=xyz",
			})
		default:
			t.Errorf("unexpected request: %s %s", r.Method, r.URL.Path)
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	client := New(server.URL, server.URL)
	redirectURL, exchangeCode, err := client.OIDCStart(
		context.Background(), "google", "https://capsulezero.app/en/auth/google/callback")
	if err != nil {
		t.Fatalf("OIDCStart: %v", err)
	}
	if redirectURL != "https://accounts.google.com/o/oauth2/v2/auth?state=xyz" {
		t.Fatalf("redirectURL = %q", redirectURL)
	}
	if exchangeCode != "init-code-1" {
		t.Fatalf("exchangeCode = %q, want init-code-1", exchangeCode)
	}
	if submitted["method"] != "oidc" || submitted["provider"] != "google" {
		t.Fatalf("submit body = %v", submitted)
	}
}

func TestOIDCStartFailsWithoutExchangeCode(t *testing.T) {
	// A flow created without the exchange code (e.g. the flag was dropped or
	// an older Kratos ignores it) cannot complete the loop — fail fast at
	// start instead of stranding the user after the Google consent screen.
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"id": "login-flow-2"})
	}))
	defer server.Close()

	client := New(server.URL, server.URL)
	if _, _, err := client.OIDCStart(context.Background(), "google", "https://capsulezero.app/cb"); err == nil {
		t.Fatal("OIDCStart succeeded without a session_token_exchange_code, want error")
	}
}

func TestOIDCStartRejectedSubmitIsFlowRejected(t *testing.T) {
	// A 400 on the OIDC submit (e.g. the provider is not configured in
	// Kratos) must classify as a flow rejection, not a transport fault.
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodGet && r.URL.Path == "/self-service/login/api":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"id":                          "login-flow-3",
				"session_token_exchange_code": "init-code-3",
			})
		default:
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]any{
				"ui": map[string]any{"messages": []map[string]any{
					{"id": 4000001, "type": "error", "text": "The provider is unknown."},
				}},
			})
		}
	}))
	defer server.Close()

	client := New(server.URL, server.URL)
	_, _, err := client.OIDCStart(context.Background(), "google", "https://capsulezero.app/cb")
	if !errors.Is(err, ErrFlowRejected) {
		t.Fatalf("err = %v, want ErrFlowRejected", err)
	}
}

func TestOIDCExchangeReturnsSession(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet || r.URL.Path != "/sessions/token-exchange" {
			t.Errorf("unexpected request: %s %s", r.Method, r.URL.Path)
			w.WriteHeader(http.StatusNotFound)
			return
		}
		if got := r.URL.Query().Get("init_code"); got != "init-code-1" {
			t.Errorf("init_code = %q", got)
		}
		if got := r.URL.Query().Get("return_to_code"); got != "ret-code-1" {
			t.Errorf("return_to_code = %q", got)
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"session_token": "google-session-token",
			"session": map[string]any{
				"expires_at": "2030-01-01T00:00:00Z",
				"identity": map[string]any{
					"id": "identity-google-1",
					"traits": map[string]any{
						"email": "person@gmail.com",
						"name":  map[string]any{"first": "Person"},
					},
				},
			},
		})
	}))
	defer server.Close()

	client := New(server.URL, server.URL)
	session, err := client.OIDCExchange(context.Background(), "init-code-1", "ret-code-1")
	if err != nil {
		t.Fatalf("OIDCExchange: %v", err)
	}
	if session.Token != "google-session-token" {
		t.Fatalf("token = %q", session.Token)
	}
	if session.Identity.Traits.Email != "person@gmail.com" {
		t.Fatalf("email = %q", session.Identity.Traits.Email)
	}
	if session.Identity.Traits.Name.First != "Person" {
		t.Fatalf("first name = %q", session.Identity.Traits.Name.First)
	}
	if session.ExpiresAt.IsZero() {
		t.Fatal("expiresAt is zero")
	}
}

func TestOIDCExchangeRejectsUnknownCodes(t *testing.T) {
	// Kratos answers wrong / expired / already-consumed code pairs with
	// 403/404/410 — all must collapse into a credential rejection the
	// handler can map to GOOGLE_SIGN_IN_FAILED without issuing a session.
	for _, status := range []int{http.StatusForbidden, http.StatusNotFound, http.StatusGone} {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(status)
		}))

		client := New(server.URL, server.URL)
		_, err := client.OIDCExchange(context.Background(), "bad-init", "bad-return")
		if !errors.Is(err, ErrInvalidCredentials) {
			t.Errorf("status %d: err = %v, want ErrInvalidCredentials", status, err)
		}
		server.Close()
	}
}
