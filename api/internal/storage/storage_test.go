package storage

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"
)

type fakeBackend struct {
	headBucketName string
	headBucketErr  error
	putInput       PutInput
	putTTL         time.Duration
	putResult      SignedRequest
	putErr         error
	getKey         string
	getTTL         time.Duration
	getResult      SignedRequest
	headKey        string
	headResult     ObjectMetadata
	headErr        error
}

func (f *fakeBackend) HeadBucket(_ context.Context, bucket string) error {
	f.headBucketName = bucket
	return f.headBucketErr
}

func (f *fakeBackend) PresignPut(_ context.Context, input PutInput, ttl time.Duration) (SignedRequest, error) {
	f.putInput = input
	f.putTTL = ttl
	return f.putResult, f.putErr
}

func (f *fakeBackend) PresignGet(_ context.Context, bucket, key string, ttl time.Duration) (SignedRequest, error) {
	f.getKey = bucket + "/" + key
	f.getTTL = ttl
	return f.getResult, nil
}

func (f *fakeBackend) HeadObject(_ context.Context, bucket, key string) (ObjectMetadata, error) {
	f.headKey = bucket + "/" + key
	return f.headResult, f.headErr
}

func TestClientReadyProbesConfiguredPrivateBucket(t *testing.T) {
	backend := &fakeBackend{}
	client := newClient("capsulezero-prod-private-assets", backend)

	if err := client.Ready(context.Background()); err != nil {
		t.Fatalf("Ready() error = %v", err)
	}
	if backend.headBucketName != "capsulezero-prod-private-assets" {
		t.Fatalf("HeadBucket bucket = %q", backend.headBucketName)
	}

	backend.headBucketErr = errors.New("access denied")
	if err := client.Ready(context.Background()); err == nil || !strings.Contains(err.Error(), "object storage") {
		t.Fatalf("Ready() error = %v, want wrapped object-storage error", err)
	}
}

func TestClientPresignsBoundedPutAndGet(t *testing.T) {
	now := time.Date(2026, 7, 10, 20, 0, 0, 0, time.UTC)
	backend := &fakeBackend{
		putResult: SignedRequest{
			URL:       "https://signed.example/put",
			Headers:   map[string]string{"Content-Type": "image/jpeg"},
			ExpiresAt: now.Add(5 * time.Minute),
		},
		getResult: SignedRequest{
			URL:       "https://signed.example/get",
			ExpiresAt: now.Add(15 * time.Minute),
		},
	}
	client := newClient("capsulezero-prod-private-assets", backend)

	put, err := client.PresignPut(context.Background(), PutRequest{
		Key:         "item-originals/user-1/asset-1.jpg",
		ContentType: "image/jpeg",
		SizeBytes:   4096,
	})
	if err != nil {
		t.Fatalf("PresignPut() error = %v", err)
	}
	if backend.putTTL != 5*time.Minute {
		t.Fatalf("put ttl = %s, want 5m", backend.putTTL)
	}
	if backend.putInput.Bucket != "capsulezero-prod-private-assets" ||
		backend.putInput.Key != "item-originals/user-1/asset-1.jpg" ||
		backend.putInput.ContentType != "image/jpeg" || backend.putInput.SizeBytes != 4096 {
		t.Fatalf("put input = %+v", backend.putInput)
	}
	if put.Headers["Content-Type"] != "image/jpeg" {
		t.Fatalf("signed headers = %v, want exact Content-Type", put.Headers)
	}

	if _, err := client.PresignGet(context.Background(), "item-originals/user-1/asset-1.jpg"); err != nil {
		t.Fatalf("PresignGet() error = %v", err)
	}
	if backend.getTTL != 15*time.Minute {
		t.Fatalf("get ttl = %s, want 15m", backend.getTTL)
	}
	if backend.getKey != "capsulezero-prod-private-assets/item-originals/user-1/asset-1.jpg" {
		t.Fatalf("get target = %q", backend.getKey)
	}
}

func TestClientPresignPutFailsClosed(t *testing.T) {
	backend := &fakeBackend{putErr: errors.New("signer unavailable")}
	client := newClient("capsulezero-prod-private-assets", backend)

	request, err := client.PresignPut(context.Background(), PutRequest{
		Key:         "item-originals/user-1/asset-1.jpg",
		ContentType: "image/jpeg",
		SizeBytes:   4096,
	})
	if err == nil {
		t.Fatal("PresignPut() error = nil, want failure")
	}
	if request.URL != "" || len(request.Headers) != 0 {
		t.Fatalf("signed request = %+v, want zero value on failure", request)
	}
}

func TestClientReadsObjectMetadataFromPrivateBucket(t *testing.T) {
	backend := &fakeBackend{headResult: ObjectMetadata{
		ContentType: "image/webp",
		SizeBytes:   2048,
		ETag:        "etag-1",
	}}
	client := newClient("capsulezero-prod-private-assets", backend)

	metadata, err := client.Head(context.Background(), "item-originals/user-1/asset-1.webp")
	if err != nil {
		t.Fatalf("Head() error = %v", err)
	}
	if backend.headKey != "capsulezero-prod-private-assets/item-originals/user-1/asset-1.webp" {
		t.Fatalf("head target = %q", backend.headKey)
	}
	if metadata.ContentType != "image/webp" || metadata.SizeBytes != 2048 || metadata.ETag != "etag-1" {
		t.Fatalf("metadata = %+v", metadata)
	}
}
