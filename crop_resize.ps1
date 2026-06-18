Add-Type -AssemblyName System.Drawing

$sourcePath = ".\logo-extensao.png"
$sourceImg = [System.Drawing.Bitmap]::FromFile($sourcePath)

$width = $sourceImg.Width
$height = $sourceImg.Height

$minX = $width
$minY = $height
$maxX = 0
$maxY = 0

# Find bounding box
for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $pixel = $sourceImg.GetPixel($x, $y)
        if ($pixel.A -gt 0) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

# Add some small padding (e.g., 5%)
$padX = [int](($maxX - $minX) * 0.05)
$padY = [int](($maxY - $minY) * 0.05)

$minX = [Math]::Max(0, $minX - $padX)
$minY = [Math]::Max(0, $minY - $padY)
$maxX = [Math]::Min($width - 1, $maxX + $padX)
$maxY = [Math]::Min($height - 1, $maxY + $padY)

$cropWidth = $maxX - $minX + 1
$cropHeight = $maxY - $minY + 1

# Make it square
$maxDim = [Math]::Max($cropWidth, $cropHeight)
$offsetX = [int](($maxDim - $cropWidth) / 2)
$offsetY = [int](($maxDim - $cropHeight) / 2)

if (-not (Test-Path ".\icons")) {
    New-Item -ItemType Directory -Path ".\icons" | Out-Null
}

foreach ($size in @(16, 32, 48, 128)) {
    $destPath = ".\icons\icon$size.png"
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $graph = [System.Drawing.Graphics]::FromImage($bmp)
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    
    # Clear background with transparent
    $graph.Clear([System.Drawing.Color]::Transparent)

    $srcRect = New-Object System.Drawing.Rectangle($minX - $offsetX, $minY - $offsetY, $maxDim, $maxDim)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)

    $graph.DrawImage($sourceImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graph.Dispose()
    $bmp.Dispose()
}

$sourceImg.Dispose()
Write-Host "Crop and resize done"
