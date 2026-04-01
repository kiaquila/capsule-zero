$ErrorActionPreference = 'Stop'

$tempRoot = if ($env:RUNNER_TEMP) { $env:RUNNER_TEMP } else { $env:TEMP }
$diagnosticPath = Join-Path $tempRoot 'ai-review-diagnostics.log'
$transcriptPath = Join-Path $tempRoot 'ai-review-transcript.log'
$rawOutputPath = Join-Path $tempRoot 'ai-review-raw-output.log'
$publicDiagnosticPath = Join-Path $tempRoot 'ai-review-public-diagnostics.log'
$publicRawExcerptPath = Join-Path $tempRoot 'ai-review-public-raw-excerpt.log'
$claudeStderrPath = Join-Path $tempRoot 'ai-review-claude-stderr.log'
$claudeDebugPath = Join-Path $tempRoot 'ai-review-claude-debug.log'

. (Join-Path $PSScriptRoot 'ai-review-policy.ps1')
. (Join-Path $PSScriptRoot 'ai-review-comment.ps1')
. (Join-Path $PSScriptRoot 'claude-review-output.ps1')

function Resolve-ClaudeCommand {
    if ($env:CLAUDE_CLI_PATH) {
        if ($env:CLAUDE_CLI_PATH -eq 'claude' -or (Test-Path $env:CLAUDE_CLI_PATH)) {
            return $env:CLAUDE_CLI_PATH
        }

        throw "CLAUDE_CLI_PATH does not exist: $($env:CLAUDE_CLI_PATH)"
    }

    $command = Get-Command claude -ErrorAction SilentlyContinue
    if ($command -and $command.Source) {
        return $command.Source
    }

    throw 'Claude CLI was not found. Install Claude Code CLI or set CLAUDE_CLI_PATH.'
}

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

try {
    Remove-Item $diagnosticPath, $transcriptPath, $rawOutputPath, $publicDiagnosticPath, $publicRawExcerptPath, $claudeStderrPath, $claudeDebugPath -Force -ErrorAction SilentlyContinue
    New-Item -ItemType File -Path $diagnosticPath -Force | Out-Null
    Start-Transcript -Path $transcriptPath -Force | Out-Null

    $repoRoot = (Get-Location).Path
    $eventPath = $env:GITHUB_EVENT_PATH
    $githubToken = $env:GITHUB_TOKEN
    $repository = $env:GITHUB_REPOSITORY
    $marker = '<!-- ai-review -->'
    $legacyMarker = '<!-- codex-ai-review -->'
    $agentLabel = 'Claude'
    $claudeCommand = Resolve-ClaudeCommand

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
    $diffBlock = git diff --unified=3 $baseSha $headSha
    if (-not $diffBlock) {
        $diffBlock = '(no diff reported)'
    }

    $contextFiles = @(
        'AGENTS.md',
        'CLAUDE.md',
        '.specify/memory/constitution.md',
        'docs_capsule_zero/project/frontend/frontend-docs.md',
        'docs_capsule_zero/project/backend/backend-docs.md',
        'docs_capsule_zero/project/devops/ai-pr-workflow.md',
        'docs_capsule_zero/project/devops/ai-runner.md'
    )

    $adrFiles = Get-ChildItem (Join-Path $repoRoot 'docs_capsule_zero\adr') -Filter '*.md' | Sort-Object Name | ForEach-Object {
        $_.FullName.Substring($repoRoot.Length + 1)
    }

    $specFiles = @()
    if ($changedFiles) {
        $specFiles = $changedFiles | Where-Object {
            $_ -like '.specify/specs/*/spec.md' -or
            $_ -like '.specify/specs/*/prototype-map.md' -or
            $_ -like 'docs_capsule_zero/features/*.md' -or
            $_ -like 'docs_capsule_zero/screens/*.md'
        }
    }

    $governingFiles = @($contextFiles + $adrFiles + $specFiles) | Where-Object { $_ } | Select-Object -Unique
    $contextBlocks = foreach ($relativePath in $governingFiles) {
        $normalizedPath = $relativePath -replace '^[.][\\/]', ''
        $fullPath = Join-Path $repoRoot $normalizedPath
        if (Test-Path $fullPath) {
            @(
                "### File: $normalizedPath",
                (Get-Content $fullPath -Raw)
            ) -join [Environment]::NewLine
        }
    }
    $contextBlock = if ($contextBlocks) { $contextBlocks -join ([Environment]::NewLine + [Environment]::NewLine) } else { 'No governing context files were loaded.' }

    $runtimePrompt = Join-Path $tempRoot 'claude-review-prompt.md'
    $templatePrompt = Join-Path $repoRoot '.github\claude\prompts\pr-review.md'
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

## Governing Context

$contextBlock

## Unified Diff

$diffBlock
"@
    Set-Content -Path $runtimePrompt -Value ($template + $runtimeSection)
    $promptText = (Get-Content $runtimePrompt -Raw).Trim()
    Write-Diagnostic "Claude review prompt bytes=$([Text.Encoding]::UTF8.GetByteCount($promptText))"

    $claudeArgs = @(
        '-p',
        '-',
        '--output-format',
        'text',
        '--permission-mode',
        'default',
        '--tools',
        '""'
    )

    if ($env:CLAUDE_REVIEW_MODEL) {
        $claudeArgs += @('--model', $env:CLAUDE_REVIEW_MODEL)
    }
    elseif ($env:CLAUDE_MODEL) {
        $claudeArgs += @('--model', $env:CLAUDE_MODEL)
    }

    if ($env:CLAUDE_REVIEW_MAX_BUDGET_USD) {
        $claudeArgs += @('--max-budget-usd', $env:CLAUDE_REVIEW_MAX_BUDGET_USD)
    }

    if ($env:CLAUDE_REVIEW_DEBUG -eq '1') {
        $claudeArgs += @('--debug-file', $claudeDebugPath)
    }

    Write-Diagnostic 'Running local Claude CLI review'
    Write-Diagnostic ("Claude args: " + (($claudeArgs | ForEach-Object { [string]$_ }) -join ' '))
    $resultText = $promptText | & $claudeCommand @claudeArgs 2>$claudeStderrPath

    if ($resultText -is [System.Array]) {
        $resultText = ($resultText | ForEach-Object { [string]$_ }) -join [Environment]::NewLine
    }
    else {
        $resultText = [string]$resultText
    }

    Set-Content -Path $rawOutputPath -Value $resultText

    if ($LASTEXITCODE -ne 0) {
        Write-Diagnostic ("Claude failure output preview: " + (Get-ClaudeReviewOutputPreview -Text $resultText))
        if (Test-Path $claudeStderrPath) {
            $stderrPreview = Get-Content $claudeStderrPath -Raw
            if ($stderrPreview) {
                Write-Diagnostic ("Claude stderr preview: " + (Get-ClaudeReviewOutputPreview -Text $stderrPreview))
            }
        }
        if (Test-Path $claudeDebugPath) {
            Write-Diagnostic "Claude debug file: $claudeDebugPath"
        }
        throw "Claude CLI review failed with exit code $LASTEXITCODE."
    }

    Write-Diagnostic ("Claude output preview: " + (Get-ClaudeReviewOutputPreview -Text $resultText))

    $parsedOutput = ConvertFrom-ClaudeReviewOutput -RawText $resultText
    $result = $parsedOutput.Result
    foreach ($note in @($parsedOutput.NormalizationNotes)) {
        Write-Diagnostic $note
    }

    Assert-ClaudeReviewResultContract -Result $result

    $outcome = Resolve-AiReviewOutcome -Result $result
    $findings = $outcome.Findings

    if ($outcome.PolicyNote) {
        Write-Diagnostic $outcome.PolicyNote
    }

    Write-Diagnostic "Review verdict=$($result.verdict); effectiveVerdict=$($outcome.EffectiveVerdict); findings=$($findings.Count)"

    $verdictLabel = switch ($outcome.EffectiveVerdict) {
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
                "$index. [$($_.severity)] $($_.title)",
                "Location: $location",
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

Agent: **$agentLabel**
Verdict: **$verdictLabel**
$(
    if ($outcome.PolicyNote) {
        "`r`n$($outcome.PolicyNote)"
    }
)

### Summary
$($result.summary)

### Findings
$findingsBlock
"@

    $commentsUrl = "https://api.github.com/repos/$repository/issues/$prNumber/comments"
    $comments = Invoke-RestMethod -Headers $headers -Uri $commentsUrl -Method Get
    $existing = $comments | Where-Object { $_.body -like "*$marker*" -or $_.body -like "*$legacyMarker*" } | Select-Object -First 1
    $commentPayload = ConvertTo-GitHubIssueCommentPayload -Body $body

    if ($existing) {
        Invoke-RestMethod -Headers $headers -Uri "https://api.github.com/repos/$repository/issues/comments/$($existing.id)" -Method Patch -Body $commentPayload.Payload -ContentType 'application/json; charset=utf-8' | Out-Null
    }
    else {
        Invoke-RestMethod -Headers $headers -Uri $commentsUrl -Method Post -Body $commentPayload.Payload -ContentType 'application/json; charset=utf-8' | Out-Null
    }

    if ($outcome.EffectiveVerdict -eq 'request_changes') {
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

    if (Test-Path $claudeStderrPath) {
        $stderrContent = Get-Content $claudeStderrPath -Raw
        if ($stderrContent) {
            $sanitizedStderr = Sanitize-Text -Value $stderrContent -ExactPaths $exactPaths
            Write-Host '--- claude-stderr (sanitized) ---'
            Write-Host $sanitizedStderr
        }
    }

    if (Test-Path $claudeDebugPath) {
        $debugContent = Get-Content $claudeDebugPath -Raw
        if ($debugContent) {
            $sanitizedDebug = Sanitize-Text -Value $debugContent -ExactPaths $exactPaths
            $debugExcerptLines = @($sanitizedDebug -split "`r?`n" | Select-Object -Last 80)
            $debugExcerpt = $debugExcerptLines -join [Environment]::NewLine
            Write-Host '--- claude-debug (sanitized excerpt) ---'
            Write-Host $debugExcerpt
        }
    }

    if ($transcriptPath -and (Test-Path $transcriptPath)) {
        Stop-Transcript | Out-Null
    }
}
