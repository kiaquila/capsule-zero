# Self-Hosted AI Review Runner

Automated AI review runs on a self-hosted GitHub Actions runner labeled `ai-runner`.

## Setup

1. Create a self-hosted runner in GitHub for this repository.
2. Register it with labels:
   - `self-hosted`
   - `macOS`
   - `ai-runner`
3. Install the Codex CLI for the same macOS user that runs the service.
4. Install PowerShell (`pwsh`) on the machine.
5. Ensure `git`, `gh`, `pwsh`, and `codex` are available in `PATH`.

## Required Repository Variables

- `AI_REVIEW_AGENT`
  - recommended default: `codex`
- `CODEX_CLI_PATH`
  - optional override for the Codex executable path on the runner, for example `/opt/homebrew/bin/codex`

## Review Flow

- `.github/workflows/ai-review.yml` passes `AI_REVIEW_AGENT` to `scripts/run-ai-pr-review.ps1`.
- The selector dispatches to the configured reviewer adapter.
- The adapter posts one sticky `<!-- ai-review -->` PR comment and fails only on effective `request_changes`.
- Per-run diagnostics and transcript logs are always printed for debugging.

## Required GitHub Settings

- protect `main`
- require pull requests before merge
- require status checks `baseline-checks`, `guard`, and `AI Review`
- require at least one human approval
- restrict direct pushes to `main`
