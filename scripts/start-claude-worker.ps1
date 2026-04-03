[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$FeatureFolder,

    [Parameter(Mandatory = $true)]
    [string]$TaskSummary,

    [Parameter(Mandatory = $true)]
    [string]$WorktreePath,

    [string]$TaskId,

    [string]$PullRequestTitle,

    [switch]$OpenPullRequest,

    [switch]$DraftPullRequest,

    [switch]$PromptOnly,

    [string[]]$AllowedTools = @('Bash', 'Glob', 'Grep', 'Read', 'Edit', 'Write')
)

$ErrorActionPreference = 'Stop'

function Resolve-ClaudeCommand {
    if ($env:CLAUDE_CLI_PATH) {
        if ($env:CLAUDE_CLI_PATH -eq 'claude' -or (Test-Path $env:CLAUDE_CLI_PATH)) {
            return $env:CLAUDE_CLI_PATH
        }

        throw "Claude CLI not found at CLAUDE_CLI_PATH '$($env:CLAUDE_CLI_PATH)'."
    }

    $command = Get-Command claude -ErrorAction SilentlyContinue
    if ($command -and $command.Source) {
        return $command.Source
    }

    throw 'Claude CLI was not found. Install Claude Code CLI or set CLAUDE_CLI_PATH.'
}

$repoRoot = (git rev-parse --show-toplevel).Trim()
$featurePath = Join-Path $repoRoot ".specify\specs\$FeatureFolder"
$featurePathExists = Test-Path $featurePath

if (-not (Test-Path $WorktreePath)) {
    throw "Worktree path not found: $WorktreePath"
}

$templatePath = Join-Path $repoRoot '.github\claude\prompts\implementation-worker.md'
if (-not (Test-Path $templatePath)) {
    throw "Claude worker prompt template not found: $templatePath"
}

$currentBranch = (git -C $WorktreePath branch --show-current).Trim()
if (-not $currentBranch) {
    throw "Unable to determine branch for worktree: $WorktreePath"
}

$promptDir = Join-Path $WorktreePath '.codex\worker-prompts'
New-Item -ItemType Directory -Force -Path $promptDir | Out-Null

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$promptFile = Join-Path $promptDir "worker-$timestamp.md"
$outputFile = Join-Path $promptDir "worker-$timestamp.out.txt"

$publishGuidance = if ($OpenPullRequest) {
    $draftArg = if ($DraftPullRequest) { ' -Draft' } else { '' }
    "When implementation is complete, publish or reuse the PR with:`n`npowershell -ExecutionPolicy Bypass -File scripts\publish-claude-branch.ps1 -Title '$PullRequestTitle' -FeatureFolder '$FeatureFolder'$draftArg"
}
else {
    'Do not open a pull request automatically unless the runtime task summary explicitly asks for it in a follow-up step.'
}

$taskArtifactGuidance = if ($featurePathExists) {
    'If the feature folder contains `tasks.md` or notes that track task state, update them when the implementation status changes.'
}
else {
    'There is no tracked `.specify/specs/<feature-id>/` folder in this checkout, so use the runtime task summary and tracked durable docs as the governing scope.'
}

$runtimeSection = @"

## Runtime Worker Context

- Active feature scope: $FeatureFolder
- Assigned branch: $currentBranch
- Assigned worktree: $WorktreePath
- Task id: $(if ($TaskId) { $TaskId } else { 'not provided' })
- Task summary: $TaskSummary

## Runtime Instructions

- Stay inside the assigned worktree and branch only
- Keep the change scoped to this task
- $taskArtifactGuidance
- Run relevant validation before finishing
- Commit your changes locally when the task is complete
- $publishGuidance
"@

$promptText = (Get-Content $templatePath -Raw) + $runtimeSection
Set-Content -Path $promptFile -Value $promptText

if ($PromptOnly) {
    Write-Host "Prompt file: $promptFile"
    return
}

$claudeCommand = Resolve-ClaudeCommand
$allowedToolsArg = $AllowedTools -join ','
$claudeArgs = @(
    '-p',
    '-',
    '--output-format',
    'text',
    '--permission-mode',
    'bypassPermissions',
    '--allowedTools',
    $allowedToolsArg
)

if ($env:CLAUDE_WORKER_MODEL) {
    $claudeArgs += @('--model', $env:CLAUDE_WORKER_MODEL)
}
elseif ($env:CLAUDE_MODEL) {
    $claudeArgs += @('--model', $env:CLAUDE_MODEL)
}

if ($env:CLAUDE_MAX_BUDGET_USD) {
    $claudeArgs += @('--max-budget-usd', $env:CLAUDE_MAX_BUDGET_USD)
}

Push-Location $WorktreePath
try {
    Get-Content $promptFile -Raw |
        & $claudeCommand @claudeArgs |
        Tee-Object -FilePath $outputFile
    if ($LASTEXITCODE -ne 0) {
        throw "claude -p failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}

Write-Host "Worker output saved to: $outputFile"
