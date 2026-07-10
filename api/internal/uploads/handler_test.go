package uploads

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/kiaquila/capsule-zero/api/internal/httpx"
	"github.com/kiaquila/capsule-zero/api/internal/storage"
)

const (
	testJobID      = "11111111-1111-4111-8111-111111111111"
	testAssetID    = "22222222-2222-4222-8222-222222222222"
	completionBody = `{"jobId":"11111111-1111-4111-8111-111111111111","assetId":"22222222-2222-4222-8222-222222222222"}`
)

type fakeObjects struct {
	readyErr  error
	signErr   error
	signCalls int
	signInput storage.PutRequest
	headErr   error
	headCalls int
	headKey   string
	metadata  storage.ObjectMetadata
}

func (f *fakeObjects) Ready(context.Context) error { return f.readyErr }

func (f *fakeObjects) PresignPut(_ context.Context, input storage.PutRequest) (storage.SignedRequest, error) {
	f.signCalls++
	f.signInput = input
	if f.signErr != nil {
		return storage.SignedRequest{}, f.signErr
	}
	return storage.SignedRequest{
		URL:       "https://signed.example/put",
		Headers:   map[string]string{"Content-Type": input.ContentType},
		ExpiresAt: time.Date(2026, 7, 10, 20, 5, 0, 0, time.UTC),
	}, nil
}

func (f *fakeObjects) Head(_ context.Context, key string) (storage.ObjectMetadata, error) {
	f.headCalls++
	f.headKey = key
	return f.metadata, f.headErr
}

type fakeJobs struct {
	createCalls   int
	created       NewJob
	createJob     Job
	createErr     error
	findCalls     int
	found         Job
	findErr       error
	completeCalls int
	completeAsset Asset
	completeErr   error
}

func (f *fakeJobs) Create(_ context.Context, job NewJob) (Job, error) {
	f.createCalls++
	f.created = job
	if f.createJob.ID == "" {
		f.createJob = Job{
			ID: job.ID, AssetID: job.AssetID, UserID: job.UserID,
			ObjectKey: job.ObjectKey, ContentType: job.ContentType,
			SizeBytes: job.SizeBytes, Status: StatusQueued,
		}
	}
	return f.createJob, f.createErr
}

func (f *fakeJobs) FindOwned(_ context.Context, userID, jobID, assetID string) (Job, error) {
	f.findCalls++
	if f.findErr != nil {
		return Job{}, f.findErr
	}
	if f.found.UserID != userID || f.found.ID != jobID || f.found.AssetID != assetID {
		return Job{}, ErrNotFound
	}
	return f.found, nil
}

func (f *fakeJobs) Complete(_ context.Context, job Job, metadata storage.ObjectMetadata) (Asset, error) {
	f.completeCalls++
	return f.completeAsset, f.completeErr
}

func testHandler(jobs *fakeJobs, objects *fakeObjects) Handler {
	ids := []string{testJobID, testAssetID}
	return Handler{
		Enabled: true,
		Jobs:    jobs,
		Objects: objects,
		UserID:  func(context.Context) (string, bool) { return "user-1", true },
		NewID: func() string {
			id := ids[0]
			ids = ids[1:]
			return id
		},
	}
}

func initRequest(body string) *http.Request {
	return httptest.NewRequest(http.MethodPost, "/api/uploads/photo/init", strings.NewReader(body))
}

func decodeError(t *testing.T, recorder *httptest.ResponseRecorder) httpx.ErrorBody {
	t.Helper()
	var body httpx.ErrorBody
	if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
		t.Fatalf("decode error response: %v", err)
	}
	return body
}

func TestInitValidatesPhotoMetadata(t *testing.T) {
	tests := []struct {
		name string
		body string
	}{
		{name: "missing filename", body: `{"fileName":"","contentType":"image/jpeg","sizeBytes":10}`},
		{name: "unsafe filename", body: `{"fileName":"../secret.jpg","contentType":"image/jpeg","sizeBytes":10}`},
		{name: "unsupported mime", body: `{"fileName":"look.gif","contentType":"image/gif","sizeBytes":10}`},
		{name: "empty file", body: `{"fileName":"look.jpg","contentType":"image/jpeg","sizeBytes":0}`},
		{name: "over ten megabytes", body: `{"fileName":"look.jpg","contentType":"image/jpeg","sizeBytes":10485761}`},
		{name: "trailing JSON", body: `{"fileName":"look.jpg","contentType":"image/jpeg","sizeBytes":10} {}`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			jobs, objects := &fakeJobs{}, &fakeObjects{}
			handler := testHandler(jobs, objects)
			req := initRequest(tt.body)
			recorder := httptest.NewRecorder()

			handler.Init(recorder, req)

			if recorder.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400", recorder.Code)
			}
			if body := decodeError(t, recorder); body.Error.Code != "VALIDATION_ERROR" {
				t.Fatalf("error code = %q", body.Error.Code)
			}
			if objects.signCalls != 0 || jobs.createCalls != 0 {
				t.Fatalf("side effects: sign=%d create=%d, want none", objects.signCalls, jobs.createCalls)
			}
		})
	}
}

func TestInitReturnsOpaqueSignedUploadWithoutPrivatePath(t *testing.T) {
	jobs, objects := &fakeJobs{}, &fakeObjects{}
	handler := testHandler(jobs, objects)
	recorder := httptest.NewRecorder()

	handler.Init(recorder, initRequest(`{"fileName":"look.JPG","contentType":"image/jpeg","sizeBytes":4096}`))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200: %s", recorder.Code, recorder.Body.String())
	}
	var body map[string]any
	if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body["jobId"] != testJobID || body["assetId"] != testAssetID {
		t.Fatalf("ids = %v", body)
	}
	if body["uploadUrl"] == "" || body["expiresAt"] == "" || body["uploadHeaders"] == nil {
		t.Fatalf("signed upload response = %v", body)
	}
	if _, exposed := body["storagePath"]; exposed {
		t.Fatalf("private storagePath must not be exposed: %v", body)
	}
	if !strings.HasPrefix(objects.signInput.Key, "item-originals/user-1/"+testAssetID+".") {
		t.Fatalf("object key = %q, want opaque server-generated key", objects.signInput.Key)
	}
	if strings.Contains(objects.signInput.Key, "look") {
		t.Fatalf("object key leaks original filename: %q", objects.signInput.Key)
	}
	if jobs.created.ObjectKey != objects.signInput.Key {
		t.Fatalf("created job = %+v, signed input = %+v", jobs.created, objects.signInput)
	}
}

func TestInitFailsClosedWhenStorageIsUnavailable(t *testing.T) {
	tests := []struct {
		name      string
		readyErr  error
		signErr   error
		wantSigns int
	}{
		{name: "readiness", readyErr: errors.New("head bucket denied")},
		{name: "presigner", signErr: errors.New("signer unavailable"), wantSigns: 1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			jobs := &fakeJobs{}
			objects := &fakeObjects{readyErr: tt.readyErr, signErr: tt.signErr}
			handler := testHandler(jobs, objects)
			recorder := httptest.NewRecorder()

			handler.Init(recorder, initRequest(`{"fileName":"look.jpg","contentType":"image/jpeg","sizeBytes":4096}`))

			if recorder.Code != http.StatusServiceUnavailable {
				t.Fatalf("status = %d, want 503", recorder.Code)
			}
			if jobs.createCalls != 0 {
				t.Fatalf("persisted jobs = %d, want none", jobs.createCalls)
			}
			if objects.signCalls != tt.wantSigns {
				t.Fatalf("sign calls = %d, want %d", objects.signCalls, tt.wantSigns)
			}
		})
	}
}

func TestInitRequiresAuthenticatedOwner(t *testing.T) {
	jobs, objects := &fakeJobs{}, &fakeObjects{}
	handler := testHandler(jobs, objects)
	handler.UserID = func(context.Context) (string, bool) { return "", false }
	recorder := httptest.NewRecorder()

	handler.Init(recorder, initRequest(`{"fileName":"look.jpg","contentType":"image/jpeg","sizeBytes":4096}`))

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", recorder.Code)
	}
	if objects.signCalls != 0 || jobs.createCalls != 0 {
		t.Fatalf("unauthenticated side effects: sign=%d create=%d", objects.signCalls, jobs.createCalls)
	}
}

func TestCompleteFailsClosedForMissingMismatchedOrUnavailableObject(t *testing.T) {
	baseJob := Job{
		ID: testJobID, AssetID: testAssetID, UserID: "user-1",
		ObjectKey:   "item-originals/user-1/" + testAssetID + ".jpg",
		ContentType: "image/jpeg", SizeBytes: 4096, Status: StatusQueued,
	}
	tests := []struct {
		name       string
		headErr    error
		metadata   storage.ObjectMetadata
		wantStatus int
	}{
		{name: "missing", headErr: storage.ErrNotFound, wantStatus: http.StatusConflict},
		{name: "storage outage", headErr: errors.New("timeout"), wantStatus: http.StatusServiceUnavailable},
		{name: "size mismatch", metadata: storage.ObjectMetadata{ContentType: "image/jpeg", SizeBytes: 4095}, wantStatus: http.StatusConflict},
		{name: "mime mismatch", metadata: storage.ObjectMetadata{ContentType: "image/png", SizeBytes: 4096}, wantStatus: http.StatusConflict},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			jobs := &fakeJobs{found: baseJob}
			objects := &fakeObjects{headErr: tt.headErr, metadata: tt.metadata}
			handler := testHandler(jobs, objects)
			recorder := httptest.NewRecorder()

			handler.Complete(recorder, httptest.NewRequest(
				http.MethodPost, "/api/uploads/photo/complete",
				strings.NewReader(completionBody),
			))

			if recorder.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", recorder.Code, tt.wantStatus)
			}
			if jobs.completeCalls != 0 {
				t.Fatalf("complete calls = %d, want none", jobs.completeCalls)
			}
		})
	}
}

func TestCompleteHidesCrossUserJobs(t *testing.T) {
	jobs := &fakeJobs{found: Job{
		ID: testJobID, AssetID: testAssetID, UserID: "user-2",
		ObjectKey: "item-originals/user-2/" + testAssetID + ".jpg", Status: StatusQueued,
	}}
	objects := &fakeObjects{}
	handler := testHandler(jobs, objects)
	recorder := httptest.NewRecorder()

	handler.Complete(recorder, httptest.NewRequest(
		http.MethodPost, "/api/uploads/photo/complete",
		strings.NewReader(completionBody),
	))

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", recorder.Code)
	}
	if objects.headCalls != 0 || jobs.completeCalls != 0 {
		t.Fatalf("cross-user side effects: head=%d complete=%d", objects.headCalls, jobs.completeCalls)
	}
}

func TestUploadsFailClosedWhenFeatureIsDisabled(t *testing.T) {
	jobs, objects := &fakeJobs{}, &fakeObjects{}
	handler := testHandler(jobs, objects)
	handler.Enabled = false

	initRecorder := httptest.NewRecorder()
	handler.Init(initRecorder, initRequest(`{"fileName":"look.jpg","contentType":"image/jpeg","sizeBytes":4096}`))
	completeRecorder := httptest.NewRecorder()
	handler.Complete(completeRecorder, httptest.NewRequest(
		http.MethodPost, "/api/uploads/photo/complete", strings.NewReader(completionBody),
	))

	if initRecorder.Code != http.StatusServiceUnavailable || completeRecorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("disabled statuses: init=%d complete=%d, want 503/503", initRecorder.Code, completeRecorder.Code)
	}
	if objects.signCalls != 0 || objects.headCalls != 0 || jobs.createCalls != 0 || jobs.findCalls != 0 {
		t.Fatalf("disabled side effects: sign=%d head=%d create=%d find=%d",
			objects.signCalls, objects.headCalls, jobs.createCalls, jobs.findCalls)
	}
}

func TestCompleteRejectsMalformedUUIDsBeforeRepositoryAccess(t *testing.T) {
	jobs, objects := &fakeJobs{}, &fakeObjects{}
	handler := testHandler(jobs, objects)
	recorder := httptest.NewRecorder()

	handler.Complete(recorder, httptest.NewRequest(
		http.MethodPost, "/api/uploads/photo/complete",
		strings.NewReader(`{"jobId":"not-a-uuid","assetId":"also-not-a-uuid"}`),
	))

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", recorder.Code)
	}
	if jobs.findCalls != 0 || objects.headCalls != 0 || jobs.completeCalls != 0 {
		t.Fatalf("malformed UUID side effects: find=%d head=%d complete=%d", jobs.findCalls, objects.headCalls, jobs.completeCalls)
	}
}

func TestCompletePersistsExactObjectOnce(t *testing.T) {
	jobs := &fakeJobs{
		found: Job{
			ID: testJobID, AssetID: testAssetID, UserID: "user-1",
			ObjectKey:   "item-originals/user-1/" + testAssetID + ".jpg",
			ContentType: "image/jpeg", SizeBytes: 4096, Status: StatusQueued,
		},
		completeAsset: Asset{ID: testAssetID},
	}
	objects := &fakeObjects{metadata: storage.ObjectMetadata{
		ContentType: "image/jpeg", SizeBytes: 4096, ETag: "etag-1",
	}}
	handler := testHandler(jobs, objects)
	recorder := httptest.NewRecorder()

	handler.Complete(recorder, httptest.NewRequest(
		http.MethodPost, "/api/uploads/photo/complete",
		strings.NewReader(completionBody),
	))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200: %s", recorder.Code, recorder.Body.String())
	}
	if objects.headKey != jobs.found.ObjectKey || jobs.completeCalls != 1 {
		t.Fatalf("completion side effects: head=%q complete=%d", objects.headKey, jobs.completeCalls)
	}
	var body map[string]any
	if err := json.NewDecoder(recorder.Body).Decode(&body); err != nil {
		t.Fatalf("decode complete response: %v", err)
	}
	if body["id"] != testJobID || body["assetId"] != testAssetID || body["status"] != string(StatusCompleted) {
		t.Fatalf("complete response = %v", body)
	}
}

func TestCompleteIsIdempotent(t *testing.T) {
	jobs := &fakeJobs{found: Job{
		ID: testJobID, AssetID: testAssetID, UserID: "user-1",
		ObjectKey:   "item-originals/user-1/" + testAssetID + ".jpg",
		ContentType: "image/jpeg", SizeBytes: 4096, Status: StatusCompleted,
	}}
	objects := &fakeObjects{}
	handler := testHandler(jobs, objects)

	for i := 0; i < 2; i++ {
		recorder := httptest.NewRecorder()
		handler.Complete(recorder, httptest.NewRequest(
			http.MethodPost, "/api/uploads/photo/complete",
			strings.NewReader(completionBody),
		))
		if recorder.Code != http.StatusOK {
			t.Fatalf("call %d status = %d, want 200", i+1, recorder.Code)
		}
	}
	if objects.headCalls != 0 || jobs.completeCalls != 0 {
		t.Fatalf("completed job reprocessed: head=%d complete=%d", objects.headCalls, jobs.completeCalls)
	}
}
