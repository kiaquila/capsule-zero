package kratos

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// SessionInfo is the allowlisted inventory metadata. It deliberately excludes
// identity traits, tokens and devices (server-mediated connections).
type SessionInfo struct {
	ID              string    `json:"id"`
	Active          bool      `json:"active"`
	AuthenticatedAt time.Time `json:"authenticated_at"`
	ExpiresAt       time.Time `json:"expires_at"`
}

// ListSessions returns all OTHER active sessions. Kratos excludes the session
// authenticating this call; callers must add WhoAmI for a complete inventory.
func (c *Client) ListSessions(ctx context.Context, token string) ([]SessionInfo, error) {
	query := "per_page=100"
	seen := make(map[string]bool)
	sessions := make([]SessionInfo, 0)
	for page := 0; page < 20; page++ {
		if seen[query] {
			return nil, fmt.Errorf("kratos sessions: pagination cycle")
		}
		seen[query] = true
		batch, next, err := c.sessionPage(ctx, token, query)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, batch...)
		if next == "" {
			return sessions, nil
		}
		query = next
	}
	return nil, fmt.Errorf("kratos sessions: pagination budget exceeded")
}

func (c *Client) sessionPage(ctx context.Context, token, query string) ([]SessionInfo, string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.publicURL+"/sessions?"+query, nil)
	if err != nil {
		return nil, "", err
	}
	req.Header.Set("X-Session-Token", token)
	req.Header.Set("Accept", "application/json")
	// Never forward the credential through a redirect, even on the fixed endpoint.
	client := *c.http
	client.CheckRedirect = func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }
	resp, err := client.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusUnauthorized {
		return nil, "", ErrInvalidCredentials
	}
	if resp.StatusCode != http.StatusOK {
		return nil, "", fmt.Errorf("kratos sessions: status %d", resp.StatusCode)
	}
	var sessions []SessionInfo
	if err := json.NewDecoder(io.LimitReader(resp.Body, 2<<20)).Decode(&sessions); err != nil {
		return nil, "", err
	}
	// v26.2.0 emits an optimistic next Link for total=0. Only a decoded
	// empty page plus an explicit zero count confirms that there are no others.
	if len(sessions) == 0 && resp.Header.Get("X-Total-Count") == "0" {
		return sessions, "", nil
	}
	next, err := nextSessionPage(resp.Header.Values("Link"))
	return sessions, next, err
}

func nextSessionPage(headers []string) (string, error) {
	for _, link := range strings.Split(strings.Join(headers, ","), ",") {
		target, attrs, found := strings.Cut(link, ";")
		if !found {
			continue
		}
		next := false
		for _, attr := range strings.Split(attrs, ";") {
			key, value, ok := strings.Cut(strings.TrimSpace(attr), "=")
			if ok && key == "rel" {
				for _, rel := range strings.Fields(strings.Trim(value, `"`)) {
					next = next || rel == "next"
				}
			}
		}
		if !next {
			continue
		}
		target = strings.TrimSpace(target)
		if !strings.HasPrefix(target, "<") || !strings.HasSuffix(target, ">") {
			return "", fmt.Errorf("kratos sessions: invalid next link")
		}
		parsed, err := url.Parse(strings.TrimSuffix(strings.TrimPrefix(target, "<"), ">"))
		if err != nil {
			return "", fmt.Errorf("kratos sessions: invalid next URL")
		}
		params, err := url.ParseQuery(parsed.RawQuery)
		if err != nil || len(params) == 0 {
			return "", fmt.Errorf("kratos sessions: missing next page")
		}
		for key := range params {
			if key != "page" && key != "per_page" && key != "page_token" && key != "page_size" {
				return "", fmt.Errorf("kratos sessions: unexpected pagination parameter")
			}
		}
		// Copy query values only. The next-link host/path never receives our token.
		return params.Encode(), nil
	}
	return "", nil
}
