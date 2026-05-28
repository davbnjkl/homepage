param(
    [Parameter(Mandatory = $true)]
    [string]$InputImage,

    [Parameter(Mandatory = $true)]
    [string[]]$Ids,

    [string]$OutputDir = ".\assets\fish",
    [int]$Columns = 2,
    [int]$Rows = 2,
    [int]$Padding = 0,
    [int]$OutputSize = 0
)

$ErrorActionPreference = "Stop"

$resolvedInput = Resolve-Path -LiteralPath $InputImage
$resolvedOutput = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputDir)
New-Item -ItemType Directory -Path $resolvedOutput -Force | Out-Null

$magick = Get-Command magick -ErrorAction SilentlyContinue

if ($magick) {
    $size = (& $magick.Source identify -format "%w %h" $resolvedInput.Path).Trim() -split "\s+"
    $imageWidth = [int]$size[0]
    $imageHeight = [int]$size[1]
    $capacity = $Columns * $Rows
    $count = [math]::Min($Ids.Count, $capacity)
    $cellWidth = [math]::Floor($imageWidth / $Columns)
    $cellHeight = [math]::Floor($imageHeight / $Rows)

    for ($index = 0; $index -lt $count; $index += 1) {
        $id = $Ids[$index]
        $column = $index % $Columns
        $row = [math]::Floor($index / $Columns)
        $x = ($column * $cellWidth) + $Padding
        $y = ($row * $cellHeight) + $Padding
        $width = $cellWidth - ($Padding * 2)
        $height = $cellHeight - ($Padding * 2)

        if ($width -le 0 -or $height -le 0) {
            throw "Padding is too large for the image grid."
        }

        $target = Join-Path $resolvedOutput "$id.png"
        if ($OutputSize -gt 0) {
            & $magick.Source $resolvedInput.Path -crop "${width}x${height}+${x}+${y}" +repage -resize "${OutputSize}x${OutputSize}!" $target
        } else {
            & $magick.Source $resolvedInput.Path -crop "${width}x${height}+${x}+${y}" +repage $target
        }
        Write-Host "Wrote $target"
    }

    if ($Ids.Count -gt $capacity) {
        Write-Warning "Only wrote $count images because the sheet has $capacity cells."
    }

    exit 0
}

Add-Type -AssemblyName System.Drawing
$image = [System.Drawing.Image]::FromFile($resolvedInput.Path)

try {
    $cellWidth = [math]::Floor($image.Width / $Columns)
    $cellHeight = [math]::Floor($image.Height / $Rows)
    $capacity = $Columns * $Rows
    $count = [math]::Min($Ids.Count, $capacity)

    for ($index = 0; $index -lt $count; $index += 1) {
        $id = $Ids[$index]
        $column = $index % $Columns
        $row = [math]::Floor($index / $Columns)
        $x = ($column * $cellWidth) + $Padding
        $y = ($row * $cellHeight) + $Padding
        $width = $cellWidth - ($Padding * 2)
        $height = $cellHeight - ($Padding * 2)

        if ($width -le 0 -or $height -le 0) {
            throw "Padding is too large for the image grid."
        }

        $cropRect = [System.Drawing.Rectangle]::new($x, $y, $width, $height)
        $bitmap = [System.Drawing.Bitmap]::new($width, $height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

        try {
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
            $graphics.DrawImage($image, [System.Drawing.Rectangle]::new(0, 0, $width, $height), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
            $target = Join-Path $resolvedOutput "$id.png"
            if ($OutputSize -gt 0 -and ($width -ne $OutputSize -or $height -ne $OutputSize)) {
                $resized = [System.Drawing.Bitmap]::new($OutputSize, $OutputSize)
                $resizeGraphics = [System.Drawing.Graphics]::FromImage($resized)
                try {
                    $resizeGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                    $resizeGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
                    $resizeGraphics.DrawImage($bitmap, [System.Drawing.Rectangle]::new(0, 0, $OutputSize, $OutputSize), [System.Drawing.Rectangle]::new(0, 0, $width, $height), [System.Drawing.GraphicsUnit]::Pixel)
                    $resized.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
                }
                finally {
                    $resizeGraphics.Dispose()
                    $resized.Dispose()
                }
            } else {
                $bitmap.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
            }
            Write-Host "Wrote $target"
        }
        finally {
            $graphics.Dispose()
            $bitmap.Dispose()
        }
    }

    if ($Ids.Count -gt $capacity) {
        Write-Warning "Only wrote $count images because the sheet has $capacity cells."
    }
}
finally {
    $image.Dispose()
}
