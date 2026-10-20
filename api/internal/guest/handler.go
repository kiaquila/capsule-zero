package guest

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/kiaquila/capsule-zero/api/internal/httpx"
)

type Store interface {
	Save(context.Context, string, Input) (Saved, error)
	Get(context.Context, string, string) (Saved, error)
	List(context.Context, string) ([]Saved, error)
	Items(context.Context, string) ([]Item, error)
	Update(context.Context, string, string, Patch) (Item, error)
}
type Handler struct {
	Repo   Store
	UserID func(context.Context) (string, bool)
}

func (h *Handler) owner(w http.ResponseWriter, r *http.Request) (string, bool) {
	if h.UserID != nil {
		if user, ok := h.UserID(r.Context()); ok {
			return user, true
		}
	}
	httpx.WriteError(w, 401, "UNAUTHENTICATED", "Authentication is required")
	return "", false
}
func respond(w http.ResponseWriter, value any, err error) {
	switch {
	case err == nil:
		httpx.WriteJSON(w, 200, value)
	case errors.Is(err, ErrValidation):
		httpx.WriteError(w, 400, "VALIDATION_ERROR", "Invalid guest progress")
	case errors.Is(err, ErrConflict):
		httpx.WriteError(w, 409, "IDEMPOTENCY_CONFLICT", "Transfer already used")
	case errors.Is(err, ErrNotFound):
		httpx.WriteError(w, 404, "NOT_FOUND", "Guest progress not found")
	default:
		httpx.WriteError(w, 500, "INTERNAL_ERROR", "Could not save guest progress")
	}
}
func (h *Handler) Save(w http.ResponseWriter, r *http.Request) {
	user, ok := h.owner(w, r)
	if !ok {
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 8192)
	var in Input
	if err := httpx.DecodeJSON(r, &in); err != nil {
		respond(w, nil, ErrValidation)
		return
	}
	if _, err := in.snapshots(); err != nil {
		respond(w, nil, err)
		return
	}
	result, err := h.Repo.Save(r.Context(), user, in)
	respond(w, result, err)
}
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	user, ok := h.owner(w, r)
	if !ok {
		return
	}
	result, err := h.Repo.List(r.Context(), user)
	respond(w, result, err)
}
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	user, ok := h.owner(w, r)
	if !ok {
		return
	}
	id := r.PathValue("id")
	if !uuidPattern.MatchString(id) {
		respond(w, nil, ErrNotFound)
		return
	}
	result, err := h.Repo.Get(r.Context(), user, id)
	respond(w, result, err)
}
func (h *Handler) Items(w http.ResponseWriter, r *http.Request) {
	user, ok := h.owner(w, r)
	if !ok {
		return
	}
	result, err := h.Repo.Items(r.Context(), user)
	respond(w, result, err)
}
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	user, ok := h.owner(w, r)
	if !ok {
		return
	}
	id := r.PathValue("id")
	if !uuidPattern.MatchString(id) {
		respond(w, nil, ErrNotFound)
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 2048)
	var patch Patch
	var fields struct {
		Status   json.RawMessage `json:"status"`
		Favorite json.RawMessage `json:"favorite"`
	}
	if err := httpx.DecodeJSON(r, &fields); err != nil {
		respond(w, nil, ErrValidation)
		return
	}
	if len(fields.Status) > 0 {
		var status string
		if httpx.IsJSONNull(fields.Status) || json.Unmarshal(fields.Status, &status) != nil {
			respond(w, nil, ErrValidation)
			return
		}
		patch.Status = &status
	}
	if len(fields.Favorite) > 0 {
		var favorite bool
		if httpx.IsJSONNull(fields.Favorite) || json.Unmarshal(fields.Favorite, &favorite) != nil {
			respond(w, nil, ErrValidation)
			return
		}
		patch.Favorite = &favorite
	}
	if !validPatch(patch) {
		respond(w, nil, ErrValidation)
		return
	}
	result, err := h.Repo.Update(r.Context(), user, id, patch)
	respond(w, result, err)
}
