package main

import (
	"github.com/kiaquila/capsule-zero/api/internal/auth"
	"github.com/kiaquila/capsule-zero/api/internal/ratelimit"
	"net/http"
	"testing"
)

func TestGuestProgressRoutesRequireSession(t *testing.T) {
	mux := newMux(&auth.Handler{}, ratelimit.New(10, 10), ratelimit.New(120, 20))
	for _, probe := range []struct{ method, path string }{
		{"POST", "/api/guest-progress"}, {"GET", "/api/guest-progress"},
		{"GET", "/api/guest-progress/00000000-0000-4000-8000-000000000001"},
		{"GET", "/api/guest-progress/items"},
		{"PATCH", "/api/guest-progress/items/00000000-0000-4000-8000-000000000001"},
	} {
		if code := doRequest(t, mux, probe.method, probe.path, ""); code != http.StatusUnauthorized {
			t.Errorf("%s %s = %d, want 401", probe.method, probe.path, code)
		}
	}
}
