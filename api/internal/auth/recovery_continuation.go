package auth

import (
	"crypto/rand"
	"encoding/base64"
	"sync"
	"time"
)

const recoveryContinuationTTL = 15 * time.Minute

var recoveryContinuations = newRecoveryContinuationStore(recoveryContinuationTTL)

type recoveryContinuationStore struct {
	ttl     time.Duration
	entries sync.Map
}

type recoveryContinuation struct {
	token     string
	expiresAt time.Time
}

func newRecoveryContinuationStore(ttl time.Duration) *recoveryContinuationStore {
	return &recoveryContinuationStore{ttl: ttl}
}

func (s *recoveryContinuationStore) issue(token string) (string, error) {
	var raw [32]byte
	if _, err := rand.Read(raw[:]); err != nil {
		return "", err
	}
	now := time.Now()
	s.sweep(now)
	id := base64.RawURLEncoding.EncodeToString(raw[:])
	s.entries.Store(id, recoveryContinuation{
		token:     token,
		expiresAt: now.Add(s.ttl),
	})
	return id, nil
}

func (s *recoveryContinuationStore) get(id string) (string, bool) {
	value, ok := s.entries.Load(id)
	if !ok {
		return "", false
	}
	continuation, ok := value.(recoveryContinuation)
	if !ok || time.Now().After(continuation.expiresAt) {
		s.entries.Delete(id)
		return "", false
	}
	return continuation.token, true
}

func (s *recoveryContinuationStore) delete(id string) {
	s.entries.Delete(id)
}

func (s *recoveryContinuationStore) sweep(now time.Time) {
	s.entries.Range(func(key, value any) bool {
		continuation, ok := value.(recoveryContinuation)
		if !ok || now.After(continuation.expiresAt) {
			s.entries.Delete(key)
		}
		return true
	})
}
