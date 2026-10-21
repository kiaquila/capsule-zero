package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"sort"
	"strings"
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

var sessionIDPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

func (h *Handler) RevokeSession(w http.ResponseWriter, r *http.Request) {
	h.revokeSessions(w, r, false)
}

func (h *Handler) RevokeOtherSessions(w http.ResponseWriter, r *http.Request) {
	h.revokeSessions(w, r, true)
}

func (h *Handler) revokeSessions(w http.ResponseWriter, r *http.Request, bulk bool) {
	w.Header().Set("Cache-Control", "private, no-store")
	token := bearerToken(r)
	if token == "" {
		writeSessionRevocationError(w, kratos.ErrInvalidCredentials)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	current, err := h.Kratos.WhoAmI(ctx, token)
	if err != nil {
		writeSessionRevocationError(w, err)
		return
	}
	if current == nil || current.Info.ID == "" || !current.Info.ExpiresAt.After(time.Now()) {
		writeSessionRevocationError(w, fmt.Errorf("kratos current metadata missing"))
		return
	}
	if bulk {
		err = h.Kratos.RevokeOtherSessions(ctx, token)
	} else {
		id := r.PathValue("id")
		if !sessionIDPattern.MatchString(id) || strings.EqualFold(id, current.Info.ID) {
			writeSessionRevocationError(w, kratos.ErrSessionTargetInvalid)
			return
		}
		err = h.Kratos.RevokeSession(ctx, token, id)
	}
	if err != nil {
		writeSessionRevocationError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeSessionRevocationError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, kratos.ErrInvalidCredentials):
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Sign in required.")
	case errors.Is(err, kratos.ErrSessionTargetInvalid):
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Choose another session. Use sign out to end the current session.")
	case errors.Is(err, kratos.ErrSessionNotFound):
		httpx.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Session not found.")
	default:
		httpx.WriteError(w, http.StatusBadGateway, "INTERNAL_ERROR", "Session could not be ended. Try again.")
	}
}
