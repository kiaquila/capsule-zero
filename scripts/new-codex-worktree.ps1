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

$featurePath = Join-Path $repoRoot ".specify\specs\$FeatureFolder"
if (-not (Test-Path $featurePath)) {
    throw "Feature folder not found: $featurePath"
}

if (-not $WorktreeRoot) {
    $WorktreeRoot = Join-Path (Split-Path $repoRoot -Parent) 'codex-workers'
}

New-Item -ItemType Directory -Force -Path $WorktreeRoot | Out-Null

$featureSlug = Normalize-Slug $FeatureFolder
$taskSlugNormalized = Normalize-Slug $TaskSlug

if (-not $BranchName) {
    $BranchName = "codex/$featureSlug-$taskSlugNormalized"
}

$worktreeFolderName = $BranchName -replace '[\\/]', '__'
$worktreePath = Join-Path $WorktreeRoot $worktreeFolderName

git fetch --no-tags origin $BaseBranch | Out-Null

$localBranchExists = (git branch --list $BranchName)
$remoteBranchExists = (git branch -r --list "origin/$BranchName")

if (Test-Path $worktreePath) {
    throw "Worktree path already exists: $worktreePath"
}

if ($PSCmdlet.ShouldProcess($worktreePath, "Create worktree for $BranchName")) {
    if ($localBranchExists -or $remoteBranchExists) {
        git worktree add $worktreePath $BranchName | Out-Null
    }
    else {
        git worktree add -b $BranchName $worktreePath "origin/$BaseBranch" | Out-Null
    }
}

Write-Host "Feature folder: $FeatureFolder"
Write-Host "Branch: $BranchName"
Write-Host "Worktree: $worktreePath"
