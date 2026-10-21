package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"sort"
	"time"

	"github.com/kiaquila/capsule-zero/api/internal/httpx"
	"github.com/kiaquila/capsule-zero/api/internal/kratos"
)

type sessionInfoDTO struct {
	ID              string     `json:"id"`
	Current         bool       `json:"current"`
	AuthenticatedAt *time.Time `json:"authenticatedAt,omitempty"`
	ExpiresAt       time.Time  `json:"expiresAt"`
}

// Sessions lists only the identity belonging to the presented token. No caller
// supplied identity or pagination URL is passed to Kratos.
func (h *Handler) Sessions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "private, no-store")
	token := bearerToken(r)
	if token == "" {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Sign in required.")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	current, err := h.Kratos.WhoAmI(ctx, token)
	var sessions []sessionInfoDTO
	if err == nil {
		var others []kratos.SessionInfo
		others, err = h.Kratos.ListSessions(ctx, token)
		if err == nil {
			sessions, err = sessionInventory(current.Info, others, time.Now())
		}
	}
	if err != nil {
		if errors.Is(err, kratos.ErrInvalidCredentials) {
			httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Sign in required.")
		} else {
			httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Session list is temporarily unavailable.")
		}
		return
	}
	httpx.WriteJSON(w, http.StatusOK, sessions)
}

func sessionInventory(current kratos.SessionInfo, others []kratos.SessionInfo, now time.Time) ([]sessionInfoDTO, error) {
	if current.ID == "" || !current.ExpiresAt.After(now) {
		return nil, fmt.Errorf("kratos sessions: missing current metadata")
	}
	result := []sessionInfoDTO{sessionSummary(current, true)}
	seen := map[string]bool{current.ID: true}
	sort.SliceStable(others, func(i, j int) bool { return others[i].AuthenticatedAt.After(others[j].AuthenticatedAt) })
	for _, session := range others {
		if !session.Active {
			continue
		}
		if session.ID == "" || session.ExpiresAt.IsZero() {
			return nil, fmt.Errorf("kratos sessions: incomplete metadata")
		}
		if seen[session.ID] || !session.ExpiresAt.After(now) {
			continue
		}
		seen[session.ID] = true
		result = append(result, sessionSummary(session, false))
	}
	return result, nil
}

func sessionSummary(session kratos.SessionInfo, current bool) sessionInfoDTO {
	result := sessionInfoDTO{ID: session.ID, Current: current, ExpiresAt: session.ExpiresAt}
	if !session.AuthenticatedAt.IsZero() {
		result.AuthenticatedAt = &session.AuthenticatedAt
	}
	return result
}
