// Command storage-smoke verifies the production private-object path without
// exposing credentials, signed URLs, provider responses, or object keys.
package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/kiaquila/capsule-zero/api/internal/config"
	"github.com/kiaquila/capsule-zero/api/internal/storage"
)

const (
	smokeBytes  = 10 * 1024 * 1024
	contentType = "image/jpeg"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	if failedStep := run(ctx, os.Stdout); failedStep != "" {
		fmt.Fprintf(os.Stderr, "storage-smoke=%s-failed\n", failedStep)
		os.Exit(1)
	}
}

func run(ctx context.Context, out io.Writer) (failedStep string) {
	cfg, err := config.Load()
	if err != nil {
		return "config"
	}
	client, err := storage.New(ctx, storage.Config{
		Endpoint:        cfg.ObjectStorage.Endpoint,
		Region:          cfg.ObjectStorage.Region,
		AccessKeyID:     cfg.ObjectStorage.AccessKeyID,
		SecretAccessKey: cfg.ObjectStorage.SecretAccessKey,
		PrivateBucket:   cfg.ObjectStorage.PrivateBucket,
	})
	if err != nil {
		return "config"
	}
	if err := client.Ready(ctx); err != nil {
		return "ready"
	}
	fmt.Fprintln(out, "storage-ready=ok")

	payload := smokePayload()
	key, ok := smokeKey()
	if !ok {
		return "key"
	}
	// Once a key exists, always attempt deletion: a PUT can reach storage even
	// when the client loses the response and reports an error.
	cleanupNeeded := true
	defer func() {
		if cleanupNeeded && !cleanupObject(client, key) {
			failedStep = "cleanup"
		}
	}()

	if !signedUpload(ctx, client, key, payload) {
		return "signed-put"
	}
	fmt.Fprintf(out, "signed-put=ok bytes=%d\n", len(payload))

	if !headMatches(ctx, client, key, int64(len(payload))) {
		return "head-object"
	}
	fmt.Fprintln(out, "head-object=ok")

	if !signedDownloadMatches(ctx, client, key, payload) {
		return "signed-get"
	}
	fmt.Fprintln(out, "signed-get=ok checksum-match")

	if !cleanupObject(client, key) {
		return "cleanup"
	}
	cleanupNeeded = false
	fmt.Fprintln(out, "cleanup=ok")
	return ""
}

func cleanupObject(client *storage.Client, key string) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := client.Delete(ctx, key); err != nil {
		return false
	}
	_, err := client.Head(ctx, key)
	return errors.Is(err, storage.ErrNotFound)
}

func signedUpload(ctx context.Context, client *storage.Client, key string, payload []byte) bool {
	signed, err := client.PresignPut(ctx, storage.PutRequest{
		Key: key, ContentType: contentType, SizeBytes: int64(len(payload)),
	})
	if err != nil {
		return false
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPut, signed.URL, bytes.NewReader(payload))
	if err != nil {
		return false
	}
	request.ContentLength = int64(len(payload))
	for name, value := range signed.Headers {
		request.Header.Set(name, value)
	}

	response, err := smokeHTTPClient().Do(request)
	if err != nil {
		return false
	}
	defer response.Body.Close()
	_, _ = io.Copy(io.Discard, io.LimitReader(response.Body, 1024))
	return response.StatusCode >= http.StatusOK && response.StatusCode < http.StatusMultipleChoices
}

func headMatches(ctx context.Context, client *storage.Client, key string, size int64) bool {
	metadata, err := client.Head(ctx, key)
	return err == nil && metadata.SizeBytes == size && metadata.ContentType == contentType
}

func signedDownloadMatches(ctx context.Context, client *storage.Client, key string, want []byte) bool {
	signed, err := client.PresignGet(ctx, key)
	if err != nil {
		return false
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, signed.URL, nil)
	if err != nil {
		return false
	}
	for name, value := range signed.Headers {
		request.Header.Set(name, value)
	}

	response, err := smokeHTTPClient().Do(request)
	if err != nil {
		return false
	}
	defer response.Body.Close()
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return false
	}

	digest := sha256.New()
	read, err := io.Copy(digest, io.LimitReader(response.Body, int64(len(want))+1))
	wantDigest := sha256.Sum256(want)
	return err == nil && read == int64(len(want)) && bytes.Equal(digest.Sum(nil), wantDigest[:])
}

func smokeHTTPClient() *http.Client {
	return &http.Client{
		Timeout: 45 * time.Second,
		CheckRedirect: func(*http.Request, []*http.Request) error {
			return errors.New("redirect refused")
		},
	}
}

func smokePayload() []byte {
	payload := make([]byte, smokeBytes)
	for index := range payload {
		payload[index] = byte(index*31 + 17)
	}
	payload[0], payload[1], payload[2] = 0xff, 0xd8, 0xff
	payload[len(payload)-2], payload[len(payload)-1] = 0xff, 0xd9
	return payload
}

func smokeKey() (string, bool) {
	var suffix [16]byte
	if _, err := rand.Read(suffix[:]); err != nil {
		return "", false
	}
	return "smoke/spec-040/" + hex.EncodeToString(suffix[:]) + ".jpg", true
}
