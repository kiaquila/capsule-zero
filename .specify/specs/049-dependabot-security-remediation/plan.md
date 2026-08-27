# Plan 049 — Dependabot Security Remediation

## Approach

Inventory tracked manifests from the current `origin/main`, configure each supported
ecosystem at its actual directory, and keep update policy explicit per ecosystem. Apply
only compatible patched versions for packages named by the required OSV run. Preserve
existing direct dependency ranges and update only the existing security overrides and
the corresponding lockfile records.

For generated minor/patch groups, review each direct version delta, remove any frozen
legacy-provider update from both manifest and lockfile, confirm framework runtime
requirements against current upstream documentation, and require clean installs plus
the complete repository verification chain before merge.

## Verification

| #   | Acceptance criterion                                                                                      | Evidence                                                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Dependabot covers every active ecosystem and directory                                                    | [V1 — ecosystem coverage](#v1--ecosystem-coverage)                                                                                                                                         |
| 2   | Minor/patch updates are grouped; majors remain separate except for the explicit PostgreSQL migration gate | [V2 — grouping policy](#v2--grouping-policy)                                                                                                                                               |
| 3   | GitHub Actions cooldown uses only `default-days`                                                          | [V3 — cooldown shape](#v3--cooldown-shape)                                                                                                                                                 |
| 4   | GitHub dependency security features are enabled                                                           | [V4 — repository security settings](#v4--repository-security-settings)                                                                                                                     |
| 5   | Vulnerability remediation is complete without suppression                                                 | `go run github.com/google/osv-scanner/v2/cmd/osv-scanner@v2.3.5 --recursive .` returns `No issues found`; `npm audit --json` returns zero vulnerabilities in `/`, `/app`, and `/tests/e2e` |
| 6   | Dependency metadata remains installable and the application is unchanged behaviorally                     | Clean `npm ci` in `/`, `/app`, and `/tests/e2e`; `npm run preflight`                                                                                                                       |
| 7   | Current PR head is merge-ready                                                                            | [V7 — head-bound merge readiness](#v7--head-bound-merge-readiness)                                                                                                                         |
| 8   | PR #107 refreshes the reviewed npm minor/patch set without advancing frozen Supabase packages             | [V8 — grouped npm refresh](#v8--grouped-npm-refresh)                                                                                                                                       |
| 9   | PR #115 refreshes the reviewed Go minor/patch set without breaking storage or database contracts          | [V9 — grouped Go refresh](#v9--grouped-go-refresh)                                                                                                                                         |
| 10  | PR #121 advances the Go patch set within the already-reviewed AWS SDK minor lines                         | [V10 — follow-on Go patch refresh](#v10--follow-on-go-patch-refresh)                                                                                                                       |
| 11  | PR #123 refreshes the reviewed app npm minor/patch set with the frozen Supabase subgraph held at `main`   | [V11 — grouped app npm refresh](#v11--grouped-app-npm-refresh)                                                                                                                             |

### V1 — Ecosystem coverage

```sh
ruby -ryaml -e 'u=YAML.safe_load(File.read(".github/dependabot.yml")).fetch("updates"); expected={"npm"=>["/","/app","/tests/e2e"],"gomod"=>["/api"],"docker"=>["/api","/app"],"docker-compose"=>["/"],"github-actions"=>["/"]}; actual=u.to_h { |entry| [entry.fetch("package-ecosystem"),entry["directories"] || [entry.fetch("directory")]] }; abort "coverage mismatch" unless actual==expected; puts "ecosystem coverage passed"'
```

### V2 — Grouping policy

```sh
ruby -ryaml -e 'u=YAML.safe_load(File.read(".github/dependabot.yml")).fetch("updates"); abort "group mismatch" unless u.all? { |entry| entry.fetch("groups").values.all? { |group| group.fetch("update-types")==["minor","patch"] } }; compose=u.find { |entry| entry.fetch("package-ecosystem")=="docker-compose" }; expected=[{"dependency-name"=>"postgres","update-types"=>["version-update:semver-major"]}]; abort "PostgreSQL major ignore mismatch" unless compose.fetch("ignore")==expected && u.reject { |entry| entry.equal?(compose) }.none? { |entry| entry.key?("ignore") }; puts "minor/patch grouping passed; majors remain unmatched except PostgreSQL majors"'
```

### V3 — Cooldown shape

```sh
ruby -ryaml -e 'u=YAML.safe_load(File.read(".github/dependabot.yml")).fetch("updates"); gh=u.find { |entry| entry.fetch("package-ecosystem")=="github-actions" }; abort "cooldown mismatch" unless gh.fetch("cooldown")=={"default-days"=>7} && u.reject { |entry| entry.equal?(gh) }.none? { |entry| entry.key?("cooldown") }; puts "GitHub Actions-only default-days cooldown passed"'
```

### V4 — Repository security settings

```sh
gh api -i repos/kiaquila/capsule-zero/vulnerability-alerts
gh api repos/kiaquila/capsule-zero/automated-security-fixes
gh api repos/kiaquila/capsule-zero/dependency-graph/sbom --jq '.sbom.SPDXID'
```

Expected evidence is respectively `HTTP/2.0 204 No Content`,
`{"enabled":true,"paused":false}`, and `SPDXRef-DOCUMENT`.

### V7 — Head-bound merge readiness

Run after all required checks settle. The command fails if GitHub is not evaluating the
checked-out SHA, any required check is not green, the PR is not cleanly mergeable, or a
review thread remains unresolved.

```sh
head_sha="$(git rev-parse HEAD)"
test "$(gh pr view 123 --repo kiaquila/capsule-zero --json headRefOid --jq .headRefOid)" = "$head_sha"
gh pr checks 123 --repo kiaquila/capsule-zero --required
test "$(gh pr view 123 --repo kiaquila/capsule-zero --json mergeable,mergeStateStatus --jq '.mergeable + "/" + .mergeStateStatus')" = "MERGEABLE/CLEAN"
test "$(gh api graphql -f query='query { repository(owner:"kiaquila",name:"capsule-zero") { pullRequest(number:123) { reviewThreads(first:100) { nodes { isResolved } } } } }' --jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)] | length')" = "0"
```

### V8 — Grouped npm refresh

```sh
npm ci --ignore-scripts
npm --prefix app ci --ignore-scripts
npm --prefix tests/e2e ci --ignore-scripts
npm run preflight

base_lock="$(mktemp)"
git show origin/main:app/package-lock.json >"$base_lock"
node - "$base_lock" <<'NODE'
const fs = require("node:fs");
const base = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const head = JSON.parse(fs.readFileSync("app/package-lock.json", "utf8"));
const keys = Object.keys(base.packages).filter((key) =>
  key.startsWith("node_modules/@supabase/"),
);
if (
  head.packages[""].dependencies["@supabase/supabase-js"] !==
    base.packages[""].dependencies["@supabase/supabase-js"] ||
  keys.some((key) => JSON.stringify(head.packages[key]) !== JSON.stringify(base.packages[key]))
) {
  process.exit(1);
}
NODE
rm "$base_lock"
```

Context7's current Next.js package documentation records Node.js `>=20.9.0` and React
`^19.0.0` support. CI and the production image use Node 22, and PR #107 keeps
React/React DOM within 19.2, so the 16.3 refresh stays inside the documented runtime
boundary.

Local evidence on the rebased PR #107 worktree: all three clean installs passed; the
structural comparison reported `frozen Supabase graph unchanged (7 lockfile entries)`;
lint, CSS lint, both typechecks, API/repository checks, and the Next.js 16.3 production
build passed. After installing the Playwright 1.62 browser revisions, the one WebKit
hydration-race scenario was reproduced at 2/3 passes, hardened with the existing
cookie-banner POM retry pattern, and then passed 5/5 concurrent WebKit repetitions.
The final `CI=1 npm run preflight` exited successfully with 77 passed and 8 intentionally
skipped browser scenarios; one unrelated existing productivity-metrics scenario timed
out on its first attempt and passed under the repository's CI retry policy. The GitHub
`test` job remains the head-bound external suite evidence.

### V9 — Grouped Go refresh

```sh
cd api
go mod tidy
git diff --exit-code -- go.mod go.sum
go mod verify
go vet ./...
go test ./...
go test -race ./internal/storage ./internal/db
go list -m github.com/aws/aws-sdk-go-v2 github.com/aws/aws-sdk-go-v2/config github.com/aws/aws-sdk-go-v2/credentials github.com/aws/aws-sdk-go-v2/service/s3 github.com/aws/smithy-go github.com/jackc/pgx/v5
cd ..
CI=1 npm run preflight
```

Context7's current AWS SDK v2 sources retain `LoadDefaultConfig`, S3 `BaseEndpoint`,
`UsePathStyle`, and `NewPresignClient`; the repository exercises those paths in the
storage package tests. Current pgx v5.10 documentation preserves `pgxpool.New` while
deprecating `BeforeAcquire` in favor of `PrepareConn`; the repository uses neither hook.
The release also adds PostgreSQL protocol hardening without requiring a pool API change.

Local evidence on rebased PR #115: `go mod tidy` produced no diff; `go mod verify`,
`go vet ./...`, all API package tests, and race-enabled storage/database tests passed
with Go 1.26.6. The resolved direct module versions are AWS SDK core 1.43.5, config
1.32.36, credentials 1.19.35, S3 1.107.1, Smithy 1.27.7, and pgx 5.10.0. The full
CI-mode repository preflight also passed with 78 browser scenarios passed and 8 skipped.

### V10 — Follow-on Go patch refresh

```sh
cd api
go mod tidy
git diff --exit-code -- go.mod go.sum
go mod verify
go vet ./...
go test ./...
go test -race ./internal/storage ./internal/db
go list -m github.com/aws/aws-sdk-go-v2 github.com/aws/aws-sdk-go-v2/config github.com/aws/aws-sdk-go-v2/credentials github.com/aws/aws-sdk-go-v2/service/s3 github.com/aws/smithy-go github.com/jackc/pgx/v5
```

Every direct delta on PR #121 is a patch step inside the minor lines V9 already reviewed:
AWS SDK core 1.43.5 -> 1.43.6, config 1.32.36 -> 1.32.37, credentials 1.19.35 -> 1.19.36,
S3 1.107.1 -> 1.107.2, Smithy 1.27.7 -> 1.27.8, with all thirteen generated indirect
AWS modules moving in step: `aws/protocol/eventstream` 1.7.18, `feature/ec2/imds`
1.18.37, `internal/configsources` 1.4.37, `internal/endpoints/v2` 2.7.37,
`internal/v4a` 1.4.38, `service/internal/accept-encoding` 1.13.17,
`service/internal/checksum` 1.9.30, `service/internal/presigned-url` 1.13.37,
`service/internal/s3shared` 1.19.38, `service/signin` 1.5.6, `service/sso` 1.33.6,
`service/ssooidc` 1.38.6, and `service/sts` 1.45.6. `pgx/v5` stays at 5.10.0, so the pgxpool boundary examined for
PR #115 — including the 5.10 `BeforeAcquire` deprecation the repository does not use —
is untouched. No AWS release in this window changes `LoadDefaultConfig`, S3
`BaseEndpoint`, `UsePathStyle`, or `NewPresignClient`, the four APIs the storage package
depends on.

Local evidence on rebased PR #121 with Go 1.26.6: `go mod tidy` produced no diff,
`go mod verify` reported `all modules verified`, `go vet ./...` was clean, every API
package test passed, and the race-enabled `internal/storage` and `internal/db` runs
passed. The GitHub `baseline-checks`, `test`, and `osv-scan` jobs remain the head-bound
external evidence.

### V11 — Grouped app npm refresh

```sh
git diff origin/main -- app/package.json app/package-lock.json | grep -E '^[-+].*supabase'   # must print nothing
npm ci --ignore-scripts
npm ci --prefix app
node -p "require('./app/node_modules/@supabase/supabase-js/package.json').version"   # 2.108.2
npm run check:repo
npm run lint
npm run lint:css
npm run typecheck
npm run build
```

Direct deltas accepted on PR #123: `next` 16.3.0 -> 16.3.2, `eslint-config-next`
^16.3.0 -> ^16.3.2, `next-intl` ^4.13.6 -> ^4.13.7, `@hookform/resolvers` ^5.7.1 ->
^5.9.1, `react-hook-form` ^7.85.0 -> ^7.86.0, `zustand` ^5.0.14 -> ^5.0.15. The
generated `@supabase/supabase-js` ^2.108.2 -> ^2.112.3 bump is reverted in both the
manifest and the lockfile under the frozen-provider rule.

Local evidence on rebased PR #123: the Supabase grep printed nothing, both clean
installs succeeded, the installed Supabase runtime resolved to 2.108.2, and the
repository baseline, ESLint (0 errors), Stylelint (0 errors), typecheck, and the
Next.js production build all passed. The GitHub `baseline-checks`, `test`, and
`osv-scan` jobs remain the head-bound external evidence.
