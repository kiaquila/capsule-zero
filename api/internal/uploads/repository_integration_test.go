//go:build integration

package uploads

import (
	"context"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/kiaquila/capsule-zero/api/internal/db"
	"github.com/kiaquila/capsule-zero/api/internal/storage"
	"github.com/kiaquila/capsule-zero/api/migrations"
)

func TestRepoCompleteIsConcurrentAndIdempotent(t *testing.T) {
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("TEST_DATABASE_URL is required for the PostgreSQL integration test")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pool, err := db.NewPool(ctx, databaseURL)
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	defer pool.Close()
	if err := db.Migrate(ctx, pool, migrations.FS); err != nil {
		t.Fatalf("migrate test database: %v", err)
	}

	userID, identityID := randomUUID(), randomUUID()
	if _, err := pool.Exec(ctx, `
		INSERT INTO profiles (id, kratos_identity_id, email)
		VALUES ($1, $2, $3)`, userID, identityID, userID+"@example.test"); err != nil {
		t.Fatalf("create owner: %v", err)
	}
	defer func() { _, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, userID) }()

	repo := NewRepo(pool)
	job, err := repo.Create(ctx, NewJob{
		ID: randomUUID(), AssetID: randomUUID(), UserID: userID,
		ObjectKey:   "item-originals/" + userID + "/original.jpg",
		ContentType: "image/jpeg", SizeBytes: 4096,
	})
	if err != nil {
		t.Fatalf("create job: %v", err)
	}
	metadata := storage.ObjectMetadata{ContentType: "image/jpeg", SizeBytes: 4096, ETag: "etag-1"}

	start := make(chan struct{})
	results := make(chan Asset, 2)
	errors := make(chan error, 2)
	var callers sync.WaitGroup
	callers.Add(2)
	for range 2 {
		go func() {
			defer callers.Done()
			<-start
			asset, completeErr := repo.Complete(ctx, job, metadata)
			results <- asset
			errors <- completeErr
		}()
	}
	close(start)
	callers.Wait()
	close(results)
	close(errors)

	for completeErr := range errors {
		if completeErr != nil {
			t.Fatalf("concurrent Complete() error = %v", completeErr)
		}
	}
	for asset := range results {
		if asset.ID != job.AssetID || asset.UserID != userID || asset.ETag != metadata.ETag {
			t.Fatalf("concurrent Complete() asset = %+v", asset)
		}
	}

	var assetCount int
	var status Status
	if err := pool.QueryRow(ctx, `SELECT count(*) FROM item_assets WHERE id = $1`, job.AssetID).Scan(&assetCount); err != nil {
		t.Fatalf("count assets: %v", err)
	}
	if err := pool.QueryRow(ctx, `SELECT status FROM upload_jobs WHERE id = $1`, job.ID).Scan(&status); err != nil {
		t.Fatalf("read job status: %v", err)
	}
	if assetCount != 1 || status != StatusCompleted {
		t.Fatalf("durable result: assets=%d status=%q", assetCount, status)
	}
}
