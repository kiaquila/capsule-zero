$ErrorActionPreference = 'Stop'

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

$sample = @'
repo=/Users/kristina.kurashova/projects/capsule-zero
home=/Users/kristina.kurashova
linux=/home/kristina/workspace
windows=C:\Users\Kristina\runner
token=ghp_abcdefghijklmnopqrstuvwxyz
bearer=Bearer abcdefghijklmnopqrstuvwxyz
email=test.user@example.com
'@

$sanitized = Sanitize-Text -Value $sample -ExactPaths @('/Users/kristina.kurashova/projects/capsule-zero')

$expectedFragments = @(
    'repo=[redacted-path]',
    'home=/Users/xxxx',
    'linux=/home/xxxx/workspace',
    'windows=C:\Users\xxxx\runner',
    'token=[redacted-token]',
    'bearer=Bearer [redacted]',
    'email=[redacted-email]'
)

foreach ($fragment in $expectedFragments) {
    if ($sanitized -notmatch [Regex]::Escape($fragment)) {
        throw "Missing expected sanitized fragment: $fragment"
    }
}

$forbiddenFragments = @(
    '/Users/kristina.kurashova',
    '/home/kristina',
    'ghp_abcdefghijklmnopqrstuvwxyz',
    'test.user@example.com'
)

foreach ($fragment in $forbiddenFragments) {
    if ($sanitized -match [Regex]::Escape($fragment)) {
        throw "Unsanitized fragment still present: $fragment"
    }
}

Write-Host 'sanitization_ok'
Write-Host $sanitized
