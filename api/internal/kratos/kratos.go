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
	"time"
)

// ErrInvalidCredentials is returned when Kratos rejects a sign-in.
var ErrInvalidCredentials = errors.New("invalid email or password")

// ErrFlowRejected is returned when Kratos rejects a submitted self-service flow
// for validation or policy reasons. Transport/upstream failures use plain
// errors so handlers can classify them as temporary infrastructure failures.
var ErrFlowRejected = errors.New("kratos flow rejected")

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
}

// Session is the result of a successful registration or login.
type Session struct {
	Token     string
	Identity  Identity
	ExpiresAt time.Time
}

type flowResponse struct {
	ID string `json:"id"`
	UI struct {
		Messages []uiMessage   `json:"messages"`
		Nodes    []uiNodeField `json:"nodes"`
	} `json:"ui"`
}

type uiMessage struct {
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
	Identity Identity `json:"identity"`
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

// Recovery starts an API recovery flow for the given email. It never reveals
// whether the address exists; validation-style rejections are flattened, while
// unexpected Kratos/courier failures are returned.
func (c *Client) Recovery(ctx context.Context, email string) error {
	action, err := c.initFlow(ctx, "/self-service/recovery/api", "/self-service/recovery")
	if err != nil {
		return err
	}
	body := map[string]any{"method": "code", "email": email}
	resp, err := c.postJSON(ctx, action, body)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)
	// 200 (email sent) and 400 (validation/expired) are both non-fatal here.
	if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusBadRequest {
		return nil
	}
	return fmt.Errorf("kratos recovery: status %d", resp.StatusCode)
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
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.publicURL+initPath, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("init flow %s: status %d", initPath, resp.StatusCode)
	}
	var flow flowResponse
	if err := json.NewDecoder(resp.Body).Decode(&flow); err != nil {
		return "", err
	}
	if flow.ID == "" {
		return "", fmt.Errorf("init flow %s: empty flow id", initPath)
	}
	return fmt.Sprintf("%s%s?flow=%s", c.publicURL, submitPath, flow.ID), nil
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
			Token:     ok.SessionToken,
			Identity:  ok.identity(),
			ExpiresAt: ok.Session.ExpiresAt,
		}, nil
	}

	if resp.StatusCode == http.StatusBadRequest {
		if msg := firstError(raw); msg != "" {
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

func firstError(raw []byte) string {
	var flow flowResponse
	if err := json.Unmarshal(raw, &flow); err != nil {
		return ""
	}
	for _, m := range flow.UI.Messages {
		if m.Type == "error" && m.Text != "" {
			return m.Text
		}
	}
	for _, node := range flow.UI.Nodes {
		for _, m := range node.Messages {
			if m.Type == "error" && m.Text != "" {
				return m.Text
			}
		}
	}
	return ""
}
