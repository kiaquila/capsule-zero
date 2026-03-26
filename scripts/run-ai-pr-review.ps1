$ErrorActionPreference = 'Stop'

$requestedAgent = ''
if ($env:AI_REVIEW_AGENT) {
    $requestedAgent = $env:AI_REVIEW_AGENT.Trim().ToLowerInvariant()
}

$selectedAgent = switch ($requestedAgent) {
    'claude' { 'claude' }
    'codex' { 'codex' }
    default { 'codex' }
}

if ($selectedAgent -ne $requestedAgent) {
    if ([string]::IsNullOrWhiteSpace($requestedAgent)) {
        Write-Host 'AI_REVIEW_AGENT is not set; defaulting to codex.'
    }
    else {
        Write-Host "AI_REVIEW_AGENT='$requestedAgent' is invalid; defaulting to codex."
    }
}

$scriptPath = switch ($selectedAgent) {
    'claude' { '.\scripts\run-claude-pr-review.ps1' }
    'codex' { '.\scripts\run-codex-pr-review.ps1' }
}

& $scriptPath
exit $LASTEXITCODE
