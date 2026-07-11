package storage

import (
	"context"
	"errors"
	"net/http"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/smithy-go"
	smithyhttp "github.com/aws/smithy-go/transport/http"
)

type fakeS3API struct {
	headObjectInput  *s3.HeadObjectInput
	headObjectOutput *s3.HeadObjectOutput
	headObjectErr    error
}

func (*fakeS3API) HeadBucket(
	context.Context,
	*s3.HeadBucketInput,
	...func(*s3.Options),
) (*s3.HeadBucketOutput, error) {
	return &s3.HeadBucketOutput{}, nil
}

func (f *fakeS3API) HeadObject(
	_ context.Context,
	input *s3.HeadObjectInput,
	_ ...func(*s3.Options),
) (*s3.HeadObjectOutput, error) {
	f.headObjectInput = input
	return f.headObjectOutput, f.headObjectErr
}

func (*fakeS3API) DeleteObject(
	context.Context,
	*s3.DeleteObjectInput,
	...func(*s3.Options),
) (*s3.DeleteObjectOutput, error) {
	return &s3.DeleteObjectOutput{}, nil
}

type fakeS3Presigner struct {
	putInput  *s3.PutObjectInput
	putExpiry time.Duration
	putResult *v4.PresignedHTTPRequest
	putErr    error
	getInput  *s3.GetObjectInput
	getExpiry time.Duration
	getResult *v4.PresignedHTTPRequest
	getErr    error
}

func (f *fakeS3Presigner) PresignPutObject(
	_ context.Context,
	input *s3.PutObjectInput,
	options ...func(*s3.PresignOptions),
) (*v4.PresignedHTTPRequest, error) {
	f.putInput = input
	f.putExpiry = applyPresignOptions(options).Expires
	return f.putResult, f.putErr
}

func (f *fakeS3Presigner) PresignGetObject(
	_ context.Context,
	input *s3.GetObjectInput,
	options ...func(*s3.PresignOptions),
) (*v4.PresignedHTTPRequest, error) {
	f.getInput = input
	f.getExpiry = applyPresignOptions(options).Expires
	return f.getResult, f.getErr
}

func applyPresignOptions(options []func(*s3.PresignOptions)) s3.PresignOptions {
	var resolved s3.PresignOptions
	for _, option := range options {
		option(&resolved)
	}
	return resolved
}

func TestAWSBackendPresignPutBindsObjectAndShapesClientHeaders(t *testing.T) {
	presigner := &fakeS3Presigner{putResult: &v4.PresignedHTTPRequest{
		URL: "https://signed.example/private/object?signature=redacted",
		SignedHeader: http.Header{
			"host":                  {"private.hel1.your-objectstorage.com"},
			"content-length":        {"10485760"},
			"content-type":          {"application/provider-value"},
			"x-amz-checksum-sha256": {"checksum"},
			"x-test-multi":          {"first", "second"},
			"x-empty":               nil,
		},
	}}
	backend := &awsBackend{client: &fakeS3API{}, presigner: presigner}
	ttl := 5 * time.Minute
	before := time.Now().UTC().Add(ttl)

	request, err := backend.PresignPut(context.Background(), PutInput{
		Bucket:      "capsulezero-prod-private-assets",
		Key:         "item-originals/user-1/asset-1.jpg",
		ContentType: "image/jpeg",
		SizeBytes:   10 * 1024 * 1024,
	}, ttl)
	after := time.Now().UTC().Add(ttl)
	if err != nil {
		t.Fatalf("PresignPut() error = %v", err)
	}

	if got := aws.ToString(presigner.putInput.Bucket); got != "capsulezero-prod-private-assets" {
		t.Errorf("PutObject bucket = %q", got)
	}
	if got := aws.ToString(presigner.putInput.Key); got != "item-originals/user-1/asset-1.jpg" {
		t.Errorf("PutObject key = %q", got)
	}
	if got := aws.ToString(presigner.putInput.ContentType); got != "image/jpeg" {
		t.Errorf("PutObject content type = %q", got)
	}
	if got := aws.ToInt64(presigner.putInput.ContentLength); got != 10*1024*1024 {
		t.Errorf("PutObject content length = %d", got)
	}
	if presigner.putExpiry != ttl {
		t.Errorf("presigner expiry = %s, want %s", presigner.putExpiry, ttl)
	}
	if _, ok := request.Headers["Host"]; ok {
		t.Error("client headers unexpectedly contain Host")
	}
	if _, ok := request.Headers["Content-Length"]; ok {
		t.Error("client headers unexpectedly contain Content-Length")
	}
	if got := request.Headers["Content-Type"]; got != "image/jpeg" {
		t.Errorf("client Content-Type = %q, want request value", got)
	}
	if got := request.Headers["X-Amz-Checksum-Sha256"]; got != "checksum" {
		t.Errorf("client checksum header = %q", got)
	}
	if got := request.Headers["X-Test-Multi"]; got != "first,second" {
		t.Errorf("joined client header = %q", got)
	}
	if _, ok := request.Headers["X-Empty"]; ok {
		t.Error("client headers unexpectedly contain empty signed header")
	}
	assertTimeInRange(t, request.ExpiresAt, before, after)
}

func TestAWSBackendPresignGetUsesRequestedExpiry(t *testing.T) {
	presigner := &fakeS3Presigner{getResult: &v4.PresignedHTTPRequest{
		URL: "https://signed.example/private/object?signature=redacted",
		SignedHeader: http.Header{
			"host":           {"private.hel1.your-objectstorage.com"},
			"x-amz-signed":   {"required"},
			"content-type":   {"image/jpeg"},
			"content-length": {"42"},
		},
	}}
	backend := &awsBackend{client: &fakeS3API{}, presigner: presigner}
	ttl := 15 * time.Minute
	before := time.Now().UTC().Add(ttl)

	request, err := backend.PresignGet(
		context.Background(),
		"capsulezero-prod-private-assets",
		"item-originals/user-1/asset-1.jpg",
		ttl,
	)
	after := time.Now().UTC().Add(ttl)
	if err != nil {
		t.Fatalf("PresignGet() error = %v", err)
	}

	if got := aws.ToString(presigner.getInput.Bucket); got != "capsulezero-prod-private-assets" {
		t.Errorf("GetObject bucket = %q", got)
	}
	if got := aws.ToString(presigner.getInput.Key); got != "item-originals/user-1/asset-1.jpg" {
		t.Errorf("GetObject key = %q", got)
	}
	if presigner.getExpiry != ttl {
		t.Errorf("presigner expiry = %s, want %s", presigner.getExpiry, ttl)
	}
	if got := request.Headers["X-Amz-Signed"]; got != "required" {
		t.Errorf("required GET header = %q", got)
	}
	if _, ok := request.Headers["Host"]; ok {
		t.Error("client GET headers unexpectedly contain Host")
	}
	if _, ok := request.Headers["Content-Length"]; ok {
		t.Error("client GET headers unexpectedly contain Content-Length")
	}
	assertTimeInRange(t, request.ExpiresAt, before, after)
}

func TestAWSBackendHeadObjectReturnsNormalizedMetadata(t *testing.T) {
	client := &fakeS3API{headObjectOutput: &s3.HeadObjectOutput{
		ContentType:   aws.String("image/webp"),
		ContentLength: aws.Int64(2048),
		ETag:          aws.String(`"etag-value"`),
	}}
	backend := &awsBackend{client: client, presigner: &fakeS3Presigner{}}

	metadata, err := backend.HeadObject(
		context.Background(),
		"capsulezero-prod-private-assets",
		"item-originals/user-1/asset-1.webp",
	)
	if err != nil {
		t.Fatalf("HeadObject() error = %v", err)
	}

	if got := aws.ToString(client.headObjectInput.Bucket); got != "capsulezero-prod-private-assets" {
		t.Errorf("HeadObject bucket = %q", got)
	}
	if got := aws.ToString(client.headObjectInput.Key); got != "item-originals/user-1/asset-1.webp" {
		t.Errorf("HeadObject key = %q", got)
	}
	if metadata.ContentType != "image/webp" || metadata.SizeBytes != 2048 || metadata.ETag != "etag-value" {
		t.Errorf("HeadObject metadata = %+v", metadata)
	}
}

func TestAWSBackendHeadObjectMapsProviderNotFoundErrors(t *testing.T) {
	httpNotFound := &smithyhttp.ResponseError{
		Response: &smithyhttp.Response{Response: &http.Response{StatusCode: http.StatusNotFound}},
		Err:      errors.New("provider response"),
	}
	tests := []struct {
		name string
		err  error
	}{
		{name: "HTTP 404", err: httpNotFound},
		{name: "NotFound code", err: &smithy.GenericAPIError{Code: "NotFound", Message: "missing"}},
		{name: "NoSuchKey code", err: &smithy.GenericAPIError{Code: "NoSuchKey", Message: "missing"}},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			backend := &awsBackend{client: &fakeS3API{headObjectErr: test.err}, presigner: &fakeS3Presigner{}}

			_, err := backend.HeadObject(context.Background(), "private", "missing.jpg")
			if !errors.Is(err, ErrNotFound) {
				t.Fatalf("HeadObject() error = %v, want ErrNotFound", err)
			}
		})
	}
}

func TestAWSBackendHeadObjectPreservesOtherProviderErrors(t *testing.T) {
	providerErr := &smithy.GenericAPIError{Code: "AccessDenied", Message: "denied"}
	backend := &awsBackend{client: &fakeS3API{headObjectErr: providerErr}, presigner: &fakeS3Presigner{}}

	_, err := backend.HeadObject(context.Background(), "private", "object.jpg")
	if !errors.Is(err, providerErr) {
		t.Fatalf("HeadObject() error = %v, want original provider error", err)
	}
}

func TestValidateConfigRequiresEveryConnectionField(t *testing.T) {
	valid := Config{
		Endpoint:        "https://hel1.your-objectstorage.com",
		Region:          "hel1",
		AccessKeyID:     "access-key",
		SecretAccessKey: "secret-key",
		PrivateBucket:   "capsulezero-prod-private-assets",
	}
	if err := validateConfig(valid); err != nil {
		t.Fatalf("validateConfig(valid) error = %v", err)
	}

	tests := []struct {
		name   string
		mutate func(*Config)
	}{
		{name: "endpoint", mutate: func(cfg *Config) { cfg.Endpoint = " " }},
		{name: "region", mutate: func(cfg *Config) { cfg.Region = "" }},
		{name: "access key ID", mutate: func(cfg *Config) { cfg.AccessKeyID = "\t" }},
		{name: "secret access key", mutate: func(cfg *Config) { cfg.SecretAccessKey = "" }},
		{name: "private bucket", mutate: func(cfg *Config) { cfg.PrivateBucket = "\n" }},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			cfg := valid
			test.mutate(&cfg)
			if err := validateConfig(cfg); err == nil {
				t.Fatal("validateConfig() error = nil, want required-field failure")
			}
		})
	}
}

func TestAWSClientNetworkBoundsStayConservative(t *testing.T) {
	if httpTimeout <= 0 || httpTimeout > 30*time.Second {
		t.Errorf("HTTP timeout = %s, want (0, 30s]", httpTimeout)
	}
	if maxAttempts < 2 || maxAttempts > 5 {
		t.Errorf("max attempts = %d, want [2, 5]", maxAttempts)
	}
	if maxBackoff <= 0 || maxBackoff > 5*time.Second {
		t.Errorf("max backoff = %s, want (0, 5s]", maxBackoff)
	}
}

func TestAWSClientPresignedPutMatchesBrowserCORSHeaderAllowlist(t *testing.T) {
	client, err := New(context.Background(), Config{
		Endpoint:        "https://hel1.your-objectstorage.com",
		Region:          "hel1",
		AccessKeyID:     "test-access-key",
		SecretAccessKey: "test-secret-key",
		PrivateBucket:   "capsulezero-prod-private-assets",
	})
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	signed, err := client.PresignPut(context.Background(), PutRequest{
		Key:         "item-originals/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg",
		ContentType: "image/jpeg",
		SizeBytes:   4096,
	})
	if err != nil {
		t.Fatalf("PresignPut() error = %v", err)
	}
	for name := range signed.Headers {
		if name != "Content-Type" {
			t.Errorf("browser upload requires CORS header %q, but production allows only Content-Type", name)
		}
	}
}

func assertTimeInRange(t *testing.T, got, earliest, latest time.Time) {
	t.Helper()
	if got.Before(earliest) || got.After(latest) {
		t.Errorf("expiry = %s, want within [%s, %s]", got, earliest, latest)
	}
}
