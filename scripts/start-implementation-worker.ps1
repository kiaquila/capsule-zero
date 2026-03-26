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

$targetRepoRoot = (git -C $WorktreePath rev-parse --show-toplevel 2>&1).Trim()
if (-not $targetRepoRoot -or $LASTEXITCODE -ne 0) {
    throw "Cannot determine repo root from WorktreePath '$WorktreePath'."
}

$agentFile = Join-Path $targetRepoRoot '.codex\implementation-agent'

$agent = 'codex'
if (Test-Path $agentFile) {
    $rawContent = Get-Content $agentFile -Raw
    $fileContent = if ($rawContent) { $rawContent.Trim().ToLowerInvariant() } else { '' }
    if ($fileContent -eq 'codex') {
        $agent = 'codex'
    }
    elseif ($fileContent -eq 'claude') {
        $agent = 'claude'
    }
    else {
        Write-Warning "Unrecognized or empty value '$fileContent' in $agentFile; defaulting to codex."
    }
}

Write-Host "Implementation agent: $agent"

$workerScript = switch ($agent) {
    'codex' { Join-Path $PSScriptRoot 'start-codex-worker.ps1' }
    'claude' { Join-Path $PSScriptRoot 'start-claude-worker.ps1' }
}

$passThrough = @{
    FeatureFolder = $FeatureFolder
    TaskSummary = $TaskSummary
    WorktreePath = $WorktreePath
}

if ($TaskId) { $passThrough['TaskId'] = $TaskId }
if ($PullRequestTitle) { $passThrough['PullRequestTitle'] = $PullRequestTitle }
if ($OpenPullRequest) { $passThrough['OpenPullRequest'] = $true }
if ($DraftPullRequest) { $passThrough['DraftPullRequest'] = $true }
if ($PromptOnly) { $passThrough['PromptOnly'] = $true }

& $workerScript @passThrough
exit $LASTEXITCODE
