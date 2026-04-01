function ConvertTo-GitHubIssueCommentPayload {
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Body,

        [int]$MaxBodyLength = 60000
    )

    if ($MaxBodyLength -lt 32) {
        throw 'MaxBodyLength must be at least 32 characters.'
    }

    $sanitizedChars = foreach ($char in $Body.ToCharArray()) {
        $codePoint = [int][char]$char
        if ($char -eq "`r" -or $char -eq "`n" -or $char -eq "`t" -or $codePoint -ge 32) {
            $char
        }
    }

    $normalizedBody = (-join $sanitizedChars) -replace "(?<!`r)`n", "`r`n"
    $wasTruncated = $false

    if ($normalizedBody.Length -gt $MaxBodyLength) {
        $suffix = "`r`n`r`n[truncated to fit GitHub comment limits]"
        $keepLength = $MaxBodyLength - $suffix.Length
        if ($keepLength -lt 0) {
            $keepLength = 0
        }
        $normalizedBody = $normalizedBody.Substring(0, $keepLength) + $suffix
        $wasTruncated = $true
    }

    [pscustomobject]@{
        Body = $normalizedBody
        WasTruncated = $wasTruncated
        Payload = (@{ body = $normalizedBody } | ConvertTo-Json -Compress)
    }
}
