package kratos

// Native-app OIDC flow (spec 037, Google sign-in). The Go API — not the
// browser — creates the login flow and asks Kratos for a session-token
// exchange code; the browser only visits the provider's consent screen and
// the single exposed Kratos callback. After the callback redirects to the
// app with a return_to code, the API exchanges both codes for the same
// token-based Session every other auth flow returns. Split from kratos.go
// to keep that file inside the module-size soft gate.

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// OIDCStart creates an API login flow with a session-token exchange code and
// submits the oidc method for the given provider. It returns the provider
// consent URL the browser must visit and the exchange (init) code the caller
// must present again at OIDCExchange.
func (c *Client) OIDCStart(ctx context.Context, provider, returnTo string) (string, string, error) {
	initURL := fmt.Sprintf(
		"%s/self-service/login/api?return_session_token_exchange_code=true&return_to=%s",
		c.publicURL, url.QueryEscape(returnTo))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, initURL, nil)
	if err != nil {
		return "", "", err
	}
	req.Header.Set("Accept", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("oidc init flow: status %d", resp.StatusCode)
	}

	var flow struct {
		ID           string `json:"id"`
		ExchangeCode string `json:"session_token_exchange_code"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&flow); err != nil {
		return "", "", err
	}
	if flow.ID == "" {
		return "", "", errors.New("oidc init flow: empty flow id")
	}
	if flow.ExchangeCode == "" {
		// Without the exchange code the loop cannot complete — fail here
		// instead of stranding the user after the consent screen.
		return "", "", errors.New("oidc init flow: no session_token_exchange_code")
	}

	redirectURL, err := c.submitOIDC(ctx, flow.ID, provider)
	if err != nil {
		return "", "", err
	}
	return redirectURL, flow.ExchangeCode, nil
}

// submitOIDC posts the oidc method to the login flow and extracts the
// browser redirect target Kratos answers with (422 browser_location_change_required).
func (c *Client) submitOIDC(ctx context.Context, flowID, provider string) (string, error) {
	action := fmt.Sprintf("%s/self-service/login?flow=%s", c.publicURL, url.QueryEscape(flowID))
	resp, err := c.postJSON(ctx, action, map[string]any{"method": "oidc", "provider": provider})
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	switch resp.StatusCode {
	case http.StatusUnprocessableEntity:
		var out struct {
			RedirectBrowserTo string `json:"redirect_browser_to"`
		}
		if err := json.Unmarshal(raw, &out); err != nil {
			return "", err
		}
		if out.RedirectBrowserTo == "" {
			return "", errors.New("oidc submit: 422 without redirect_browser_to")
		}
		return out.RedirectBrowserTo, nil
	case http.StatusBadRequest:
		if _, msg := firstError(raw); msg != "" {
			return "", fmt.Errorf("%w: %s", ErrFlowRejected, msg)
		}
		return "", ErrFlowRejected
	default:
		return "", fmt.Errorf("oidc submit: status %d", resp.StatusCode)
	}
}

// OIDCExchange trades the init code (from OIDCStart) plus the return_to code
// (appended by Kratos to the callback redirect) for a session token. Wrong,
// expired, or already-consumed code pairs collapse into ErrInvalidCredentials
// so the handler can reject them without issuing a session.
func (c *Client) OIDCExchange(ctx context.Context, initCode, returnToCode string) (*Session, error) {
	exchangeURL := fmt.Sprintf(
		"%s/sessions/token-exchange?init_code=%s&return_to_code=%s",
		c.publicURL, url.QueryEscape(initCode), url.QueryEscape(returnToCode))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, exchangeURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK:
		// proceed below
	case http.StatusBadRequest, http.StatusForbidden, http.StatusNotFound, http.StatusGone:
		_, _ = io.Copy(io.Discard, resp.Body)
		return nil, ErrInvalidCredentials
	default:
		_, _ = io.Copy(io.Discard, resp.Body)
		return nil, fmt.Errorf("oidc token exchange: status %d", resp.StatusCode)
	}

	var out struct {
		SessionToken string `json:"session_token"`
		Session      struct {
			ExpiresAt time.Time `json:"expires_at"`
			Identity  Identity  `json:"identity"`
		} `json:"session"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	if out.SessionToken == "" {
		return nil, errors.New("oidc token exchange: no session token")
	}
	return &Session{
		Token:     out.SessionToken,
		Identity:  out.Session.Identity,
		ExpiresAt: out.Session.ExpiresAt,
	}, nil
}
