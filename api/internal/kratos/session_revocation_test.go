package kratos

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSessionRevocationNeverFollowsRedirect(t *testing.T) {
	leaked := false
	target := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { leaked = true; w.WriteHeader(204) }))
	defer target.Close()
	source := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-Session-Token") != "owner" {
			t.Error("missing token")
		}
		http.Redirect(w, r, target.URL, http.StatusTemporaryRedirect)
	}))
	defer source.Close()
	client := New(source.URL, "")
	if err := client.RevokeSession(context.Background(), "owner", "22222222-2222-4222-8222-222222222222"); err == nil {
		t.Error("redirect reported success")
	}
	if err := client.RevokeOtherSessions(context.Background(), "owner"); err == nil {
		t.Error("bulk redirect reported success")
	}
	if leaked {
		t.Error("redirect forwarded credential")
	}
}
