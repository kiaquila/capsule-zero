// Package kratos is a thin server-side client for Ory Kratos self-service
// "API" flows (no browser redirects / CSRF). The Go API is the only caller;
// the browser never talks to Kratos directly.
package kratos

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// ErrInvalidCredentials is returned when Kratos rejects a sign-in.
var ErrInvalidCredentials = errors.New("invalid email or password")

// ErrFlowRejected is returned when Kratos rejects a submitted self-service flow
// for validation or policy reasons. Transport/upstream failures use plain
// errors so handlers can classify them as temporary infrastructure failures.
var ErrFlowRejected = errors.New("kratos flow rejected")

// ErrIdentifierExists is returned when a registration is rejected because an
// account with the submitted identifier already exists. It wraps
// ErrFlowRejected so login-style callers still collapse it into a generic
// rejection, while registration can special-case it to avoid disclosing
// account existence to unauthenticated callers (A07 account enumeration).
var ErrIdentifierExists = fmt.Errorf("%w: identifier already exists", ErrFlowRejected)

// kratosMsgIdentifierExists is the stable Kratos UI message id emitted when a
// self-service flow is rejected because the identifier is already taken
// ("An account with the same identifier(s) exists already."). Matching on the
// id keeps the classification locale-independent.
const kratosMsgIdentifierExists = 4000007

// Client talks to the Kratos public and admin APIs.
type Client struct {
	publicURL string
	adminURL  string
	http      *http.Client
}

// New builds a Kratos client.
func New(publicURL, adminURL string) *Client {
	return &Client{
		publicURL: publicURL,
		adminURL:  adminURL,
		http:      &http.Client{Timeout: 10 * time.Second},
	}
}

// Identity is the subset of a Kratos identity the API needs.
type Identity struct {
	ID     string `json:"id"`
	Traits struct {
		Email string `json:"email"`
		Name  struct {
			First string `json:"first"`
		} `json:"name"`
		Locale string `json:"locale"`
	} `json:"traits"`
	VerifiableAddresses []VerifiableAddress `json:"verifiable_addresses"`
}

// VerifiableAddress is a Kratos-managed address verification record.
type VerifiableAddress struct {
	Value    string `json:"value"`
	Via      string `json:"via"`
	Verified bool   `json:"verified"`
}

// EmailVerified reports whether every verifiable address on the identity has
// been confirmed. An identity without verifiable addresses has nothing left to
// verify, so it counts as verified rather than nagging the user forever.
func (i Identity) EmailVerified() bool {
	for _, address := range i.VerifiableAddresses {
		if !address.Verified {
			return false
		}
	}
	return true
}

// Session is the result of a successful registration or login.
type Session struct {
	Token     string
	Identity  Identity
	ExpiresAt time.Time
	// VerificationFlowID is set on registration when Kratos started an email
	// verification flow for the new address (continue_with show_verification_ui).
	// The emailed code is bound to this flow, so the UI must submit against it.
	VerificationFlowID string
}

type flowResponse struct {
	ID string `json:"id"`
	UI struct {
		Messages []uiMessage   `json:"messages"`
		Nodes    []uiNodeField `json:"nodes"`
	} `json:"ui"`
}

type uiMessage struct {
	ID   int    `json:"id"`
	Type string `json:"type"`
	Text string `json:"text"`
}

type uiNodeField struct {
	Messages []uiMessage `json:"messages"`
}

type successResponse struct {
	SessionToken string `json:"session_token"`
	Session      struct {
		ExpiresAt time.Time `json:"expires_at"`
		Identity  Identity  `json:"identity"`
	} `json:"session"`
	// Top-level identity is present on registration; on login the identity is
	// only nested under session.identity.
	Identity     Identity       `json:"identity"`
	ContinueWith []continueWith `json:"continue_with"`
}

// continueWith is a Kratos post-flow instruction ("what the client should do
// next"): a session token to adopt, or a follow-up flow to show.
type continueWith struct {
	Action          string `json:"action"`
	OrySessionToken string `json:"ory_session_token"`
	Flow            struct {
		ID string `json:"id"`
	} `json:"flow"`
}

// verificationFlowID extracts the show_verification_ui follow-up flow id, if any.
func verificationFlowID(items []continueWith) string {
	for _, item := range items {
		if item.Action == "show_verification_ui" {
			return item.Flow.ID
		}
	}
	return ""
}

// sessionTokenFromContinueWith extracts the set_ory_session_token token, if any.
func sessionTokenFromContinueWith(items []continueWith) string {
	for _, item := range items {
		if item.Action == "set_ory_session_token" {
			return item.OrySessionToken
		}
	}
	return ""
}

// identity returns the populated identity, preferring the top-level field and
// falling back to the one nested in the session.
func (s successResponse) identity() Identity {
	if s.Identity.ID != "" {
		return s.Identity
	}
	return s.Session.Identity
}

// Register drives an API registration flow. A `session` hook in kratos.yml
// means a successful sign-up returns a session token (auto-login). name and
// locale are optional.
func (c *Client) Register(ctx context.Context, email, password, name, locale string) (*Session, error) {
	action, err := c.initFlow(ctx, "/self-service/registration/api", "/self-service/registration")
	if err != nil {
		return nil, err
	}

	traits := map[string]any{"email": email}
	if name != "" {
		traits["name"] = map[string]any{"first": name}
	}
	if locale != "" {
		traits["locale"] = locale
	}

	body := map[string]any{
		"method":   "password",
		"password": password,
		"traits":   traits,
	}
	return c.submitForSession(ctx, action, body)
}

// Login drives an API login flow with password credentials.
func (c *Client) Login(ctx context.Context, email, password string) (*Session, error) {
	action, err := c.initFlow(ctx, "/self-service/login/api", "/self-service/login")
	if err != nil {
		return nil, err
	}
	body := map[string]any{
		"method":     "password",
		"identifier": email,
		"password":   password,
	}
	session, err := c.submitForSession(ctx, action, body)
	if errors.Is(err, ErrFlowRejected) {
		return nil, ErrInvalidCredentials
	}
	return session, err
}

// WhoAmI validates a session token and returns the identity plus expiry.
func (c *Client) WhoAmI(ctx context.Context, token string) (*Session, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.publicURL+"/sessions/whoami", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Session-Token", token)
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		return nil, ErrInvalidCredentials
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("kratos whoami: status %d", resp.StatusCode)
	}

	var out struct {
		Identity  Identity  `json:"identity"`
		ExpiresAt time.Time `json:"expires_at"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return &Session{Token: token, Identity: out.Identity, ExpiresAt: out.ExpiresAt}, nil
}

// RecoveryStart begins a code-method recovery flow for the given email and
// returns the flow id (recovery codes are bound to their flow, so completion
// must submit against the same flow). It never reveals whether the address
// exists: 200 (email sent) and validation-style 400s both resolve to the flow
// id, while unexpected Kratos/courier failures are returned as errors.
func (c *Client) RecoveryStart(ctx context.Context, email string) (string, error) {
	return c.startCodeFlow(ctx, "/self-service/recovery", email)
}

// RecoveryComplete submits the emailed one-time code, adopts the recovery
// session Kratos hands back (continue_with), and sets the new password via
// the settings flow. The returned session is fully logged in.
func (c *Client) RecoveryComplete(ctx context.Context, flowID, code, newPassword string) (*Session, error) {
	action := fmt.Sprintf("%s/self-service/recovery?flow=%s", c.publicURL, url.QueryEscape(flowID))
	resp, err := c.postJSON(ctx, action, map[string]any{"method": "code", "code": code})
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	switch resp.StatusCode {
	case http.StatusOK:
		// proceed below
	case http.StatusBadRequest, http.StatusGone, http.StatusUnprocessableEntity:
		if _, msg := firstError(raw); msg != "" {
			return nil, fmt.Errorf("%w: %s", ErrFlowRejected, msg)
		}
		return nil, ErrFlowRejected
	default:
		return nil, fmt.Errorf("kratos recovery complete: status %d", resp.StatusCode)
	}

	var ok struct {
		ContinueWith []continueWith `json:"continue_with"`
	}
	if err := json.Unmarshal(raw, &ok); err != nil {
		return nil, err
	}
	token := sessionTokenFromContinueWith(ok.ContinueWith)
	if token == "" {
		return nil, errors.New("kratos recovery complete: no session token in continue_with")
	}

	if err := c.SettingsPassword(ctx, token, newPassword); err != nil {
		return nil, err
	}
	return c.WhoAmI(ctx, token)
}

// VerificationStart begins (or restarts) a code-method verification flow for
// the given email and returns the flow id. Account-enumeration safe like
// RecoveryStart.
func (c *Client) VerificationStart(ctx context.Context, email string) (string, error) {
	return c.startCodeFlow(ctx, "/self-service/verification", email)
}

// VerificationComplete submits the emailed verification code against its flow.
func (c *Client) VerificationComplete(ctx context.Context, flowID, code string) error {
	action := fmt.Sprintf("%s/self-service/verification?flow=%s", c.publicURL, url.QueryEscape(flowID))
	resp, err := c.postJSON(ctx, action, map[string]any{"method": "code", "code": code})
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	switch resp.StatusCode {
	case http.StatusOK:
		return nil
	case http.StatusBadRequest, http.StatusGone, http.StatusUnprocessableEntity:
		if _, msg := firstError(raw); msg != "" {
			return fmt.Errorf("%w: %s", ErrFlowRejected, msg)
		}
		return ErrFlowRejected
	default:
		return fmt.Errorf("kratos verification complete: status %d", resp.StatusCode)
	}
}

// SettingsPassword sets a new password through the settings flow bound to the
// given session token. Callers hand in a *fresh* session (recovery follow-up
// or a re-authenticated login), so the privileged-session window is never an
// issue here.
func (c *Client) SettingsPassword(ctx context.Context, token, newPassword string) error {
	action, err := c.initFlowWithToken(ctx, "/self-service/settings/api", "/self-service/settings", token)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, action,
		bytes.NewReader(mustJSON(map[string]any{"method": "password", "password": newPassword})))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("X-Session-Token", token)
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	switch resp.StatusCode {
	case http.StatusOK:
		return nil
	case http.StatusBadRequest, http.StatusForbidden, http.StatusUnprocessableEntity:
		// 400: password policy rejection; 403: privileged session required.
		if _, msg := firstError(raw); msg != "" {
			return fmt.Errorf("%w: %s", ErrFlowRejected, msg)
		}
		return ErrFlowRejected
	default:
		return fmt.Errorf("kratos settings password: status %d", resp.StatusCode)
	}
}

// startCodeFlow inits a recovery/verification API flow and submits the email
// with the code method. 200 and validation-style 400s both return the flow id
// so callers stay account-enumeration safe.
func (c *Client) startCodeFlow(ctx context.Context, basePath, email string) (string, error) {
	action, flowID, err := c.initFlowID(ctx, basePath+"/api", basePath, "")
	if err != nil {
		return "", err
	}
	resp, err := c.postJSON(ctx, action, map[string]any{"method": "code", "email": email})
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)
	if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusBadRequest {
		return flowID, nil
	}
	return "", fmt.Errorf("kratos %s start: status %d", basePath, resp.StatusCode)
}

// Logout revokes the session bound to the given token.
func (c *Client) Logout(ctx context.Context, token string) error {
	body, _ := json.Marshal(map[string]any{"session_token": token})
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete,
		c.publicURL+"/self-service/logout/api", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		if resp.StatusCode == http.StatusBadRequest ||
			resp.StatusCode == http.StatusUnauthorized ||
			resp.StatusCode == http.StatusForbidden ||
			resp.StatusCode == http.StatusNotFound {
			return ErrInvalidCredentials
		}
		return fmt.Errorf("kratos logout: status %d", resp.StatusCode)
	}
	return nil
}

// Ready probes Kratos readiness for the health endpoint.
func (c *Client) Ready(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.publicURL+"/health/ready", nil)
	if err != nil {
		return err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("kratos not ready: status %d", resp.StatusCode)
	}
	return nil
}

// initFlow creates a self-service flow and returns the submit URL built from
// the client's own internal Kratos base URL plus the flow id. We deliberately
// do NOT use the `ui.action` URL Kratos returns: that URL is rendered against
// Kratos's configured public base_url (which points at the browser-facing host,
// e.g. 127.0.0.1:4433), and would be unreachable — or wrong — from inside the
// API container. submitPath is the flow's submit endpoint (without `/api`).
func (c *Client) initFlow(ctx context.Context, initPath, submitPath string) (string, error) {
	action, _, err := c.initFlowID(ctx, initPath, submitPath, "")
	return action, err
}

// initFlowWithToken is initFlow for flows that require an authenticated
// session (settings): the session token rides along on the init request.
func (c *Client) initFlowWithToken(ctx context.Context, initPath, submitPath, token string) (string, error) {
	action, _, err := c.initFlowID(ctx, initPath, submitPath, token)
	return action, err
}

// initFlowID creates a self-service flow and returns both the submit URL and
// the flow id (needed where a follow-up call must reference the same flow).
func (c *Client) initFlowID(ctx context.Context, initPath, submitPath, token string) (string, string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.publicURL+initPath, nil)
	if err != nil {
		return "", "", err
	}
	req.Header.Set("Accept", "application/json")
	if token != "" {
		req.Header.Set("X-Session-Token", token)
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("init flow %s: status %d", initPath, resp.StatusCode)
	}
	var flow flowResponse
	if err := json.NewDecoder(resp.Body).Decode(&flow); err != nil {
		return "", "", err
	}
	if flow.ID == "" {
		return "", "", fmt.Errorf("init flow %s: empty flow id", initPath)
	}
	action := fmt.Sprintf("%s%s?flow=%s", c.publicURL, submitPath, url.QueryEscape(flow.ID))
	return action, flow.ID, nil
}

// mustJSON marshals a body that cannot fail (map of encodable values).
func mustJSON(body map[string]any) []byte {
	encoded, err := json.Marshal(body)
	if err != nil {
		panic(err)
	}
	return encoded
}

func (c *Client) submitForSession(ctx context.Context, action string, body map[string]any) (*Session, error) {
	resp, err := c.postJSON(ctx, action, body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode == http.StatusOK {
		var ok successResponse
		if err := json.Unmarshal(raw, &ok); err != nil {
			return nil, err
		}
		if ok.SessionToken == "" {
			// Registration succeeded but a hook (e.g. required verification)
			// withheld the session: caller treats this as "confirm your email".
			return nil, nil
		}
		return &Session{
			Token:              ok.SessionToken,
			Identity:           ok.identity(),
			ExpiresAt:          ok.Session.ExpiresAt,
			VerificationFlowID: verificationFlowID(ok.ContinueWith),
		}, nil
	}

	if resp.StatusCode == http.StatusBadRequest {
		id, msg := firstError(raw)
		if id == kratosMsgIdentifierExists {
			return nil, ErrIdentifierExists
		}
		if msg != "" {
			return nil, fmt.Errorf("%w: %s", ErrFlowRejected, msg)
		}
		return nil, ErrFlowRejected
	}

	return nil, fmt.Errorf("kratos submit: status %d", resp.StatusCode)
}

func (c *Client) postJSON(ctx context.Context, url string, body map[string]any) (*http.Response, error) {
	encoded, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(encoded))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	return c.http.Do(req)
}

// firstError returns the id and text of the first error-level message in a
// rejected flow response, scanning top-level messages before per-field node
// messages. The id lets callers classify well-known rejections (e.g. duplicate
// identifier) without matching on localized text.
func firstError(raw []byte) (int, string) {
	var flow flowResponse
	if err := json.Unmarshal(raw, &flow); err != nil {
		return 0, ""
	}
	for _, m := range flow.UI.Messages {
		if m.Type == "error" && m.Text != "" {
			return m.ID, m.Text
		}
	}
	for _, node := range flow.UI.Nodes {
		for _, m := range node.Messages {
			if m.Type == "error" && m.Text != "" {
				return m.ID, m.Text
			}
		}
	}
	return 0, ""
}
