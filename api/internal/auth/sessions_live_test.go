//go:build integration

package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/kiaquila/capsule-zero/api/internal/kratos"
)

// Run only against an explicitly provisioned disposable Kratos. This creates
// test identities; the default suite never connects to an external account.
func TestSessionsLiveKratos(t *testing.T) {
	endpoint := os.Getenv("TEST_KRATOS_PUBLIC_URL")
	if endpoint == "" {
		t.Skip("TEST_KRATOS_PUBLIC_URL requires disposable Kratos")
	}
	client := kratos.New(endpoint, "")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	email := fmt.Sprintf("inventory-%d@example.invalid", time.Now().UnixNano())
	password := "S3ssion-Inventory-Smoke-057"
	first, err := client.Register(ctx, email, password, "Inventory Smoke", "en")
	if err != nil {
		t.Fatal("disposable account registration failed")
	}
	second, err := client.Login(ctx, email, password)
	if err != nil {
		t.Fatal("second login failed")
	}
	foreign, err := client.Register(ctx, "other-"+email, password, "Other Smoke", "en")
	if err != nil {
		t.Fatal("foreign account registration failed")
	}
	current, err := client.WhoAmI(ctx, second.Token)
	if err != nil {
		t.Fatal("whoami failed")
	}
	others, err := client.ListSessions(ctx, second.Token)
	if err != nil {
		t.Fatalf("list fetch failed: %v", err)
	}
	if _, err := sessionInventory(current.Info, others, time.Now()); err != nil {
		t.Fatalf("metadata projection failed: %v", err)
	}
	h := Handler{Kratos: client}
	read := func(token string) []sessionInfoDTO {
		t.Helper()
		req := httptest.NewRequest(http.MethodGet, "/api/auth/sessions?identity_id=not-the-owner", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		h.Sessions(rec, req)
		if rec.Code != 200 {
			_, fetchErr := client.ListSessions(ctx, token)
			probe, _ := http.NewRequestWithContext(ctx, http.MethodGet, endpoint+"/sessions?per_page=100", nil)
			probe.Header.Set("X-Session-Token", token)
			response, probeErr := http.DefaultClient.Do(probe)
			if probeErr == nil {
				t.Logf("pagination links: %s; total: %s", response.Header.Get("Link"), response.Header.Get("X-Total-Count"))
				response.Body.Close()
			}
			t.Fatalf("inventory status = %d; fetch error = %v", rec.Code, fetchErr)
		}
		var result []sessionInfoDTO
		if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
			t.Fatal(err)
		}
		return result
	}
	sessions := read(second.Token)
	if len(sessions) != 2 || !sessions[0].Current || sessions[0].ID != current.Info.ID || sessions[1].Current {
		t.Fatalf("expected exactly two owner sessions and one exact current marker")
	}
	if sessions[0].AuthenticatedAt == nil || sessions[0].ExpiresAt.IsZero() {
		t.Fatal("real timestamps missing")
	}
	if len(read(foreign.Token)) != 1 {
		t.Fatal("foreign account inventory was not isolated")
	}
	if err := client.Logout(ctx, first.Token); err != nil {
		t.Fatal("first session logout failed")
	}
	if len(read(second.Token)) != 1 {
		t.Fatal("revoked session remained in inventory")
	}
}
