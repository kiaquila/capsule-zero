[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('claude', 'codex')]
    [string]$Agent,

    [string]$Repo
)

$ErrorActionPreference = 'Stop'

$repoRoot = (git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
    throw 'Unable to determine repository root.'
}

$codexDir = Join-Path $repoRoot '.codex'
$agentFile = Join-Path $codexDir 'implementation-agent'

if ($PSCmdlet.ShouldProcess($agentFile, "Write implementation agent '$Agent'")) {
    New-Item -ItemType Directory -Force -Path $codexDir | Out-Null
    Set-Content -Path $agentFile -Value $Agent -NoNewline
    Write-Host "Implementation agent set to '$Agent' in $agentFile"
}

if ($PSCmdlet.ShouldProcess('AI_REVIEW_AGENT', "Set repo variable to '$Agent'")) {
    $ghArgs = @('variable', 'set', 'AI_REVIEW_AGENT', '--body', $Agent)
    if ($Repo) {
        $ghArgs += '--repo'
        $ghArgs += $Repo
    }
    & gh @ghArgs
    if ($LASTEXITCODE -ne 0) {
        throw "gh variable set failed with exit code $LASTEXITCODE"
    }
    Write-Host "Repo variable AI_REVIEW_AGENT set to '$Agent'"
}
