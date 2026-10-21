package auth

import (
	"fmt"
	"github.com/kiaquila/capsule-zero/api/internal/kratos"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSessionRevocationBoundary(t *testing.T) {
	const current = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
	const other = "22222222-2222-4222-8222-222222222222"
	for _, tc := range []struct {
		name, id, token        string
		upstream, want, writes int
	}{
		{"single", other, "owner", 204, 204, 1}, {"bulk", "", "owner", 200, 204, 1},
		{"missing-token", other, "", 204, 401, 0}, {"expired-token", other, "expired", 204, 401, 0},
		{"current", current, "owner", 204, 400, 0}, {"current-uppercase", "AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA", "owner", 204, 400, 0},
		{"malformed", "whoami", "owner", 204, 400, 0}, {"foreign", other, "owner", 404, 404, 1},
		{"outage", other, "owner", 503, 502, 1}, {"bulk-outage", "", "owner", 503, 502, 1},
		{"expires-before-write", other, "owner", 401, 401, 1},
	} {
		t.Run(tc.name, func(t *testing.T) {
			writes := 0
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Header.Get("X-Session-Token") != tc.token {
					t.Error("lost owner token")
				}
				if r.URL.Path == "/sessions/whoami" {
					if tc.token == "expired" {
						w.WriteHeader(401)
						return
					}
					fmt.Fprintf(w, `{"id":%q,"active":true,"expires_at":"2099-01-01T00:00:00Z","identity":{"id":"owner"}}`, current)
					return
				}
				writes++
				expected := "/sessions"
				if tc.id != "" {
					expected += "/" + tc.id
				}
				if r.Method != "DELETE" || r.URL.Path != expected || r.URL.RawQuery != "" {
					t.Errorf("wrong mutation: %s %s", r.Method, r.URL)
				}
				w.WriteHeader(tc.upstream)
				if tc.upstream == 200 {
					fmt.Fprint(w, `{"count":2}`)
				}
			}))
			defer upstream.Close()
			h := Handler{Kratos: kratos.New(upstream.URL, "")}
			req := httptest.NewRequest("DELETE", "/api/auth/sessions?identity_id=foreign", nil)
			req.SetPathValue("id", tc.id)
			if tc.token != "" {
				req.Header.Set("Authorization", "Bearer "+tc.token)
			}
			rec := httptest.NewRecorder()
			if tc.id == "" {
				h.RevokeOtherSessions(rec, req)
			} else {
				h.RevokeSession(rec, req)
			}
			if rec.Code != tc.want || writes != tc.writes {
				t.Fatalf("status=%d writes=%d; want %d/%d", rec.Code, writes, tc.want, tc.writes)
			}
			if rec.Header().Get("Cache-Control") != "private, no-store" {
				t.Error("mutation response cacheable")
			}
			if rec.Code == 204 && rec.Body.Len() != 0 {
				t.Error("204 leaked response body")
			}
		})
	}
}
