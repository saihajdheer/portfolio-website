Add-Type -AssemblyName System.Drawing

$files = @(
    "c:\Users\Saihaj Dheer\Desktop\sem 6\portfolio\website\assets\tiint cover imag1.png",
    "c:\Users\Saihaj Dheer\Desktop\sem 6\portfolio\website\assets\tiint cover img 2.png",
    "c:\Users\Saihaj Dheer\Desktop\sem 6\portfolio\website\assets\tiint cover imag 3.png"
)
$output = "c:\Users\Saihaj Dheer\Desktop\sem 6\portfolio\website\assets\tiint_combined.png"

$images = $files | ForEach-Object { [System.Drawing.Image]::FromFile($_) }

$maxWidth = 0
$totalHeight = 0

foreach ($img in $images) {
    if ($img.Width -gt $maxWidth) { $maxWidth = $img.Width }
    $totalHeight += $img.Height
}

$bmp = New-Object System.Drawing.Bitmap $maxWidth, $totalHeight
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.Clear([System.Drawing.Color]::White)

$currentY = 0
foreach ($img in $images) {
    $x = [math]::Floor(($maxWidth - $img.Width) / 2)
    $graphics.DrawImage($img, $x, $currentY, $img.Width, $img.Height)
    $currentY += $img.Height
}

$bmp.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bmp.Dispose()
foreach ($img in $images) { $img.Dispose() }

Write-Host "Combination complete: $output"
