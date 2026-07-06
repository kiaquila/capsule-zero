# Capsule Zero Go API — multi-stage build.
ARG GO_VERSION=1.25.11

FROM golang:${GO_VERSION}-bookworm AS builder
WORKDIR /src

# Cache dependencies first.
COPY go.mod go.sum ./
RUN go mod download

COPY . .
# Build metadata is stamped into the binary at link time so /api/health can
# report the running commit — the CD deploy verifier reads it back to confirm
# prod rolled to the SHA it shipped. Defaults keep a plain `docker build` honest.
ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown
# Static binary, no cgo, trimmed paths.
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath \
    -ldflags="-s -w -X main.commit=${GIT_SHA} -X main.buildTime=${BUILD_TIME}" \
    -o /out/api ./cmd/api

FROM gcr.io/distroless/static-debian12:nonroot AS runner
WORKDIR /
# Standard OCI revision label so `docker inspect` / GHCR show the source commit
# without booting the container (the live commit is also in /api/health).
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision=${GIT_SHA}
COPY --from=builder /out/api /api
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/api"]
