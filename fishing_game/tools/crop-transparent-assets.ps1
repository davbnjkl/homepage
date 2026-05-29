param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
)

$ErrorActionPreference = "Stop"

$sourceDir = Join-Path $Root "images\透明素材"
$fishDir = Join-Path $Root "fishing_game\assets\fish"
$cardDir = Join-Path $Root "fishing_game\assets\cards"

New-Item -ItemType Directory -Force -Path $fishDir, $cardDir | Out-Null

function Invoke-MagickCrop {
    param(
        [string]$Source,
        [string]$Crop,
        [string]$Output
    )

    magick $Source -crop $Crop -trim +repage $Output
}

function Crop-FishCell {
    param(
        [string]$Sheet,
        [int]$CellSize,
        [int]$Column,
        [int]$Row,
        [string]$Name
    )

    $x = $Column * $CellSize
    $y = $Row * $CellSize
    $source = Join-Path $sourceDir $Sheet
    $output = Join-Path $fishDir "$Name.png"
    Invoke-MagickCrop -Source $source -Crop "${CellSize}x${CellSize}+${x}+${y}" -Output $output
}

function Crop-CardCell {
    param(
        [string]$Name,
        [int]$Column,
        [int]$Row
    )

    $cellWidth = 512
    $cellHeight = 512
    $x = $Column * $cellWidth
    $y = $Row * $cellHeight
    $source = Join-Path $sourceDir "c5bd550b-6937-47a1-b02a-b470818007d3.png"
    $output = Join-Path $cardDir "card-frame-$Name.png"
    Invoke-MagickCrop -Source $source -Crop "${cellWidth}x${cellHeight}+${x}+${y}" -Output $output
}

$miscSheets = @(
    @{ Sheet = "db4f30b8-4d8d-4842-9f34-6536bf598bd1.png"; Size = 512; Items = @(
        @{ Name = "blue-scale"; Column = 0; Row = 0 },
        @{ Name = "orange-carp"; Column = 1; Row = 0 },
        @{ Name = "red-lantern"; Column = 0; Row = 1 },
        @{ Name = "moon-bass"; Column = 1; Row = 1 }
    ) },
    @{ Sheet = "e01e00a3-52fb-4b9c-8060-43d31c705f66.png"; Size = 512; Items = @(
        @{ Name = "silver-sail"; Column = 0; Row = 0 },
        @{ Name = "stone-catfish"; Column = 1; Row = 0 },
        @{ Name = "deep-crown"; Column = 0; Row = 1 },
        @{ Name = "gold-dragon"; Column = 1; Row = 1 }
    ) }
)

$schoolSheets = @(
    @{ Sheet = "0b0d6076-fdec-45e3-95bb-8e569262ca2f.png"; Size = 627; Items = @(
        @{ Name = "school-silver-minnow"; Column = 0; Row = 0 },
        @{ Name = "school-edge-crucian"; Column = 1; Row = 0 },
        @{ Name = "school-green-leader"; Column = 0; Row = 1 },
        @{ Name = "school-tide-follower"; Column = 1; Row = 1 }
    ) },
    @{ Sheet = "496e6a01-8aae-41bc-a4a5-a588e649b0ac.png"; Size = 627; Items = @(
        @{ Name = "school-twin-tail"; Column = 0; Row = 0 },
        @{ Name = "school-bluefin-ring"; Column = 1; Row = 0 },
        @{ Name = "school-scale-gatherer"; Column = 0; Row = 1 },
        @{ Name = "school-reef-guardian"; Column = 1; Row = 1 }
    ) },
    @{ Sheet = "e2c742c3-ad9c-41d3-beae-f7670f77d685.png"; Size = 627; Items = @(
        @{ Name = "school-three-line-lantern"; Column = 0; Row = 0 },
        @{ Name = "school-herald"; Column = 1; Row = 0 },
        @{ Name = "school-star-bream"; Column = 0; Row = 1 },
        @{ Name = "school-return-sailfish"; Column = 1; Row = 1 }
    ) },
    @{ Sheet = "1c60afe2-ddff-44b4-bff7-280ea23cbdaa.png"; Size = 627; Items = @(
        @{ Name = "school-dense-guard"; Column = 0; Row = 0 },
        @{ Name = "school-tide-king"; Column = 1; Row = 0 },
        @{ Name = "school-mother-of-stars"; Column = 0; Row = 1 },
        @{ Name = "school-golden-resonance"; Column = 1; Row = 1 }
    ) }
)

foreach ($sheet in $miscSheets + $schoolSheets) {
    foreach ($item in $sheet.Items) {
        Crop-FishCell -Sheet $sheet.Sheet -CellSize $sheet.Size -Column $item.Column -Row $item.Row -Name $item.Name
    }
}

Invoke-MagickCrop `
    -Source (Join-Path $sourceDir "86af6cbe-5fa2-4df5-aa18-7fde973e663e.png") `
    -Crop "627x627+0+0" `
    -Output (Join-Path $fishDir "deep-monster.png")

Invoke-MagickCrop `
    -Source (Join-Path $sourceDir "95e1cbe2-eef7-4cc6-bea0-3318dfd65817.png") `
    -Crop "627x627+0+0" `
    -Output (Join-Path $fishDir "school-nine-tide-ancestor.png")

Invoke-MagickCrop `
    -Source (Join-Path $sourceDir "95e1cbe2-eef7-4cc6-bea0-3318dfd65817.png") `
    -Crop "627x627+627+0" `
    -Output (Join-Path $fishDir "school-all-scales-one.png")

@(
    @{ Name = "common"; Column = 0; Row = 0 },
    @{ Name = "uncommon"; Column = 1; Row = 0 },
    @{ Name = "rare"; Column = 2; Row = 0 },
    @{ Name = "epic"; Column = 0; Row = 1 },
    @{ Name = "legendary"; Column = 1; Row = 1 },
    @{ Name = "mythic"; Column = 2; Row = 1 }
) | ForEach-Object {
    Crop-CardCell -Name $_.Name -Column $_.Column -Row $_.Row
}

Write-Host "Transparent assets cropped."
