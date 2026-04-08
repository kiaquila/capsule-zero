# Gemini GitHub Setup

This runbook defines Capsule Zero's temporary Gemini Code Assist on GitHub setup.

Gemini is approved as a temporary native review backend for the periods when Codex review quota is exhausted. It is not the default reviewer, but it can satisfy `AI Review` when `AI_REVIEW_AGENT=gemini`.

## Scope

- review only
- consumer version is acceptable for this temporary overflow path
- native top-level PR commands:
  - `/gemini review`
  - `/gemini summary`
  - `/gemini help`
- not used as an implementation backend
- may be used as the required `AI Review` backend when `AI_REVIEW_AGENT=gemini`

## Why This Is Temporary

- the free consumer version currently provides `33` pull request reviews per day
- Capsule Zero keeps Codex as the default reviewer even though Gemini is available
- the consumer path is useful for quota relief, but it is not the long-term enterprise privacy and governance target for commercial source code

## Repository Files

Commit these repository-local Gemini files and keep them current:

- `.gemini/config.yaml`
- `.gemini/styleguide.md`

Capsule Zero keeps automatic review on PR open disabled in `.gemini/config.yaml` so reviewer routing stays repository-owned.

## External Setup

1. Install Gemini Code Assist on GitHub for the account that will request overflow reviews.
2. Grant repository access to `kiaquila/capsule-zero`.
3. Review Google's consumer terms and privacy notices before enabling the app on private commercial code.
4. Keep the repository-local `.gemini/` files committed before relying on Gemini feedback.

## External Setup Checklist

Use the consumer setup flow documented by Google:

1. Open the Gemini Code Assist GitHub app page.
2. Sign in to GitHub and click `Install`.
3. Choose the GitHub user or organization that should own the installation.
4. Select repository access for `kiaquila/capsule-zero`.
5. In the Gemini admin flow, log in with GitHub, choose the same account, accept the Google Terms of Service, Generative AI Prohibited Use Policy, and Privacy Policy, and complete setup.
6. On GitHub, verify the installation from `Profile photo -> Settings -> Applications -> Gemini Code Assist -> Configure`.

For the consumer version, Google also documents account-level Gemini settings on the Gemini settings page. Repository-local `.gemini/config.yaml` overrides the defaults that matter for Capsule Zero.

## Capsule Zero Checklist

Before the team relies on Gemini overflow review, confirm all of the following:

1. `.gemini/config.yaml` is committed on the default branch.
2. `.gemini/styleguide.md` is committed on the default branch.
3. `pull_request_opened.code_review` is disabled in `.gemini/config.yaml`.
4. `kiaquila/capsule-zero` is included in the Gemini installation scope.
5. A trusted repository actor can post `/gemini review` on a PR.
6. The first response from `gemini-code-assist[bot]` is captured for future contract validation.

## Operating Mode

### Normal

- `AI_IMPLEMENTATION_AGENT=claude`
- `AI_REVIEW_AGENT=codex`

### Codex Quota Exhausted

- switch the canonical gating reviewer to `gemini`
- request `/gemini review` manually on the target PR
- use `/gemini summary` for navigation or quick triage only, not as the merge decision signal

## Quota-Exhaustion Playbook

Use this exact sequence when Codex review quota is exhausted for the day:

1. In GitHub repository variables, change `AI_REVIEW_AGENT` from `codex` to `gemini`.
2. Start a fresh PR review cycle by pushing a commit or rerunning `AI Review`; the repository-owned workflow will post a metadata-marked `/gemini review` trigger automatically.
3. If you need to retrigger Gemini on an already-open PR, post `/gemini review` manually from a trusted actor.
4. Wait for the canonical Gemini review result.
5. If the `AI Review` check is still tied to the old reviewer cycle, rerun it after the variable change.
6. Merge only when:
   - `AI Review` is green under the Gemini path
   - any material Gemini findings are resolved or consciously dismissed by a human
   - the normal required checks remain green

The rerun step above is an inference from Capsule Zero's current workflows: `AI Review` reads `AI_REVIEW_AGENT` at execution time, so a previously-started check may still reflect the earlier review cycle. In practice, rerun the workflow from GitHub Actions using `workflow_dispatch` with the PR number, or trigger a fresh PR event by pushing a new commit.

### Return To Normal

- restore `AI_REVIEW_AGENT=codex` when Codex review quota is available again

## Return-To-Normal Playbook

1. Restore `AI_REVIEW_AGENT=codex`.
2. On the next PR or next review cycle, use `@codex review` again as the canonical reviewer trigger.
3. Stop using `/gemini review` unless Codex quota pressure returns.

## Review Expectations

- Gemini should prioritize correctness, regressions, security, data flow, missing tests, and missing durable docs
- style-only feedback remains advisory
- workflow-only pull requests and changes under `.github/workflows/**` should continue to rely on the canonical reviewer because Gemini's GitHub review feature is not a strong fit for that class of change

## Temporary Status

Gemini remains a temporary backend even after gate support is enabled. Codex stays the default review backend, and Gemini is intended only for quota relief until Codex review capacity is available again or a longer-term enterprise Gemini posture is approved.
