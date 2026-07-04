package auth

// Spec 035 (auth completion slice) — failing-first handler tests for the
// recovery/verification completion endpoints and the session-bound password
// change. Happy paths that require the profile repository (respondWithSession)
// are covered by the kratos client tests plus the full-stack verification in
// plan.md rows 6-9.

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/kiaquila/capsule-zero/api/internal/httpx"
	"github.com/kiaquila/capsule-zero/api/internal/kratos"
)

func sessionWithEmail(token, email string) *kratos.Session {
	session := &kratos.Session{Token: token}
	session.Identity.ID = "identity-1"
	session.Identity.Traits.Email = email
	return session
}

func decodeJSONBody(t *testing.T, recorder *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	var body map[string]any
	if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	return body
}

func decodeErrorBody(t *testing.T, recorder *httptest.ResponseRecorder) httpx.ErrorBody {
	t.Helper()
	var body httpx.ErrorBody
	if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
		t.Fatalf("decode error body: %v", err)
	}
	return body
}

func TestRecoveryReturnsFlowID(t *testing.T) {
	handler := Handler{Kratos: fakeIdentityClient{recoveryFlowID: "rec-flow-9"}}
	request := httptest.NewRequest(http.MethodPost, "/api/auth/recovery",
		strings.NewReader(`{"email":"person@example.com"}`))
	recorder := httptest.NewRecorder()

	handler.Recovery(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", recorder.Code)
	}
	body := decodeJSONBody(t, recorder)
	if body["delivery"] != "email" || body["email"] != "person@example.com" {
		t.Fatalf("body = %v", body)
	}
	if body["flowId"] != "rec-flow-9" {
		t.Fatalf("flowId = %v, want rec-flow-9", body["flowId"])
	}
}

func TestRecoveryCompleteRejectsInvalidCode(t *testing.T) {
	handler := Handler{Kratos: fakeIdentityClient{
		recoveryCompleteErr: fmt.Errorf("%w: the recovery code is invalid", kratos.ErrFlowRejected),
	}}
	request := httptest.NewRequest(http.MethodPost, "/api/auth/recovery/complete",
		strings.NewReader(`{"flowId":"rec-flow-9","code":"000000","newPassword":"NewSecret456"}`))
	recorder := httptest.NewRecorder()

	handler.RecoveryComplete(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", recorder.Code)
	}
	// Machine-readable code: the web client maps it to a localized message.
	if body := decodeErrorBody(t, recorder); body.Error.Code != "INVALID_CODE" {
		t.Fatalf("code = %q, want INVALID_CODE", body.Error.Code)
	}
}

func TestRecoveryCompleteRejectsWeakPassword(t *testing.T) {
	handler := Handler{Kratos: fakeIdentityClient{}}
	request := httptest.NewRequest(http.MethodPost, "/api/auth/recovery/complete",
		strings.NewReader(`{"flowId":"rec-flow-9","code":"123456","newPassword":"short"}`))
	recorder := httptest.NewRecorder()

	handler.RecoveryComplete(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", recorder.Code)
	}
	if body := decodeErrorBody(t, recorder); body.Error.Code != "VALIDATION_ERROR" {
		t.Fatalf("code = %q, want VALIDATION_ERROR", body.Error.Code)
	}
}

func TestRecoveryCompleteMapsPasswordPolicyRejectionToValidation(t *testing.T) {
	handler := Handler{Kratos: fakeIdentityClient{
		recoveryCompleteErr: fmt.Errorf("%w: password must not contain the identifier", kratos.ErrPasswordRejected),
	}}
	request := httptest.NewRequest(http.MethodPost, "/api/auth/recovery/complete",
		strings.NewReader(`{"flowId":"rec-flow-9","code":"123456","newPassword":"person@example.com123"}`))
	recorder := httptest.NewRecorder()

	handler.RecoveryComplete(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", recorder.Code)
	}
	if body := decodeErrorBody(t, recorder); body.Error.Code != "VALIDATION_ERROR" {
		t.Fatalf("code = %q, want VALIDATION_ERROR", body.Error.Code)
	}
}

func TestRecoveryCompleteUpstreamFailureIs502(t *testing.T) {
	handler := Handler{Kratos: fakeIdentityClient{
		recoveryCompleteErr: errors.New("kratos unavailable"),
	}}
	request := httptest.NewRequest(http.MethodPost, "/api/auth/recovery/complete",
		strings.NewReader(`{"flowId":"rec-flow-9","code":"123456","newPassword":"NewSecret456"}`))
	recorder := httptest.NewRecorder()

	handler.RecoveryComplete(recorder, request)

	if recorder.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want 502", recorder.Code)
	}
}

func TestVerificationStartReturnsFlowID(t *testing.T) {
	handler := Handler{Kratos: fakeIdentityClient{verificationFlowID: "ver-flow-3"}}
	request := httptest.NewRequest(http.MethodPost, "/api/auth/verification",
		strings.NewReader(`{"email":"person@example.com"}`))
	recorder := httptest.NewRecorder()

	handler.VerificationStart(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", recorder.Code)
	}
	body := decodeJSONBody(t, recorder)
	if body["delivery"] != "email" || body["flowId"] != "ver-flow-3" {
		t.Fatalf("body = %v", body)
	}
}

func TestVerificationCompleteStatusMapping(t *testing.T) {
	tests := []struct {
		name       string
		err        error
		wantStatus int
		wantCode   string
	}{
		{name: "valid code succeeds", err: nil, wantStatus: http.StatusOK},
		{
			name:       "invalid code carries its machine code",
			err:        fmt.Errorf("%w: the verification code is invalid", kratos.ErrFlowRejected),
			wantStatus: http.StatusBadRequest,
			wantCode:   "INVALID_CODE",
		},
		{
			name:       "upstream failure is temporary server error",
			err:        errors.New("kratos unavailable"),
			wantStatus: http.StatusBadGateway,
			wantCode:   "INTERNAL_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := Handler{Kratos: fakeIdentityClient{verificationCompleteErr: tt.err}}
			request := httptest.NewRequest(http.MethodPost, "/api/auth/verification/complete",
				strings.NewReader(`{"flowId":"ver-flow-3","code":"123456"}`))
			recorder := httptest.NewRecorder()

			handler.VerificationComplete(recorder, request)

			if recorder.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", recorder.Code, tt.wantStatus)
			}
			if tt.wantStatus == http.StatusOK {
				if body := decodeJSONBody(t, recorder); body["ok"] != true {
					t.Fatalf("body = %v, want ok:true", body)
				}
				return
			}
			if body := decodeErrorBody(t, recorder); body.Error.Code != tt.wantCode {
				t.Fatalf("code = %q, want %q", body.Error.Code, tt.wantCode)
			}
		})
	}
}

func TestPasswordChangeRequiresSession(t *testing.T) {
	handler := Handler{Kratos: fakeIdentityClient{whoamiErr: kratos.ErrInvalidCredentials}}

	for _, withToken := range []bool{false, true} {
		request := httptest.NewRequest(http.MethodPost, "/api/auth/password",
			strings.NewReader(`{"currentPassword":"SuperSecret123","newPassword":"NewSecret456"}`))
		if withToken {
			request.Header.Set("Authorization", "Bearer expired-token")
		}
		recorder := httptest.NewRecorder()

		handler.ChangePassword(recorder, request)

		if recorder.Code != http.StatusUnauthorized {
			t.Fatalf("withToken=%v: status = %d, want 401", withToken, recorder.Code)
		}
	}
}

func TestPasswordChangeRejectsWrongCurrentPassword(t *testing.T) {
	handler := Handler{Kratos: fakeIdentityClient{
		whoamiSession: sessionWithEmail("session-token", "person@example.com"),
		loginErr:      kratos.ErrInvalidCredentials,
	}}
	request := httptest.NewRequest(http.MethodPost, "/api/auth/password",
		strings.NewReader(`{"currentPassword":"WrongPass123","newPassword":"NewSecret456"}`))
	request.Header.Set("Authorization", "Bearer session-token")
	recorder := httptest.NewRecorder()

	handler.ChangePassword(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", recorder.Code)
	}
	if body := decodeErrorBody(t, recorder); body.Error.Code != "INVALID_CURRENT_PASSWORD" {
		t.Fatalf("code = %q, want INVALID_CURRENT_PASSWORD", body.Error.Code)
	}
}

func TestPasswordChangeRejectsWeakNewPassword(t *testing.T) {
	handler := Handler{Kratos: fakeIdentityClient{
		whoamiSession: sessionWithEmail("session-token", "person@example.com"),
	}}
	request := httptest.NewRequest(http.MethodPost, "/api/auth/password",
		strings.NewReader(`{"currentPassword":"SuperSecret123","newPassword":"short"}`))
	request.Header.Set("Authorization", "Bearer session-token")
	recorder := httptest.NewRecorder()

	handler.ChangePassword(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", recorder.Code)
	}
}

func TestPasswordChangeSubmitsSettingsWithFreshSession(t *testing.T) {
	calls := &[][2]string{}
	handler := Handler{Kratos: fakeIdentityClient{
		whoamiSession:         sessionWithEmail("aged-token", "person@example.com"),
		loginSession:          sessionWithEmail("fresh-token", "person@example.com"),
		settingsPasswordCalls: calls,
	}}
	request := httptest.NewRequest(http.MethodPost, "/api/auth/password",
		strings.NewReader(`{"currentPassword":"SuperSecret123","newPassword":"NewSecret456"}`))
	request.Header.Set("Authorization", "Bearer aged-token")
	recorder := httptest.NewRecorder()

	handler.ChangePassword(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", recorder.Code, recorder.Body.String())
	}
	if body := decodeJSONBody(t, recorder); body["ok"] != true {
		t.Fatalf("body = %v, want ok:true", body)
	}
	if len(*calls) != 1 {
		t.Fatalf("settings password calls = %d, want 1", len(*calls))
	}
	if got := (*calls)[0]; got[0] != "fresh-token" || got[1] != "NewSecret456" {
		t.Fatalf("settings call = %v, want fresh-token + NewSecret456", got)
	}
}
