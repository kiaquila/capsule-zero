$ErrorActionPreference = 'Stop'

$tempRoot = if ($env:RUNNER_TEMP) { $env:RUNNER_TEMP } else { $env:TEMP }
$diagnosticPath = Join-Path $tempRoot 'ai-review-diagnostics.log'
$transcriptPath = Join-Path $tempRoot 'ai-review-transcript.log'
$rawOutputPath = Join-Path $tempRoot 'ai-review-raw-output.log'
$outputPath = Join-Path $tempRoot 'ai-review-output.json'
$publicDiagnosticPath = Join-Path $tempRoot 'ai-review-public-diagnostics.log'
$publicRawExcerptPath = Join-Path $tempRoot 'ai-review-public-raw-excerpt.log'

function Sanitize-Text {
    param(
        [AllowNull()]
        [string]$Value,
        [string[]]$ExactPaths = @()
    )

    if ($null -eq $Value) {
        return ''
    }

    $sanitized = $Value

    foreach ($path in ($ExactPaths | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })) {
        $escapedPath = [Regex]::Escape($path)
        $sanitized = [Regex]::Replace($sanitized, $escapedPath, '[redacted-path]')
    }

    $patterns = @(
        @{ Pattern = '(?i)/Users/[^/\s]+'; Replacement = '/Users/xxxx' },
        @{ Pattern = '(?i)/home/[^/\s]+'; Replacement = '/home/xxxx' },
        @{ Pattern = '(?i)C:\\Users\\[^\\\s]+'; Replacement = 'C:\Users\xxxx' },
        @{ Pattern = '(?i)(Bearer\s+)[A-Za-z0-9_\-\.]+'; Replacement = '$1[redacted]' },
        @{ Pattern = '(?i)\b(gh[pousr]_[A-Za-z0-9_]+)\b'; Replacement = '[redacted-token]' },
        @{ Pattern = '(?i)\bgithub_pat_[A-Za-z0-9_]+\b'; Replacement = '[redacted-token]' },
        @{ Pattern = '(?i)\bsk-[A-Za-z0-9_\-]+\b'; Replacement = '[redacted-token]' },
        @{ Pattern = '(?i)[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'; Replacement = '[redacted-email]' }
    )

    foreach ($pattern in $patterns) {
        $sanitized = [Regex]::Replace($sanitized, $pattern.Pattern, $pattern.Replacement)
    }

    return $sanitized
}

function Write-SanitizedFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourcePath,
        [Parameter(Mandatory = $true)]
        [string]$DestinationPath,
        [string[]]$ExactPaths = @()
    )

    if (-not (Test-Path $SourcePath)) {
        return
    }

    $content = Get-Content $SourcePath -Raw
    $sanitized = Sanitize-Text -Value $content -ExactPaths $ExactPaths
    Set-Content -Path $DestinationPath -Value $sanitized
}

function Write-Diagnostic {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    $timestamp = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffK'
    $line = "[$timestamp] $Message"
    Write-Host $line
    Add-Content -Path $diagnosticPath -Value $line
}

function Escape-Json {
    param([string]$Value)

    if ($null -eq $Value) { return '' }
    return ($Value | ConvertTo-Json -Compress)
}

try {
    Remove-Item $diagnosticPath, $transcriptPath, $rawOutputPath, $outputPath, $publicDiagnosticPath, $publicRawExcerptPath -Force -ErrorAction SilentlyContinue
    New-Item -ItemType File -Path $diagnosticPath -Force | Out-Null
    Start-Transcript -Path $transcriptPath -Force | Out-Null

    $repoRoot = (Get-Location).Path
    $eventPath = $env:GITHUB_EVENT_PATH
    $githubToken = $env:GITHUB_TOKEN
    $repository = $env:GITHUB_REPOSITORY
    $marker = '<!-- ai-review -->'
    $legacyMarker = '<!-- codex-ai-review -->'

    if (-not $eventPath -or -not (Test-Path $eventPath)) {
        throw 'GITHUB_EVENT_PATH is missing. This script must run inside GitHub Actions.'
    }
    if (-not $githubToken) {
        throw 'GITHUB_TOKEN is missing.'
    }
    if (-not $repository) {
        throw 'GITHUB_REPOSITORY is missing.'
    }

    $headers = @{
        Authorization = "Bearer $githubToken"
        Accept = 'application/vnd.github+json'
        'X-GitHub-Api-Version' = '2022-11-28'
    }

    $event = Get-Content $eventPath -Raw | ConvertFrom-Json
    $pullRequest = $event.pull_request
    if (-not $pullRequest) {
        if (-not $env:PR_NUMBER) {
            throw 'This workflow expects a pull_request event or PR_NUMBER when dispatched manually.'
        }
        $pullRequest = Invoke-RestMethod -Headers $headers -Uri "https://api.github.com/repos/$repository/pulls/$($env:PR_NUMBER)"
    }

    $prNumber = [string]$pullRequest.number
    $baseRef = [string]$pullRequest.base.ref
    $headRef = [string]$pullRequest.head.ref
    $baseSha = [string]$pullRequest.base.sha
    $headSha = [string]$pullRequest.head.sha

    Write-Diagnostic "Preparing review context for PR #$prNumber ($baseSha..$headSha)"

    git fetch --no-tags origin $baseRef | Out-Null
    git fetch --no-tags origin "+refs/pull/$prNumber/head:refs/remotes/origin/pr/$prNumber" | Out-Null

    $changedFiles = git diff --name-only $baseSha $headSha
    $changedFilesBlock = if ($changedFiles) { $changedFiles -join [Environment]::NewLine } else { '(no changed files reported)' }

    $runtimePrompt = Join-Path $tempRoot 'ai-review-prompt.md'
    $templatePrompt = Join-Path $repoRoot '.github\codex\prompts\pr-review.md'
    $schemaPath = Join-Path $repoRoot '.github\review\schemas\pr-review.schema.json'

    $template = Get-Content $templatePrompt -Raw
    $runtimeSection = @"

## Runtime PR Context

- Repository: $repository
- PR number: $prNumber
- Base ref: $baseRef
- Head ref: $headRef
- Base SHA: $baseSha
- Head SHA: $headSha
- PR title: $($pullRequest.title)

### Changed Files
$changedFilesBlock

Review the git diff between $baseSha and $headSha only, but use the repository docs and specs as governing context.
You may inspect repository files and run read-only git commands if needed.
"@
    Set-Content -Path $runtimePrompt -Value ($template + $runtimeSection)

    $codexCommand = if ($env:CODEX_CLI_PATH) { $env:CODEX_CLI_PATH } else { 'codex' }
    Write-Diagnostic 'Running local Codex CLI review'
    Get-Content $runtimePrompt -Raw |
        & $codexCommand exec - --output-schema $schemaPath --output-last-message $outputPath --sandbox read-only --color never --ephemeral -C $repoRoot 2>&1 |
        Tee-Object -FilePath $rawOutputPath

    if ($LASTEXITCODE -ne 0) {
        throw "codex exec failed with exit code $LASTEXITCODE"
    }
    if (-not (Test-Path $outputPath)) {
        throw 'AI review did not produce an output file.'
    }

    $result = Get-Content $outputPath -Raw | ConvertFrom-Json
    if (-not $result.summary -or -not $result.verdict) {
        throw 'AI review output is missing required fields.'
    }

    $findings = @($result.findings)
    $effectiveVerdict = [string]$result.verdict
    if ($effectiveVerdict -eq 'request_changes') {
        $blockingFindings = @($findings | Where-Object { $_.severity -ne 'low' })
        if ($blockingFindings.Count -eq 0) {
            $effectiveVerdict = 'comment'
        }
    }

    Write-Diagnostic "Review verdict=$($result.verdict); effectiveVerdict=$effectiveVerdict; findings=$($findings.Count)"

    $verdictLabel = switch ($effectiveVerdict) {
        'approve' { 'Approve' }
        'comment' { 'Comment' }
        'request_changes' { 'Request changes' }
        default { 'Comment' }
    }

    if ($findings.Count -gt 0) {
        $index = 0
        $findingsBlock = ($findings | ForEach-Object {
            $index += 1
            $location = if ($_.line) { "$($_.file):$($_.line)" } else { [string]$_.file }
            @(
                "$index. [$($_.severity)] $($_.title)"
                "Location: $location"
                [string]$_.body
            ) -join [Environment]::NewLine
        }) -join ([Environment]::NewLine + [Environment]::NewLine)
    }
    else {
        $findingsBlock = 'No review findings.'
    }

    $body = @"
$marker
## AI Review

Agent: **Codex**
Verdict: **$verdictLabel**

### Summary
$($result.summary)

### Findings
$findingsBlock
"@

    $commentsUrl = "https://api.github.com/repos/$repository/issues/$prNumber/comments"
    $comments = Invoke-RestMethod -Headers $headers -Uri $commentsUrl -Method Get
    $existing = $comments | Where-Object { $_.body -like "*$marker*" -or $_.body -like "*$legacyMarker*" } | Select-Object -First 1
    $commentPayload = @{ body = $body } | ConvertTo-Json -Compress

    if ($existing) {
        Invoke-RestMethod -Headers $headers -Uri "https://api.github.com/repos/$repository/issues/comments/$($existing.id)" -Method Patch -Body $commentPayload -ContentType 'application/json; charset=utf-8' | Out-Null
    }
    else {
        Invoke-RestMethod -Headers $headers -Uri $commentsUrl -Method Post -Body $commentPayload -ContentType 'application/json; charset=utf-8' | Out-Null
    }

    if ($effectiveVerdict -eq 'request_changes') {
        throw 'AI review requested changes.'
    }
}
finally {
    $exactPaths = @($repoRoot, $tempRoot, $eventPath)

    if (Test-Path $diagnosticPath) {
        Write-SanitizedFile -SourcePath $diagnosticPath -DestinationPath $publicDiagnosticPath -ExactPaths $exactPaths
    }

    if (Test-Path $rawOutputPath) {
        $rawContent = Get-Content $rawOutputPath -Raw
        $excerptLines = @($rawContent -split "`r?`n" | Select-Object -Last 40)
        $excerpt = $excerptLines -join [Environment]::NewLine
        $sanitizedExcerpt = Sanitize-Text -Value $excerpt -ExactPaths $exactPaths
        Set-Content -Path $publicRawExcerptPath -Value $sanitizedExcerpt
    }

    if ($transcriptPath -and (Test-Path $transcriptPath)) {
        Stop-Transcript | Out-Null
    }
}
