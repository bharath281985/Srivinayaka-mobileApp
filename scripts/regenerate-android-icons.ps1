$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot "assets\logo.png"
$source = [System.Drawing.Image]::FromFile($sourcePath)

$sizes = [ordered]@{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($entry in $sizes.GetEnumerator()) {
    $resourceDir = Join-Path $projectRoot ("android\app\src\main\res\{0}" -f $entry.Key)

    Remove-Item (Join-Path $resourceDir "ic_launcher.webp") -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $resourceDir "ic_launcher_round.webp") -ErrorAction SilentlyContinue

    foreach ($outputName in @("ic_launcher.png", "ic_launcher_round.png")) {
        $bitmap = New-Object System.Drawing.Bitmap $entry.Value, $entry.Value
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.DrawImage($source, 0, 0, $entry.Value, $entry.Value)

        $outputPath = Join-Path $resourceDir $outputName
        $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

        $graphics.Dispose()
        $bitmap.Dispose()
    }
}

$playStoreIconPath = Join-Path $projectRoot "builds\playstore-icon-v2.png"
Copy-Item $sourcePath $playStoreIconPath -Force

$source.Dispose()

Write-Output "Android launcher icons regenerated."
Write-Output $playStoreIconPath
