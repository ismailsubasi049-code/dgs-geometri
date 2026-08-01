# PWA ikonlarini System.Drawing ile uretir (harici bagimlilik yok).
# Kullanim:  powershell -ExecutionPolicy Bypass -File tools/make-icons.ps1
#
# Uretilenler:
#   icons/icon-192.png       - normal ikon
#   icons/icon-512.png       - normal ikon
#   icons/maskable-512.png   - maskable (icerik guvenli alanda, %80)
#   icons/apple-touch-icon.png (180) - iOS
#
# Cizim: koyu lacivert zemin uzerine acik mavi bir ucgen + pergel yayi (geometri temasi).

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'icons'
if (-not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

$bgColor     = [System.Drawing.Color]::FromArgb(255, 15, 23, 42)    # #0f172a
$accentColor = [System.Drawing.Color]::FromArgb(255, 56, 189, 248)  # #38bdf8
$lineColor   = [System.Drawing.Color]::FromArgb(255, 226, 232, 240) # #e2e8f0

function New-Icon {
    param(
        [int]$Size,
        [string]$Path,
        [double]$SafeArea = 1.0,   # maskable icin 0.8
        [bool]$RoundedBg = $true
    )

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    $bgBrush = New-Object System.Drawing.SolidBrush($bgColor)
    if ($RoundedBg) {
        # Maskable'da tam kare zemin sart; normalde hafif yuvarlatilmis kare
        $g.FillRectangle($bgBrush, 0, 0, $Size, $Size)
    } else {
        $g.FillRectangle($bgBrush, 0, 0, $Size, $Size)
    }

    # Guvenli alan: maskable'da icerik merkezde %80'lik kareye sigmali
    $inset = $Size * (1.0 - $SafeArea) / 2.0
    $s = $Size * $SafeArea
    $ox = $inset
    $oy = $inset

    # Yardimci: guvenli alan icinde 0..1 koordinatlarini piksele cevir
    function P([double]$x, [double]$y) {
        New-Object System.Drawing.PointF([float]($ox + $x * $s), [float]($oy + $y * $s))
    }

    $penWidth = [float]($s * 0.055)

    # Pergel yayi (ucgenin tepesinden acilan ceyrek yay)
    $arcPen = New-Object System.Drawing.Pen($accentColor, [float]($s * 0.04))
    $arcPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $arcPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $arcR = $s * 0.30
    $arcRect = New-Object System.Drawing.RectangleF(
        [float]($ox + $s * 0.50 - $arcR),
        [float]($oy + $s * 0.22 - $arcR),
        [float]($arcR * 2),
        [float]($arcR * 2))
    $g.DrawArc($arcPen, $arcRect, 35, 110)

    # Ucgen
    $triPen = New-Object System.Drawing.Pen($lineColor, $penWidth)
    $triPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $pts = @( (P 0.50 0.22), (P 0.86 0.80), (P 0.14 0.80) )
    $g.DrawPolygon($triPen, [System.Drawing.PointF[]]$pts)

    # Tepe noktasi vurgusu
    $dotBrush = New-Object System.Drawing.SolidBrush($accentColor)
    $dotR = $s * 0.045
    $apex = P 0.50 0.22
    $g.FillEllipse($dotBrush, [float]($apex.X - $dotR), [float]($apex.Y - $dotR), [float]($dotR * 2), [float]($dotR * 2))

    # Sol alt kosede aci yayi (kosenin gercek acisini isaretler)
    $angPen = New-Object System.Drawing.Pen($accentColor, [float]($s * 0.028))
    $bl = P 0.14 0.80
    $angR = $s * 0.16
    $angRect = New-Object System.Drawing.RectangleF(
        [float]($bl.X - $angR), [float]($bl.Y - $angR),
        [float]($angR * 2), [float]($angR * 2))
    # 0 derece saat 3 yonu, saat yonunde artar -> tabandan (0) yukari-saga (-58) tara
    $g.DrawArc($angPen, $angRect, -58, 58)

    $g.Dispose()
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    $bgBrush.Dispose(); $arcPen.Dispose(); $triPen.Dispose(); $dotBrush.Dispose(); $angPen.Dispose()
    Write-Host "  yazildi: $Path"
}

New-Icon -Size 192 -Path (Join-Path $outDir 'icon-192.png') -SafeArea 0.92
New-Icon -Size 512 -Path (Join-Path $outDir 'icon-512.png') -SafeArea 0.92
New-Icon -Size 512 -Path (Join-Path $outDir 'maskable-512.png') -SafeArea 0.70
New-Icon -Size 180 -Path (Join-Path $outDir 'apple-touch-icon.png') -SafeArea 0.92

Write-Host "Ikonlar hazir." -ForegroundColor Green
