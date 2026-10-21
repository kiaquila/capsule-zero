package auth

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/kiaquila/capsule-zero/api/internal/kratos"
)

func TestSessionsCombinesCurrentAndActiveInventory(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-Session-Token") != "owner-token" {
			t.Error("lost owner token")
		}
		switch r.URL.Path {
		case "/sessions/whoami":
			fmt.Fprint(w, `{"id":"current","active":true,"authenticated_at":"2026-10-21T10:00:00Z","expires_at":"2099-01-01T00:00:00Z","identity":{"id":"owner","traits":{"email":"private@example.com"}}}`)
		case "/sessions":
			if r.URL.Query().Get("identity_id") != "" {
				t.Error("forwarded identity selector")
			}
			fmt.Fprint(w, `[{"id":"other","active":true,"authenticated_at":"2026-10-20T10:00:00Z","expires_at":"2099-01-01T00:00:00Z","session_token":"secret","devices":[{"ip_address":"10.0.0.1"}]},{"id":"current","active":true,"expires_at":"2099-01-01T00:00:00Z"},{"id":"other","active":true,"expires_at":"2099-01-01T00:00:00Z"},{"id":"revoked","active":false,"expires_at":"2099-01-01T00:00:00Z"},{"id":"expired","active":true,"expires_at":"2000-01-01T00:00:00Z"}]`)
		default:
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
	}))
	defer upstream.Close()
	h := Handler{Kratos: kratos.New(upstream.URL, "")}
	req := httptest.NewRequest(http.MethodGet, "/api/auth/sessions?identity_id=someone-else", nil)
	req.Header.Set("Authorization", "Bearer owner-token")
	rec := httptest.NewRecorder()
	h.Sessions(rec, req)
	if rec.Code != 200 {
		t.Fatalf("status %d: %s", rec.Code, rec.Body.String())
	}
	body := rec.Body.String()
	if !strings.Contains(body, `"current":true`) || strings.Count(body, `"id":`) != 2 || !strings.Contains(body, `"id":"other"`) {
		t.Fatalf("wrong inventory: %s", body)
	}
	for _, forbidden := range []string{"secret", "owner-token", "private@example.com", "10.0.0.1", "revoked", "expired", "identity", "session_token", "devices"} {
		if strings.Contains(body, forbidden) {
			t.Errorf("leaked %s: %s", forbidden, body)
		}
	}
	if rec.Header().Get("Cache-Control") != "private, no-store" {
		t.Error("session list must never be cached")
	}
}

func TestSessionsAuthenticationAndOutage(t *testing.T) {
	for _, tc := range []struct {
		name, token    string
		upstream, want int
	}{
		{"missing", "", 200, 401}, {"invalid", "bad", 401, 401}, {"outage", "owner", 503, 502}, {"missing-current-id", "owner", 200, 502},
	} {
		t.Run(tc.name, func(t *testing.T) {
			calls := 0
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				calls++
				w.WriteHeader(tc.upstream)
				fmt.Fprint(w, `{}`)
			}))
			defer upstream.Close()
			h := Handler{Kratos: kratos.New(upstream.URL, "")}
			req := httptest.NewRequest(http.MethodGet, "/api/auth/sessions", nil)
			if tc.token != "" {
				req.Header.Set("X-Session-Token", tc.token)
			}
			rec := httptest.NewRecorder()
			h.Sessions(rec, req)
			if rec.Code != tc.want {
				t.Fatalf("status=%d want=%d body=%s", rec.Code, tc.want, rec.Body.String())
			}
			if tc.token == "" && calls != 0 {
				t.Error("unauthenticated upstream call")
			}
		})
	}
}
