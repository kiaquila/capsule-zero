[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory = $true)]
    [string]$Title,

    [string]$FeatureFolder,

    [string]$BaseBranch = 'main',

    [string]$HeadBranch,

    [string]$BodyFile,

    [switch]$Draft
)

$ErrorActionPreference = 'Stop'

$repoRoot = (git rev-parse --show-toplevel).Trim()
Set-Location $repoRoot

if (-not $HeadBranch) {
    $HeadBranch = (git branch --show-current).Trim()
}

if (-not $HeadBranch) {
    throw 'Unable to determine the current branch.'
}

if ($HeadBranch -eq 'main') {
    throw 'Refusing to publish from main.'
}

$body = if ($BodyFile -and (Test-Path $BodyFile)) {
    Get-Content $BodyFile -Raw
}
else {
@"
Feature folder: $FeatureFolder

Automated implementation worker pull request.

- Validation: documented in commits or follow-up comments
- Risks: review branch summary before merge
"@
}

if ($PSCmdlet.ShouldProcess($HeadBranch, 'Push branch to origin')) {
    git push -u origin $HeadBranch | Out-Null
}

$ghArgs = @('pr', 'create', '--base', $BaseBranch, '--head', $HeadBranch, '--title', $Title, '--body', $body)
if ($Draft) {
    $ghArgs += '--draft'
}

if ($PSCmdlet.ShouldProcess($HeadBranch, 'Create or reuse pull request')) {
    & gh @ghArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'PR create failed, attempting to show an existing PR for this branch.'
        & gh pr view $HeadBranch --json url --jq '.url'
        if ($LASTEXITCODE -ne 0) {
            throw "Unable to create or resolve pull request for branch $HeadBranch"
        }
    }
}
