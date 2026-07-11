// Package uploads owns the authenticated direct-upload lifecycle for private
// wardrobe item originals.
package uploads

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"net/http"
	"path/filepath"
	"strings"
	"unicode/utf8"

	"github.com/kiaquila/capsule-zero/api/internal/httpx"
	"github.com/kiaquila/capsule-zero/api/internal/storage"
)

const (
	maxPhotoBytes    int64 = 10 * 1024 * 1024
	maxFileNameRunes       = 255
	maxMetadataBody        = 8 * 1024
)

// Status is the durable state of a direct upload job.
type Status string

const (
	StatusQueued    Status = "queued"
	StatusCompleted Status = "completed"
)

// Job records the storage contract issued to one authenticated owner.
type Job struct {
	ID          string
	AssetID     string
	UserID      string
	ObjectKey   string
	ContentType string
	SizeBytes   int64
	Status      Status
}

// NewJob contains the immutable fields persisted at upload initialization.
type NewJob struct {
	ID          string
	AssetID     string
	UserID      string
	ObjectKey   string
	ContentType string
	SizeBytes   int64
}

// Asset is the verified private original created by a completed upload.
type Asset struct {
	ID          string
	UserID      string
	ObjectKey   string
	ContentType string
	SizeBytes   int64
	ETag        string
}

// ObjectStore is the private object-storage capability needed by uploads.
type ObjectStore interface {
	Ready(context.Context) error
	PresignPut(context.Context, storage.PutRequest) (storage.SignedRequest, error)
	Head(context.Context, string) (storage.ObjectMetadata, error)
}

// JobRepository persists owner-bound upload jobs and verified assets.
type JobRepository interface {
	Create(context.Context, NewJob) (Job, error)
	FindOwned(context.Context, string, string, string) (Job, error)
	Complete(context.Context, Job, storage.ObjectMetadata) (Asset, error)
}

// Handler serves the authenticated upload init/complete endpoints.
type Handler struct {
	Enabled bool
	Jobs    JobRepository
	Objects ObjectStore
	UserID  func(context.Context) (string, bool)
	NewID   func() string
}

// RequireEnabled rejects a disabled rollout before session resolution touches
// Kratos or the profile repository. Init/Complete keep their own checks as a
// defense-in-depth boundary when invoked outside the production router.
func (h Handler) RequireEnabled(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !h.Enabled {
			writeFeatureUnavailable(w)
			return
		}
		next(w, r)
	}
}

type initInput struct {
	FileName    string `json:"fileName"`
	ContentType string `json:"contentType"`
	SizeBytes   int64  `json:"sizeBytes"`
}

type initOutput struct {
	JobID         string            `json:"jobId"`
	AssetID       string            `json:"assetId"`
	UploadURL     string            `json:"uploadUrl"`
	UploadHeaders map[string]string `json:"uploadHeaders"`
	ExpiresAt     string            `json:"expiresAt"`
}

// Init validates metadata, verifies storage availability, presigns an opaque
// server-owned key, and only then persists the upload job.
func (h Handler) Init(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.owner(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Authentication is required")
		return
	}
	if !h.Enabled {
		writeFeatureUnavailable(w)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxMetadataBody)
	var input initInput
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid upload metadata")
		return
	}
	ext, ok := photoExtension(input)
	if !ok {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid upload metadata")
		return
	}

	jobID, assetID := h.nextID(), h.nextID()
	if jobID == "" || assetID == "" {
		httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not initialize upload")
		return
	}
	objectKey := "item-originals/" + userID + "/" + assetID + ext

	if err := h.Objects.Ready(r.Context()); err != nil {
		httpx.WriteError(w, http.StatusServiceUnavailable, "STORAGE_UNAVAILABLE", "Object storage is unavailable")
		return
	}
	signed, err := h.Objects.PresignPut(r.Context(), storage.PutRequest{
		Key: objectKey, ContentType: input.ContentType, SizeBytes: input.SizeBytes,
	})
	if err != nil {
		httpx.WriteError(w, http.StatusServiceUnavailable, "STORAGE_UNAVAILABLE", "Object storage is unavailable")
		return
	}

	job, err := h.Jobs.Create(r.Context(), NewJob{
		ID: jobID, AssetID: assetID, UserID: userID, ObjectKey: objectKey,
		ContentType: input.ContentType, SizeBytes: input.SizeBytes,
	})
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not initialize upload")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, initOutput{
		JobID: job.ID, AssetID: job.AssetID, UploadURL: signed.URL,
		UploadHeaders: signed.Headers, ExpiresAt: signed.ExpiresAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
	})
}

type completeInput struct {
	JobID   string `json:"jobId"`
	AssetID string `json:"assetId"`
}

type completeOutput struct {
	ID      string `json:"id"`
	AssetID string `json:"assetId"`
	JobType string `json:"jobType"`
	Status  Status `json:"status"`
}

// Complete verifies the uploaded object's exact metadata and atomically
// materializes one private asset. Repeating an already-completed request is a
// side-effect-free success.
func (h Handler) Complete(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.owner(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Authentication is required")
		return
	}
	if !h.Enabled {
		writeFeatureUnavailable(w)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxMetadataBody)
	var input completeInput
	if err := httpx.DecodeJSON(r, &input); err != nil ||
		!validUUID(input.JobID) || !validUUID(input.AssetID) {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid upload completion")
		return
	}

	job, err := h.Jobs.FindOwned(r.Context(), userID, input.JobID, input.AssetID)
	if errors.Is(err, ErrNotFound) {
		httpx.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Upload job not found")
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not load upload job")
		return
	}
	if job.Status == StatusCompleted {
		httpx.WriteJSON(w, http.StatusOK, completed(job))
		return
	}

	metadata, err := h.Objects.Head(r.Context(), job.ObjectKey)
	if errors.Is(err, storage.ErrNotFound) {
		httpx.WriteError(w, http.StatusConflict, "UPLOAD_INCOMPLETE", "Uploaded object is missing")
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusServiceUnavailable, "STORAGE_UNAVAILABLE", "Object storage is unavailable")
		return
	}
	if metadata.SizeBytes != job.SizeBytes || metadata.ContentType != job.ContentType {
		httpx.WriteError(w, http.StatusConflict, "UPLOAD_MISMATCH", "Uploaded object does not match the initialized upload")
		return
	}

	if _, err := h.Jobs.Complete(r.Context(), job, metadata); errors.Is(err, ErrConflict) {
		httpx.WriteError(w, http.StatusConflict, "UPLOAD_MISMATCH", "Uploaded object does not match the initialized upload")
		return
	} else if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not complete upload")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, completed(job))
}

func writeFeatureUnavailable(w http.ResponseWriter) {
	httpx.WriteError(w, http.StatusServiceUnavailable, "FEATURE_UNAVAILABLE", "Photo uploads are not enabled")
}

func validUUID(value string) bool {
	if len(value) != 36 || value[8] != '-' || value[13] != '-' || value[18] != '-' || value[23] != '-' {
		return false
	}
	compact := value[0:8] + value[9:13] + value[14:18] + value[19:23] + value[24:36]
	_, err := hex.DecodeString(compact)
	return err == nil
}

func completed(job Job) completeOutput {
	return completeOutput{ID: job.ID, AssetID: job.AssetID, JobType: "photo_upload", Status: StatusCompleted}
}

func (h Handler) owner(ctx context.Context) (string, bool) {
	if h.UserID == nil {
		return "", false
	}
	return h.UserID(ctx)
}

func (h Handler) nextID() string {
	if h.NewID != nil {
		return h.NewID()
	}
	return randomUUID()
}

func randomUUID() string {
	var bytes [16]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		return ""
	}
	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80
	encoded := hex.EncodeToString(bytes[:])
	return encoded[0:8] + "-" + encoded[8:12] + "-" + encoded[12:16] + "-" + encoded[16:20] + "-" + encoded[20:32]
}

func photoExtension(input initInput) (string, bool) {
	name := strings.TrimSpace(input.FileName)
	if name == "" || name == "." || name == ".." || filepath.Base(name) != name ||
		!utf8.ValidString(name) || utf8.RuneCountInString(name) > maxFileNameRunes ||
		strings.ContainsAny(name, `/\\`) || input.SizeBytes < 1 || input.SizeBytes > maxPhotoBytes {
		return "", false
	}
	switch input.ContentType {
	case "image/jpeg":
		return ".jpg", true
	case "image/png":
		return ".png", true
	case "image/webp":
		return ".webp", true
	default:
		return "", false
	}
}
