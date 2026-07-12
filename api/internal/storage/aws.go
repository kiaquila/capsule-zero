package storage

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/aws/retry"
	"github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/smithy-go"
	smithyhttp "github.com/aws/smithy-go/transport/http"
)

const (
	httpTimeout = 10 * time.Second
	maxAttempts = 3
	maxBackoff  = 2 * time.Second
)

type s3API interface {
	HeadBucket(context.Context, *s3.HeadBucketInput, ...func(*s3.Options)) (*s3.HeadBucketOutput, error)
	HeadObject(context.Context, *s3.HeadObjectInput, ...func(*s3.Options)) (*s3.HeadObjectOutput, error)
	DeleteObject(context.Context, *s3.DeleteObjectInput, ...func(*s3.Options)) (*s3.DeleteObjectOutput, error)
}

type s3Presigner interface {
	PresignPutObject(context.Context, *s3.PutObjectInput, ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error)
	PresignGetObject(context.Context, *s3.GetObjectInput, ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error)
}

type awsBackend struct {
	client    s3API
	presigner s3Presigner
}

// New constructs a client with explicit credentials, a Hetzner endpoint, and
// bounded network behavior. It does not contact object storage until Ready or
// another operation is called.
func New(ctx context.Context, cfg Config) (*Client, error) {
	if err := validateConfig(cfg); err != nil {
		return nil, err
	}

	transport, ok := http.DefaultTransport.(*http.Transport)
	if !ok {
		return nil, errors.New("initialize object storage HTTP transport")
	}
	httpClient := &http.Client{Transport: transport.Clone(), Timeout: httpTimeout}

	resolved, err := awsconfig.LoadDefaultConfig(
		ctx,
		awsconfig.WithRegion(cfg.Region),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			cfg.AccessKeyID,
			cfg.SecretAccessKey,
			"",
		)),
		awsconfig.WithHTTPClient(httpClient),
		awsconfig.WithRetryer(func() aws.Retryer {
			return retry.NewStandard(func(options *retry.StandardOptions) {
				options.MaxAttempts = maxAttempts
				options.MaxBackoff = maxBackoff
			})
		}),
	)
	if err != nil {
		return nil, fmt.Errorf("initialize object storage SDK: %w", err)
	}

	client := s3.NewFromConfig(resolved, func(options *s3.Options) {
		options.BaseEndpoint = aws.String(cfg.Endpoint)
	})
	return newClient(cfg.PrivateBucket, &awsBackend{
		client:    client,
		presigner: s3.NewPresignClient(client),
	}), nil
}

func validateConfig(cfg Config) error {
	required := map[string]string{
		"endpoint": cfg.Endpoint, "region": cfg.Region,
		"access key ID": cfg.AccessKeyID, "secret access key": cfg.SecretAccessKey,
		"private bucket": cfg.PrivateBucket,
	}
	for name, value := range required {
		if strings.TrimSpace(value) == "" {
			return fmt.Errorf("object storage %s is required", name)
		}
	}
	return nil
}

func (b *awsBackend) HeadBucket(ctx context.Context, bucket string) error {
	_, err := b.client.HeadBucket(ctx, &s3.HeadBucketInput{Bucket: aws.String(bucket)})
	return err
}

func (b *awsBackend) PresignPut(ctx context.Context, input PutInput, ttl time.Duration) (SignedRequest, error) {
	issuedAt := time.Now().UTC()
	request, err := b.presigner.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(input.Bucket),
		Key:           aws.String(input.Key),
		ContentLength: aws.Int64(input.SizeBytes),
		ContentType:   aws.String(input.ContentType),
	}, withExpiry(ttl))
	if err != nil {
		return SignedRequest{}, err
	}

	return SignedRequest{
		URL:       request.URL,
		Headers:   clientHeaders(request.SignedHeader, input.ContentType),
		ExpiresAt: issuedAt.Add(ttl),
	}, nil
}

func (b *awsBackend) PresignGet(ctx context.Context, bucket, key string, ttl time.Duration) (SignedRequest, error) {
	issuedAt := time.Now().UTC()
	request, err := b.presigner.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}, withExpiry(ttl))
	if err != nil {
		return SignedRequest{}, err
	}

	return SignedRequest{
		URL:       request.URL,
		Headers:   clientHeaders(request.SignedHeader, ""),
		ExpiresAt: issuedAt.Add(ttl),
	}, nil
}

func (b *awsBackend) HeadObject(ctx context.Context, bucket, key string) (ObjectMetadata, error) {
	output, err := b.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		if isNotFound(err) {
			return ObjectMetadata{}, ErrNotFound
		}
		return ObjectMetadata{}, err
	}

	return ObjectMetadata{
		ContentType: aws.ToString(output.ContentType),
		SizeBytes:   aws.ToInt64(output.ContentLength),
		ETag:        strings.Trim(aws.ToString(output.ETag), `"`),
	}, nil
}

func (b *awsBackend) DeleteObject(ctx context.Context, bucket, key string) error {
	_, err := b.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	return err
}

func withExpiry(ttl time.Duration) func(*s3.PresignOptions) {
	return func(options *s3.PresignOptions) { options.Expires = ttl }
}

func clientHeaders(signed http.Header, contentType string) map[string]string {
	headers := make(map[string]string)
	for key, values := range signed {
		canonical := http.CanonicalHeaderKey(key)
		if canonical == "Host" || canonical == "Content-Length" || len(values) == 0 {
			continue
		}
		headers[canonical] = strings.Join(values, ",")
	}
	if contentType != "" {
		headers["Content-Type"] = contentType
	}
	return headers
}

func isNotFound(err error) bool {
	var responseError *smithyhttp.ResponseError
	if errors.As(err, &responseError) && responseError.HTTPStatusCode() == http.StatusNotFound {
		return true
	}

	var apiError smithy.APIError
	if !errors.As(err, &apiError) {
		return false
	}
	return apiError.ErrorCode() == "NotFound" || apiError.ErrorCode() == "NoSuchKey"
}
