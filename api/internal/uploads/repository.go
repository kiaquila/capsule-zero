package uploads

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kiaquila/capsule-zero/api/internal/storage"
)

var (
	// ErrNotFound hides absent and cross-owner upload jobs behind one result.
	ErrNotFound = errors.New("upload job not found")
	// ErrConflict marks durable metadata that conflicts with the initialized upload.
	ErrConflict = errors.New("upload metadata conflict")
)

// Repo is the PostgreSQL upload-job and private-asset repository.
type Repo struct {
	pool *pgxpool.Pool
}

// NewRepo builds a PostgreSQL uploads repository.
func NewRepo(pool *pgxpool.Pool) *Repo {
	return &Repo{pool: pool}
}

// Create persists a queued job after its signed request has been prepared.
func (r *Repo) Create(ctx context.Context, input NewJob) (Job, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO upload_jobs (
			id, asset_id, user_id, object_key, content_type, size_bytes, status
		) VALUES ($1, $2, $3, $4, $5, $6, 'queued')
		RETURNING id, asset_id, user_id, object_key, content_type, size_bytes, status`,
		input.ID, input.AssetID, input.UserID, input.ObjectKey, input.ContentType, input.SizeBytes)
	job, err := scanJob(row)
	if err != nil {
		return Job{}, fmt.Errorf("create upload job: %w", err)
	}
	return job, nil
}

// FindOwned loads a job only when all public identifiers and its owner match.
func (r *Repo) FindOwned(ctx context.Context, userID, jobID, assetID string) (Job, error) {
	job, err := scanJob(r.pool.QueryRow(ctx, `
		SELECT id, asset_id, user_id, object_key, content_type, size_bytes, status
		FROM upload_jobs
		WHERE user_id = $1 AND id = $2 AND asset_id = $3`, userID, jobID, assetID))
	if errors.Is(err, pgx.ErrNoRows) {
		return Job{}, ErrNotFound
	}
	if err != nil {
		return Job{}, fmt.Errorf("find owned upload job: %w", err)
	}
	return job, nil
}

// Complete locks the durable job, rechecks exact metadata, and commits the
// asset insert and status transition together. A concurrent/repeated caller
// observes the existing completed asset.
func (r *Repo) Complete(ctx context.Context, expected Job, metadata storage.ObjectMetadata) (Asset, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return Asset{}, fmt.Errorf("begin upload completion: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	job, err := scanJob(tx.QueryRow(ctx, `
		SELECT id, asset_id, user_id, object_key, content_type, size_bytes, status
		FROM upload_jobs
		WHERE user_id = $1 AND id = $2 AND asset_id = $3
		FOR UPDATE`, expected.UserID, expected.ID, expected.AssetID))
	if errors.Is(err, pgx.ErrNoRows) {
		return Asset{}, ErrNotFound
	}
	if err != nil {
		return Asset{}, fmt.Errorf("lock upload job: %w", err)
	}
	if job.Status == StatusCompleted {
		asset, err := findAsset(ctx, tx, job.UserID, job.AssetID)
		if err != nil {
			return Asset{}, err
		}
		if err := tx.Commit(ctx); err != nil {
			return Asset{}, fmt.Errorf("commit repeated upload completion: %w", err)
		}
		return asset, nil
	}
	if job.ObjectKey != expected.ObjectKey || job.ContentType != expected.ContentType ||
		job.SizeBytes != expected.SizeBytes || metadata.ContentType != job.ContentType || metadata.SizeBytes != job.SizeBytes {
		return Asset{}, ErrConflict
	}

	asset, err := scanAsset(tx.QueryRow(ctx, `
		INSERT INTO item_assets (id, user_id, object_key, content_type, size_bytes, etag)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, user_id, object_key, content_type, size_bytes, etag`,
		job.AssetID, job.UserID, job.ObjectKey, metadata.ContentType, metadata.SizeBytes, metadata.ETag))
	if err != nil {
		return Asset{}, fmt.Errorf("create item asset: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		UPDATE upload_jobs
		SET status = 'completed', completed_at = now(), updated_at = now()
		WHERE id = $1`, job.ID); err != nil {
		return Asset{}, fmt.Errorf("mark upload completed: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return Asset{}, fmt.Errorf("commit upload completion: %w", err)
	}
	return asset, nil
}

func findAsset(ctx context.Context, tx pgx.Tx, userID, assetID string) (Asset, error) {
	asset, err := scanAsset(tx.QueryRow(ctx, `
		SELECT id, user_id, object_key, content_type, size_bytes, etag
		FROM item_assets WHERE user_id = $1 AND id = $2`, userID, assetID))
	if errors.Is(err, pgx.ErrNoRows) {
		return Asset{}, fmt.Errorf("completed upload asset missing")
	}
	if err != nil {
		return Asset{}, fmt.Errorf("find completed item asset: %w", err)
	}
	return asset, nil
}

type scanner interface {
	Scan(...any) error
}

func scanJob(row scanner) (Job, error) {
	var job Job
	err := row.Scan(
		&job.ID, &job.AssetID, &job.UserID, &job.ObjectKey,
		&job.ContentType, &job.SizeBytes, &job.Status,
	)
	return job, err
}

func scanAsset(row scanner) (Asset, error) {
	var asset Asset
	err := row.Scan(
		&asset.ID, &asset.UserID, &asset.ObjectKey,
		&asset.ContentType, &asset.SizeBytes, &asset.ETag,
	)
	return asset, err
}
