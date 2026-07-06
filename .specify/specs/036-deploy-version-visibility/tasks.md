# Tasks 036 — Deploy Version Visibility

## Task list

- [x] Failing-first test: `/api/health` reports `commit` + `builtAt`; `"unknown"` fallback
      on degraded 503 (`api/cmd/api/health_test.go`, commit `87cb81f`).
- [x] `main.commit` / `main.buildTime` link-time vars + `orUnknown` guard; health body
      surfaces `commit` + `builtAt`.
- [x] `api/Dockerfile`: `GIT_SHA` / `BUILD_TIME` build-args → `-ldflags -X`; OCI revision
      label on the runner stage.
- [x] `app/Dockerfile`: `GIT_SHA` build-arg → OCI revision label (parity).
- [x] `cd-prod.yml`: build-args on both builds; `environment: production` on `deploy`;
      **Verify live release** step.
- [x] Docs: `prod-cd-pipeline.md` (version endpoint + verified deployment + environment);
      this spec folder.
- [ ] Post-merge: confirm AC #3 on the real `cd-prod` run (Environments page shows the
      commit Active) and paste the link/screenshot into the PR.

## Process Memory

### Dead Ends

- **Semver / release-please.** Considered driving a human version from conventional commits
  (`feat(NNN):` already in use). Rejected for this slice: semver is a labeling concern, adds
  a bot + PR flow, and does nothing for the actual reliability question ("is prod serving
  what we shipped?"). Deferred; SHA is the deploy identity.
- **`X-App-Revision` response header on web.** The original proposal's point 3. Dropped from
  this slice (founder: "1, 2, 4 without semver") — web+api deploy from the same commit, so
  the API `/api/health` commit already verifies the whole deploy. Web keeps only the OCI
  label for parity.
- **Manual GitHub Deployments API via `actions/github-script`.** Would let us write the live
  version into the deployment description explicitly, but job-level `environment:` gives the
  same Environments/Deployments UI natively and ties the deployment status to the job (so the
  Verify step already makes "active" mean "verified"). Kept the native path; no extra
  `deployments: write` script.

### Decisions

- **Ground truth = the binary, reflection = GitHub.** Version is baked at link time and read
  back live; GitHub's Environments view is *derived from and verified against* that, never a
  standalone claim. This is the whole point of AC #4.
- **No new package/endpoint.** Build metadata lives in `package main` next to the health
  handler (it is link-time data, not env config), and rides the existing `/api/health`
  body — Engineering Reuse Rule.
- **Rollback tolerance is explicit, not silent.** Pre-036 images report `commit = "unknown"`;
  the verifier warns (`::warning::`) and defers to the wrapper's health smoke rather than
  failing. Only a concrete different commit is a hard failure.

### Known Issues / Follow-ups

- Web has no public live-version surface yet (only the OCI label) — ships with the
  `X-App-Revision` header slice.
- No drift watchdog between deploys — a scheduled `/api/health`-vs-`origin/main` check is a
  follow-up.
- The `production` environment is created implicitly by the first run under it; no manual
  protection rules are set (pre-launch, single-owner). Revisit if reviewers/approvals are
  wanted before prod deploys.
