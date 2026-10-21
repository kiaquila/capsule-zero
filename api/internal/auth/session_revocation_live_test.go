//go:build integration

package auth

import (
	"context"
	"fmt"
	"github.com/kiaquila/capsule-zero/api/internal/kratos"
	"net/http/httptest"
	"os"
	"testing"
	"time"
)

func TestSessionRevocationLiveKratos(t *testing.T) {
	endpoint := os.Getenv("TEST_KRATOS_PUBLIC_URL")
	if endpoint == "" {
		t.Skip("TEST_KRATOS_PUBLIC_URL requires disposable Kratos")
	}
	c := kratos.New(endpoint, "")
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()
	email := fmt.Sprintf("revoke-%d@example.invalid", time.Now().UnixNano())
	password := "S3ssion-Revocation-Smoke-058"
	first, err := c.Register(ctx, email, password, "Revocation Smoke", "en")
	if err != nil {
		t.Fatal("registration failed")
	}
	current, err := c.Login(ctx, email, password)
	if err != nil {
		t.Fatal("login failed")
	}
	foreign, err := c.Register(ctx, "other-"+email, password, "Other Smoke", "en")
	if err != nil {
		t.Fatal("foreign registration failed")
	}
	firstInfo, err := c.WhoAmI(ctx, first.Token)
	if err != nil {
		t.Fatal("first whoami failed")
	}
	currentInfo, err := c.WhoAmI(ctx, current.Token)
	if err != nil {
		t.Fatal("current whoami failed")
	}
	foreignInfo, err := c.WhoAmI(ctx, foreign.Token)
	if err != nil {
		t.Fatal("foreign whoami failed")
	}
	h := Handler{Kratos: c}
	revoke := func(id string) int {
		t.Helper()
		req := httptest.NewRequest("DELETE", "/api/auth/sessions", nil)
		req.Header.Set("Authorization", "Bearer "+current.Token)
		req.SetPathValue("id", id)
		rec := httptest.NewRecorder()
		if id == "" {
			h.RevokeOtherSessions(rec, req)
		} else {
			h.RevokeSession(rec, req)
		}
		return rec.Code
	}
	if code := revoke(currentInfo.Info.ID); code != 400 {
		t.Fatalf("current protection status %d", code)
	}
	if err := c.RevokeSession(ctx, current.Token, currentInfo.Info.ID); err == nil {
		t.Fatal("native Kratos current guard failed")
	}
	if code := revoke(foreignInfo.Info.ID); code != 204 {
		t.Fatalf("foreign protection status %d", code)
	}
	if _, err := c.WhoAmI(ctx, foreign.Token); err != nil {
		t.Fatal("foreign session was affected")
	}
	if code := revoke(firstInfo.Info.ID); code != 204 {
		t.Fatalf("single revoke status %d", code)
	}
	if _, err := c.WhoAmI(ctx, first.Token); err == nil {
		t.Fatal("single target still authenticated")
	}
	for i := 0; i < 2; i++ {
		if _, err := c.Login(ctx, email, password); err != nil {
			t.Fatal("extra login failed")
		}
	}
	if code := revoke(""); code != 204 {
		t.Fatalf("bulk revoke status %d", code)
	}
	others, err := c.ListSessions(ctx, current.Token)
	if err != nil || len(others) != 0 {
		t.Fatal("bulk left other sessions active")
	}
	if _, err := c.WhoAmI(ctx, current.Token); err != nil {
		t.Fatal("bulk revoked current")
	}
	if _, err := c.WhoAmI(ctx, foreign.Token); err != nil {
		t.Fatal("bulk crossed owner boundary")
	}
	if code := revoke(""); code != 204 {
		t.Fatalf("empty bulk retry status %d", code)
	}
}
