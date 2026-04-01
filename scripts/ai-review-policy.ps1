function Resolve-AiReviewOutcome {
    param(
        [Parameter(Mandatory = $true)]
        [psobject]$Result
    )

    $findings = @()
    if ($Result.findings) {
        $findings = @($Result.findings)
    }

    $effectiveVerdict = [string]$Result.verdict
    $policyNote = $null

    $hasBlockingSeverity = $false
    foreach ($finding in $findings) {
        if (@('high', 'medium') -contains [string]$finding.severity) {
            $hasBlockingSeverity = $true
            break
        }
    }

    if ($effectiveVerdict -eq 'request_changes' -and -not $hasBlockingSeverity) {
        $effectiveVerdict = 'comment'
        $policyNote = 'Policy: low-severity-only findings remain advisory, so the effective verdict was downgraded to Comment.'
    }

    [pscustomobject]@{
        EffectiveVerdict = $effectiveVerdict
        Findings = $findings
        PolicyNote = $policyNote
    }
}
