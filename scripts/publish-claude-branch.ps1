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

$scriptPath = Join-Path $PSScriptRoot 'publish-worker-branch.ps1'
& $scriptPath @PSBoundParameters
exit $LASTEXITCODE
