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

    [switch]$PromptOnly
)

$ErrorActionPreference = 'Stop'

$repoRoot = (git rev-parse --show-toplevel).Trim()
$featurePath = Join-Path $repoRoot ".specify\specs\$FeatureFolder"
if (-not (Test-Path $featurePath)) {
    throw "Feature folder not found: $featurePath"
}

if (-not (Test-Path $WorktreePath)) {
    throw "Worktree path not found: $WorktreePath"
}

$templatePath = Join-Path $repoRoot '.github\codex\prompts\implementation-worker.md'
if (-not (Test-Path $templatePath)) {
    throw "Codex worker prompt template not found: $templatePath"
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
    "When implementation is complete, publish or reuse the PR with:`n`npowershell -ExecutionPolicy Bypass -File scripts\publish-codex-branch.ps1 -Title '$PullRequestTitle' -FeatureFolder '$FeatureFolder'$draftArg"
}
else {
    'Do not open a pull request automatically unless Codex asks in a follow-up step.'
}

$runtimeSection = @"

## Runtime Worker Context

- Active feature folder: $FeatureFolder
- Assigned branch: $currentBranch
- Assigned worktree: $WorktreePath
- Task id: $(if ($TaskId) { $TaskId } else { 'not provided' })
- Task summary: $TaskSummary

## Runtime Instructions

- Stay inside the assigned worktree and branch only
- Keep the change scoped to this task
- Update `.specify/specs/$FeatureFolder/tasks.md` if task state needs to move
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

$codexCommand = if ($env:CODEX_CLI_PATH) { $env:CODEX_CLI_PATH } else { 'codex' }

Push-Location $WorktreePath
try {
    Get-Content $promptFile -Raw |
        & $codexCommand exec - --color never --ephemeral -C $WorktreePath |
        Tee-Object -FilePath $outputFile
    if ($LASTEXITCODE -ne 0) {
        throw "codex exec failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}

Write-Host "Worker output saved to: $outputFile"
