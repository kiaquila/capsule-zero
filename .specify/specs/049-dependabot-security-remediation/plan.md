# Plan 049 — Dependabot Security Remediation

## Approach

Inventory tracked manifests from the current `origin/main`, configure each supported
ecosystem at its actual directory, and keep update policy explicit per ecosystem. Apply
only compatible patched versions for packages named by the required OSV run. Preserve
existing direct dependency ranges and update only the existing security overrides and
the corresponding lockfile records.

## Verification

| # | Acceptance criterion | Evidence |
|---|---|---|
| 1 | Dependabot covers every active ecosystem and directory | [V1 — ecosystem coverage](#v1--ecosystem-coverage) |
| 2 | Minor/patch updates are grouped; majors remain separate except for the explicit PostgreSQL migration gate | [V2 — grouping policy](#v2--grouping-policy) |
| 3 | GitHub Actions cooldown uses only `default-days` | [V3 — cooldown shape](#v3--cooldown-shape) |
| 4 | GitHub dependency security features are enabled | [V4 — repository security settings](#v4--repository-security-settings) |
| 5 | Vulnerability remediation is complete without suppression | `go run github.com/google/osv-scanner/v2/cmd/osv-scanner@v2.3.5 --recursive .` returns `No issues found`; `npm audit --json` returns zero vulnerabilities in `/`, `/app`, and `/tests/e2e` |
| 6 | Dependency metadata remains installable and the application is unchanged behaviorally | Clean `npm ci` in `/`, `/app`, and `/tests/e2e`; `npm run preflight` |
| 7 | Current PR head is merge-ready | [V7 — head-bound merge readiness](#v7--head-bound-merge-readiness) |

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
test "$(gh pr view 97 --repo kiaquila/capsule-zero --json headRefOid --jq .headRefOid)" = "$head_sha"
gh pr checks 97 --repo kiaquila/capsule-zero --required
test "$(gh pr view 97 --repo kiaquila/capsule-zero --json mergeable,mergeStateStatus --jq '.mergeable + "/" + .mergeStateStatus')" = "MERGEABLE/CLEAN"
test "$(gh api graphql -f query='query { repository(owner:"kiaquila",name:"capsule-zero") { pullRequest(number:97) { reviewThreads(first:100) { nodes { isResolved } } } } }' --jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)] | length')" = "0"
```
