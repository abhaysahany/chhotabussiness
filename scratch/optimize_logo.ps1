Add-Type -AssemblyName System.Drawing
$imagesDir = 'C:\xampp\htdocs\addnet\backend\public\images'
if (-not (Test-Path $imagesDir)) {
    New-Item -ItemType Directory -Force -Path $imagesDir | Out-Null
}

$srcPath = 'C:\xampp\htdocs\addnet\backend\public\logo.png'
$destPath = 'C:\xampp\htdocs\addnet\backend\public\images\logo-email.png'

$src = [System.Drawing.Image]::FromFile($srcPath)
$targetWidth = 280
$targetHeight = 280

$bmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$graphics.Clear([System.Drawing.Color]::Transparent)

$graphics.DrawImage($src, 0, 0, $targetWidth, $targetHeight)
$graphics.Dispose()
$src.Dispose()

$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

$file = Get-Item $destPath
Write-Output "OPTIMIZED_LOGO_CREATED"
Write-Output "Path: $($file.FullName)"
Write-Output "Dimensions: 280x280"
Write-Output "SizeKB: $([math]::Round($file.Length / 1KB, 2))"
Write-Output "SizeBytes: $($file.Length)"
