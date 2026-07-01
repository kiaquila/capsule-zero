package auth

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/kiaquila/capsule-zero/api/internal/httpx"
	"github.com/kiaquila/capsule-zero/api/internal/kratos"
	"github.com/kiaquila/capsule-zero/api/internal/profiles"
)

func TestWriteProfileError(t *testing.T) {
	tests := []struct {
		name       string
		err        error
		wantStatus int
		wantCode   string
	}{
		{
			name:       "not found remains 404",
			err:        profiles.ErrNotFound,
			wantStatus: http.StatusNotFound,
			wantCode:   "profile_not_found",
		},
		{
			name:       "unsupported locale is client error",
			err:        profiles.ErrUnsupportedLocale,
			wantStatus: http.StatusBadRequest,
			wantCode:   "invalid_locale",
		},
		{
			name:       "storage errors are server errors",
			err:        errors.New("database unavailable"),
			wantStatus: http.StatusInternalServerError,
			wantCode:   "profile_error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()

			writeProfileError(recorder, tt.err)

			if recorder.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", recorder.Code, tt.wantStatus)
			}

			var body httpx.ErrorBody
			if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
				t.Fatalf("decode error body: %v", err)
			}
			if body.Code != tt.wantCode {
				t.Fatalf("code = %q, want %q", body.Code, tt.wantCode)
			}
		})
	}
}

func TestRecoveryReportsUnexpectedKratosFailure(t *testing.T) {
	handler := Handler{
		Kratos: fakeIdentityClient{
			recoveryErr: errors.New("courier unavailable"),
		},
	}
	request := httptest.NewRequest(
		http.MethodPost,
		"/api/auth/recovery",
		strings.NewReader(`{"email":"person@example.com"}`),
	)
	recorder := httptest.NewRecorder()

	handler.Recovery(recorder, request)

	if recorder.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadGateway)
	}

	var body httpx.ErrorBody
	if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
		t.Fatalf("decode error body: %v", err)
	}
	if body.Code != "recovery_unavailable" {
		t.Fatalf("code = %q, want recovery_unavailable", body.Code)
	}
}

type fakeIdentityClient struct {
	recoveryErr error
}

func (f fakeIdentityClient) Register(context.Context, string, string, string, string) (*kratos.Session, error) {
	panic("not used")
}

func (f fakeIdentityClient) Login(context.Context, string, string) (*kratos.Session, error) {
	panic("not used")
}

func (f fakeIdentityClient) WhoAmI(context.Context, string) (*kratos.Session, error) {
	panic("not used")
}

func (f fakeIdentityClient) Recovery(context.Context, string) error {
	return f.recoveryErr
}

func (f fakeIdentityClient) Logout(context.Context, string) error {
	panic("not used")
}
