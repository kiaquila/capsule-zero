function Get-ClaudeReviewOutputPreview {
    param(
        [Parameter(Mandatory = $true)]
        [AllowNull()]
        $Text,

        [int]$MaxLength = 500
    )

    if ($null -eq $Text) {
        return ''
    }

    if ($Text -is [System.Array]) {
        $Text = ($Text | ForEach-Object { [string]$_ }) -join [Environment]::NewLine
    }
    else {
        $Text = [string]$Text
    }

    if ([string]::IsNullOrEmpty($Text)) {
        return ''
    }

    $normalized = $Text -replace "\s+", ' '
    if ($normalized.Length -le $MaxLength) {
        return $normalized
    }

    return $normalized.Substring(0, $MaxLength) + '...'
}

function ConvertFrom-ClaudeReviewOutput {
    param(
        [Parameter(Mandatory = $true)]
        [AllowNull()]
        $RawText
    )

    if ($null -eq $RawText) {
        throw 'Claude review output was empty.'
    }

    if ($RawText -is [System.Array]) {
        $RawText = ($RawText | ForEach-Object { [string]$_ }) -join [Environment]::NewLine
    }
    else {
        $RawText = [string]$RawText
    }

    $resultText = $RawText.Trim()
    if (-not $resultText) {
        throw 'Claude review output was empty.'
    }

    if ($resultText.StartsWith('```')) {
        $resultText = ($resultText -replace '^```[a-zA-Z0-9_-]*\s*', '' -replace '\s*```$', '').Trim()
    }

    if (-not $resultText.StartsWith('{')) {
        $jsonStart = $resultText.IndexOf('{')
        $jsonEnd = $resultText.LastIndexOf('}')
        if ($jsonStart -ge 0 -and $jsonEnd -gt $jsonStart) {
            $resultText = $resultText.Substring($jsonStart, ($jsonEnd - $jsonStart + 1)).Trim()
        }
    }

    try {
        $result = $resultText | ConvertFrom-Json
    }
    catch {
        throw "Claude review output was not valid JSON: $resultText"
    }

    if (
        $result.PSObject.Properties['review'] -and
        $result.review -is [psobject] -and
        -not $result.PSObject.Properties['summary'] -and
        -not $result.PSObject.Properties['verdict'] -and
        -not $result.PSObject.Properties['findings']
    ) {
        $result = $result.review
        $normalizationNotes = @("Unwrapped nested Claude review field 'review'.")
    }
    else {
        $normalizationNotes = @()
    }

    $verdictAliases = @('action', 'review_status', 'review_action', 'review_decision')
    foreach ($alias in $verdictAliases) {
        if (-not $result.PSObject.Properties['verdict'] -and $result.PSObject.Properties[$alias]) {
            $aliasValue = [string]$result.$alias
            if (@('approve', 'comment', 'request_changes') -contains $aliasValue) {
                $result | Add-Member -NotePropertyName verdict -NotePropertyValue $aliasValue
                $normalizationNotes += "Normalized Claude review field '$alias' to 'verdict'."
            }
        }
    }

    [pscustomobject]@{
        Result = $result
        NormalizationNotes = $normalizationNotes
    }
}

function Assert-ClaudeReviewResultContract {
    param(
        [Parameter(Mandatory = $true)]
        [psobject]$Result
    )

    if (-not $Result.summary -or -not $Result.verdict) {
        throw 'Claude review output is missing required fields.'
    }

    if (@('approve', 'comment', 'request_changes') -notcontains [string]$Result.verdict) {
        throw "Claude review output contains an invalid verdict: $($Result.verdict)"
    }

    $findings = @()
    if ($Result.findings) {
        $findings = @($Result.findings)
    }

    foreach ($finding in $findings) {
        $hasLineProperty = $finding.PSObject.Properties.Name -contains 'line'
        if (-not $finding.severity -or -not $finding.file -or -not $hasLineProperty -or -not $finding.title -or -not $finding.body) {
            throw 'Claude review output contains a finding with missing required fields.'
        }

        $lineNumber = $finding.line -as [int]
        if ($null -ne $finding.line -and $null -eq $lineNumber) {
            throw 'Claude review output contains a finding with a non-integer line number.'
        }
        if ($null -ne $lineNumber -and $lineNumber -lt 1) {
            throw 'Claude review output contains a finding with an invalid line number.'
        }
    }
}
