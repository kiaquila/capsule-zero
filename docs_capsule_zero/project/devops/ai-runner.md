# Self-Hosted AI Review Runner

Automated AI review runs on a self-hosted GitHub Actions runner labeled `ai-runner`.

## Setup

1. Create a self-hosted runner in GitHub for this repository.
2. Register it with labels:
   - `self-hosted`
   - `macOS`
   - `ai-runner`
3. Install the Codex CLI and Claude Code CLI for the same macOS user that runs the service.
4. Install PowerShell (`pwsh`) on the machine.
5. Ensure `git`, `gh`, `pwsh`, `codex`, and `claude` are available in `PATH`.
6. Configure Claude authentication for the runner if `AI_REVIEW_AGENT=claude` will be used.
   - Preferred for CI: add GitHub secret `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY`
   - Local fallback: interactive `claude auth login` for the macOS user that runs the service

## Required Repository Variables

- `AI_REVIEW_AGENT`
  - supported values: `codex`, `claude`
  - recommended default: `codex`
- `CODEX_CLI_PATH`
  - optional override for the Codex executable path on the runner, for example `/opt/homebrew/bin/codex`
- `CLAUDE_CLI_PATH`
  - optional override for the Claude executable path on the runner, for example `/opt/homebrew/bin/claude`
- `CLAUDE_REVIEW_MODEL`
  - optional Claude model override for the review adapter, if you want the runner to pin a specific Claude model
- `CLAUDE_REVIEW_DEBUG`
  - optional debug switch for the Claude review adapter, set to `1` while diagnosing runner issues

## Optional Repository Secrets

- `CLAUDE_CODE_OAUTH_TOKEN`
  - recommended for self-hosted runner automation when using a Claude subscription login
  - generate it with `claude setup-token` and store it as a GitHub Actions secret
- `ANTHROPIC_API_KEY`
  - alternative CI auth path if you want the runner to use direct API-key authentication instead of Claude subscription OAuth

## Review Flow

- `.github/workflows/ai-review.yml` passes `AI_REVIEW_AGENT` to `scripts/run-ai-pr-review.ps1`.
- The selector dispatches to the configured reviewer adapter.
- The adapter posts one sticky `<!-- ai-review -->` PR comment and fails only on effective `request_changes`.
- Per-run diagnostics and transcript logs are always printed for debugging.

## Troubleshooting

- If Claude review fails with `Not logged in` on the runner while local `claude auth status` looks healthy, the runner service is missing non-interactive auth. Add `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` as a repository secret and rerun `AI Review`.
- If local `pwsh` crashes immediately with `System.IO.FileLoadException` mentioning `Microsoft.Management.Infrastructure` and a truncated `Culture` field, clear the PowerShell startup caches and retry:
  - `mkdir -p ~/.cache/powershell-backup && mv ~/.cache/powershell/StartupProfileData-NonInteractive ~/.cache/powershell-backup/ 2>/dev/null`
  - `mv ~/.cache/powershell/ModuleAnalysisCache-* ~/.cache/powershell-backup/ 2>/dev/null`
- This failure is outside the repository scripts themselves; the current Capsule Zero scripts work again once the corrupted cache entries are removed.

## Required GitHub Settings

- protect `main`
- require pull requests before merge
- require status checks `baseline-checks`, `guard`, and `AI Review`
- require at least one human approval
- restrict direct pushes to `main`
