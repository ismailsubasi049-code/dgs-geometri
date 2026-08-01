# Bagimliliksiz statik dosya sunucusu (.NET HttpListener).
# Kullanim:  powershell -ExecutionPolicy Bypass -File tools/serve.ps1
# Durdurma:  Ctrl+C

param(
    [int]$Port = 8080
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$prefix = "http://localhost:$Port/"

$mime = @{
    '.html'        = 'text/html; charset=utf-8'
    '.css'         = 'text/css; charset=utf-8'
    '.js'          = 'text/javascript; charset=utf-8'
    '.mjs'         = 'text/javascript; charset=utf-8'
    '.json'        = 'application/json; charset=utf-8'
    '.webmanifest' = 'application/manifest+json; charset=utf-8'
    '.svg'         = 'image/svg+xml'
    '.png'         = 'image/png'
    '.ico'         = 'image/x-icon'
    '.woff2'       = 'font/woff2'
    '.txt'         = 'text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    Write-Host "Port $Port dinlenemedi: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Baska bir port deneyin:  powershell -ExecutionPolicy Bypass -File tools/serve.ps1 -Port 8090"
    exit 1
}

Write-Host ""
Write-Host "  DGS Geometri  ->  $prefix" -ForegroundColor Green
Write-Host "  Kok dizin: $root"
Write-Host "  Durdurmak icin Ctrl+C"
Write-Host ""

$resolvedRoot = [System.IO.Path]::GetFullPath($root)

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()

        # Tek bir istekteki hata (ornegin tarayici baglantiyi yarida keserse) sunucuyu
        # dusurmemeli; her istek kendi try blogunda islenir.
        try {
            $req = $context.Request
            $res = $context.Response

            $relative = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($relative)) { $relative = 'index.html' }
            $relative = $relative -replace '/', '\'

            # Gelistirme yardimcisi: sayfanin urettigi bir goruntuyu diske yazar.
            # Sadece POST /__preview kabul edilir ve daima ayni dosyaya yazilir;
            # sunucu yalnizca localhost'u dinledigi icin disaridan erisilemez.
            if ($req.HttpMethod -eq 'POST' -and $req.Url.AbsolutePath -eq '/__preview') {
                $previewDir = Join-Path $root 'tools\.preview'
                if (-not (Test-Path -LiteralPath $previewDir)) {
                    New-Item -ItemType Directory -Path $previewDir | Out-Null
                }
                $target = Join-Path $previewDir 'preview.png'
                $ms = New-Object System.IO.MemoryStream
                $req.InputStream.CopyTo($ms)
                [System.IO.File]::WriteAllBytes($target, $ms.ToArray())
                $ms.Dispose()

                $ok = [System.Text.Encoding]::UTF8.GetBytes("yazildi: $target")
                $res.StatusCode = 200
                $res.ContentType = 'text/plain; charset=utf-8'
                $res.ContentLength64 = $ok.Length
                $res.OutputStream.Write($ok, 0, $ok.Length)
                Write-Host ("  200  POST /__preview ({0} bayt)" -f $ok.Length) -ForegroundColor Cyan
                continue
            }

            $resolvedFull = [System.IO.Path]::GetFullPath((Join-Path $root $relative))

            # Kok dizin disina cikma girisimlerini engelle
            $insideRoot = $resolvedFull.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)

            if ($insideRoot -and (Test-Path -LiteralPath $resolvedFull -PathType Container)) {
                $resolvedFull = Join-Path $resolvedFull 'index.html'
            }

            if ($insideRoot -and (Test-Path -LiteralPath $resolvedFull -PathType Leaf)) {
                $ext = [System.IO.Path]::GetExtension($resolvedFull).ToLowerInvariant()
                $type = $mime[$ext]
                if (-not $type) { $type = 'application/octet-stream' }

                $bytes = [System.IO.File]::ReadAllBytes($resolvedFull)
                $res.StatusCode = 200
                $res.ContentType = $type
                # Gelistirme sirasinda tarayici cache'i devre disi; SW cache'i ayri calisir
                $res.Headers.Add('Cache-Control', 'no-store, must-revalidate')
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
                Write-Host ("  200  /{0}" -f ($relative -replace '\\', '/'))
            } else {
                $body = [System.Text.Encoding]::UTF8.GetBytes("404 - bulunamadi: /$relative")
                $res.StatusCode = 404
                $res.ContentType = 'text/plain; charset=utf-8'
                $res.ContentLength64 = $body.Length
                $res.OutputStream.Write($body, 0, $body.Length)
                Write-Host ("  404  /{0}" -f ($relative -replace '\\', '/')) -ForegroundColor DarkYellow
            }
        } catch {
            Write-Host ("  HATA  {0}" -f $_.Exception.Message) -ForegroundColor Red
        } finally {
            try { $context.Response.OutputStream.Close() } catch { }
        }
    }
} finally {
    if ($listener.IsListening) { $listener.Stop() }
    $listener.Close()
    Write-Host "Sunucu durduruldu."
}
