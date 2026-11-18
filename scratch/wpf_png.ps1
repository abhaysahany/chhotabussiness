Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

$srcPath = "C:\xampp\htdocs\addnet\backend\public\images\logo-email.png"
$destPath = "C:\xampp\htdocs\addnet\backend\public\images\logo-email.png"

$uri = New-Object System.Uri($srcPath)
$bitmap = New-Object System.Windows.Media.Imaging.BitmapImage($uri)

$encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
$encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bitmap))

$stream = [System.IO.File]::OpenWrite("C:\xampp\htdocs\addnet\backend\public\images\logo-email-wpf.png")
$encoder.Save($stream)
$stream.Close()

$f = Get-Item "C:\xampp\htdocs\addnet\backend\public\images\logo-email-wpf.png"
Write-Output "WPF Size: $($f.Length) bytes ($([math]::Round($f.Length/1KB, 2)) KB)"
