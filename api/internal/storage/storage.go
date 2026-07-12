// Package storage provides the private object-storage boundary used by upload
// workflows. Server code chooses every bucket/key and exposes only short-lived,
// operation-specific signed requests; callers must treat each URL as a bearer
// capability that reveals its provider target.
package storage

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
)

const (
	putExpiry = 5 * time.Minute
	getExpiry = 15 * time.Minute
)

// ErrNotFound identifies a missing private object without leaking provider
// details to callers.
var ErrNotFound = errors.New("object not found")

// Config contains the explicit S3-compatible connection used by New.
type Config struct {
	Endpoint        string
	Region          string
	AccessKeyID     string
	SecretAccessKey string
	PrivateBucket   string
}

// PutRequest describes the immutable metadata bound to an upload signature.
type PutRequest struct {
	Key         string
	ContentType string
	SizeBytes   int64
}

// SignedRequest is safe to return to the authenticated owner. Headers contains
// the values the client must send with the request.
type SignedRequest struct {
	URL       string
	Headers   map[string]string
	ExpiresAt time.Time
}

// ObjectMetadata is the provider metadata used to validate a completed upload.
type ObjectMetadata struct {
	ContentType string
	SizeBytes   int64
	ETag        string
}

// PutInput is the provider-facing form of a signed upload request.
type PutInput struct {
	Bucket      string
	Key         string
	ContentType string
	SizeBytes   int64
}

type backend interface {
	HeadBucket(ctx context.Context, bucket string) error
	PresignPut(ctx context.Context, input PutInput, ttl time.Duration) (SignedRequest, error)
	PresignGet(ctx context.Context, bucket, key string, ttl time.Duration) (SignedRequest, error)
	HeadObject(ctx context.Context, bucket, key string) (ObjectMetadata, error)
	DeleteObject(ctx context.Context, bucket, key string) error
}

// Client owns access to one private bucket.
type Client struct {
	privateBucket string
	backend       backend
}

func newClient(privateBucket string, provider backend) *Client {
	return &Client{privateBucket: privateBucket, backend: provider}
}

// Ready verifies that both the configured bucket and the credentials are
// usable. Any failure is deliberately fatal to readiness.
func (c *Client) Ready(ctx context.Context) error {
	if err := c.backend.HeadBucket(ctx, c.privateBucket); err != nil {
		return fmt.Errorf("object storage readiness: %w", err)
	}
	return nil
}

// PresignPut creates a five-minute upload request for one exact object and its
// declared metadata.
func (c *Client) PresignPut(ctx context.Context, request PutRequest) (SignedRequest, error) {
	if strings.TrimSpace(request.Key) == "" || strings.TrimSpace(request.ContentType) == "" || request.SizeBytes < 1 {
		return SignedRequest{}, errors.New("object key, content type, and positive size are required")
	}

	signed, err := c.backend.PresignPut(ctx, PutInput{
		Bucket:      c.privateBucket,
		Key:         request.Key,
		ContentType: request.ContentType,
		SizeBytes:   request.SizeBytes,
	}, putExpiry)
	if err != nil {
		return SignedRequest{}, fmt.Errorf("presign object upload: %w", err)
	}
	return signed, nil
}

// PresignGet creates a fifteen-minute download request for a private object.
func (c *Client) PresignGet(ctx context.Context, key string) (SignedRequest, error) {
	if strings.TrimSpace(key) == "" {
		return SignedRequest{}, errors.New("object key is required")
	}

	signed, err := c.backend.PresignGet(ctx, c.privateBucket, key, getExpiry)
	if err != nil {
		return SignedRequest{}, fmt.Errorf("presign object download: %w", err)
	}
	return signed, nil
}

// Head reads metadata without downloading the private object.
func (c *Client) Head(ctx context.Context, key string) (ObjectMetadata, error) {
	if strings.TrimSpace(key) == "" {
		return ObjectMetadata{}, errors.New("object key is required")
	}

	metadata, err := c.backend.HeadObject(ctx, c.privateBucket, key)
	if err != nil {
		return ObjectMetadata{}, fmt.Errorf("head private object: %w", err)
	}
	return metadata, nil
}

// Delete removes one object from the configured private bucket. It is used by
// cleanup workflows and the live signed-upload smoke, never by upload init.
func (c *Client) Delete(ctx context.Context, key string) error {
	if strings.TrimSpace(key) == "" {
		return errors.New("object key is required")
	}
	if err := c.backend.DeleteObject(ctx, c.privateBucket, key); err != nil {
		return fmt.Errorf("delete private object: %w", err)
	}
	return nil
}
