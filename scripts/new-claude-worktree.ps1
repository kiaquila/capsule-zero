[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory = $true)]
    [string]$FeatureFolder,

    [Parameter(Mandatory = $true)]
    [string]$TaskSlug,

    [string]$BaseBranch = 'main',

    [string]$BranchName,

    [string]$WorktreeRoot
)

$ErrorActionPreference = 'Stop'

function Normalize-Slug {
    param([string]$Value)

    $normalized = $Value.ToLowerInvariant() -replace '[^a-z0-9\-]+', '-' -replace '-{2,}', '-'
    return $normalized.Trim('-')
}

$repoRoot = (git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
    throw 'Unable to determine repository root.'
}

if (-not $WorktreeRoot) {
    $WorktreeRoot = Join-Path (Split-Path $repoRoot -Parent) 'claude-workers'
}

if (-not $BranchName) {
    $featureSlug = Normalize-Slug $FeatureFolder
    $taskSlugNormalized = Normalize-Slug $TaskSlug
    $BranchName = "codex/claude-$featureSlug-$taskSlugNormalized"
}

$scriptPath = Join-Path $PSScriptRoot 'new-codex-worktree.ps1'
$forwardArgs = @{
    FeatureFolder = $FeatureFolder
    TaskSlug = $TaskSlug
    BaseBranch = $BaseBranch
    BranchName = $BranchName
    WorktreeRoot = $WorktreeRoot
}

& $scriptPath @forwardArgs
exit $LASTEXITCODE
