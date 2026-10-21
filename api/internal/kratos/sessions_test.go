package kratos

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestListSessionsUsesTokenAndFixedOriginPagination(t *testing.T) {
	calls := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		if r.URL.Path != "/sessions" || r.Header.Get("X-Session-Token") != "owner-token" {
			t.Errorf("wrong authenticated request: %s", r.URL.Path)
		}
		if calls == 1 {
			if r.URL.Query().Get("per_page") != "100" {
				t.Error("missing bounded page size")
			}
			w.Header().Set("Link", `<https://attacker.invalid/sessions?page=4&per_page=100>; rel="next"`)
			fmt.Fprint(w, `[{"id":"other-1","active":true,"expires_at":"2099-01-01T00:00:00Z","authenticated_at":"2026-10-20T12:00:00Z","session_token":"must-not-escape","identity":{"traits":{"email":"private@example.com"}}}]`)
		} else {
			if r.URL.Query().Get("page") != "4" {
				t.Error("did not follow nonsequential next page")
			}
			fmt.Fprint(w, `[{"id":"other-2","active":true,"expires_at":"2099-01-01T00:00:00Z"}]`)
		}
	}))
	defer server.Close()
	sessions, err := New(server.URL, "").ListSessions(context.Background(), "owner-token")
	if err != nil || len(sessions) != 2 || calls != 2 {
		t.Fatalf("inventory=%v calls=%d err=%v", sessions, calls, err)
	}
	if sessions[0].ID != "other-1" || sessions[0].AuthenticatedAt.IsZero() {
		t.Fatalf("lost real metadata: %+v", sessions[0])
	}
}

func TestListSessionsNeverReturnsPartialInventory(t *testing.T) {
	for _, scenario := range []string{"unauthorized", "later-failure", "cycle", "malformed", "budget"} {
		t.Run(scenario, func(t *testing.T) {
			calls := 0
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				calls++
				switch {
				case scenario == "unauthorized":
					w.WriteHeader(http.StatusUnauthorized)
				case scenario == "later-failure" && calls == 2:
					w.WriteHeader(http.StatusServiceUnavailable)
				case scenario == "malformed":
					fmt.Fprint(w, `{`)
				default:
					page := calls + 1
					if scenario == "cycle" {
						page = 2
					}
					w.Header().Set("Link", fmt.Sprintf(`</sessions?page=%d&per_page=100>; rel="next"`, page))
					fmt.Fprint(w, `[{"id":"other","active":true}]`)
				}
			}))
			defer server.Close()
			sessions, err := New(server.URL, "").ListSessions(context.Background(), "token")
			if err == nil || sessions != nil {
				t.Fatalf("partial inventory on %s: %v %v", scenario, sessions, err)
			}
			if scenario == "unauthorized" && !errors.Is(err, ErrInvalidCredentials) {
				t.Fatalf("wrong error: %v", err)
			}
			if calls > 20 {
				t.Fatalf("unbounded requests: %d", calls)
			}
		})
	}
}

// v26.2.0 sends an optimistic next Link even when X-Total-Count is zero.
func TestListSessionsStopsAtConfirmedEmptyInventory(t *testing.T) {
	calls := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		w.Header().Set("X-Total-Count", "0")
		w.Header().Set("Link", fmt.Sprintf(`</sessions?page=%d&per_page=100>; rel="next"`, calls))
		fmt.Fprint(w, `[]`)
	}))
	defer server.Close()
	sessions, err := New(server.URL, "").ListSessions(context.Background(), "token")
	if err != nil || len(sessions) != 0 || calls != 1 {
		t.Fatalf("empty inventory: calls=%d err=%v", calls, err)
	}
}
