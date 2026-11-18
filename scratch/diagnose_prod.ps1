$urls = @(
    'https://vyaparadnet.com/',
    'https://vyaparadnet.com/login',
    'https://vyaparadnet.com/register',
    'https://vyaparadnet.com/admin/',
    'https://vyaparadnet.com/entity/',
    'https://vyaparadnet.com/api/status',
    'https://vyaparadnet.com/api/branding'
)

foreach ($u in $urls) {
    Write-Host "========================================"
    Write-Host "Testing: $u"
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $res = Invoke-WebRequest -Uri $u -Method Get -TimeoutSec 15 -MaximumRedirection 5 -ErrorAction Stop
        $sw.Stop()
        Write-Host "Status: $($res.StatusCode) $($res.StatusDescription)"
        Write-Host "Content-Type: $($res.Headers['Content-Type'])"
        Write-Host "Elapsed ms: $($sw.ElapsedMilliseconds)"
        Write-Host "Length: $($res.RawContentLength)"
        $len = [System.Math]::Min(400, $res.Content.Length)
        Write-Host "Body: $($res.Content.Substring(0, $len))"
    } catch {
        $sw.Stop()
        Write-Host "Elapsed ms: $($sw.ElapsedMilliseconds)"
        if ($_.Exception.Response) {
            $resp = $_.Exception.Response
            Write-Host "Status: $([int]$resp.StatusCode) $($resp.StatusDescription)"
            Write-Host "Content-Type: $($resp.Headers['Content-Type'])"
            $stream = $resp.GetResponseStream()
            if ($stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                $body = $reader.ReadToEnd()
                $len = [System.Math]::Min(400, $body.Length)
                Write-Host "Body: $($body.Substring(0, $len))"
            }
        } else {
            Write-Host "Error: $($_.Exception.Message)"
        }
    }
}

# Also test POST to /api/verify-sponsor
Write-Host "========================================"
Write-Host "Testing POST: https://vyaparadnet.com/api/verify-sponsor"
$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $bodyJson = '{"sponsor_id":"CB100201"}'
    $res = Invoke-WebRequest -Uri 'https://vyaparadnet.com/api/verify-sponsor' -Method Post -Body $bodyJson -ContentType "application/json" -TimeoutSec 15 -ErrorAction Stop
    $sw.Stop()
    Write-Host "Status: $($res.StatusCode) $($res.StatusDescription)"
    Write-Host "Content-Type: $($res.Headers['Content-Type'])"
    Write-Host "Elapsed ms: $($sw.ElapsedMilliseconds)"
    Write-Host "Body: $($res.Content)"
} catch {
    $sw.Stop()
    Write-Host "Elapsed ms: $($sw.ElapsedMilliseconds)"
    if ($_.Exception.Response) {
        $resp = $_.Exception.Response
        Write-Host "Status: $([int]$resp.StatusCode) $($resp.StatusDescription)"
        Write-Host "Content-Type: $($resp.Headers['Content-Type'])"
        $stream = $resp.GetResponseStream()
        if ($stream) {
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd()
            Write-Host "Body: $body"
        }
    } else {
        Write-Host "Error: $($_.Exception.Message)"
    }
}
