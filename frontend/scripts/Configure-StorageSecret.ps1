[CmdletBinding()]
param(
    [string]$ProjectUrl = "https://tiqnixwuxhrluvvoxaih.supabase.co",
    [string]$Bucket = "product-images"
)

$ErrorActionPreference = "Stop"

$secret = (Get-Clipboard -Raw).Trim()
if (-not $secret.StartsWith("sb_secret_", [StringComparison]::Ordinal)) {
    throw "Clipboard does not contain a Supabase secret key beginning with sb_secret_."
}

$frontendRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$environmentPath = Join-Path $frontendRoot ".env.local"
$values = [ordered]@{
    "AUTH_API_URL" = "http://localhost:5001"
    "PRODUCT_API_URL" = "http://localhost:5002"
    "NEXT_PUBLIC_SITE_URL" = "http://localhost:3000"
    "NEXT_PUBLIC_IMAGE_HOSTS" = "images.unsplash.com,images.pexels.com,cdn.pixabay.com"
    "SUPABASE_URL" = $ProjectUrl
    "SUPABASE_SECRET_KEY" = $secret
    "SUPABASE_PRODUCT_IMAGES_BUCKET" = $Bucket
}

$lines = if (Test-Path -LiteralPath $environmentPath) {
    [Collections.Generic.List[string]]::new([IO.File]::ReadAllLines($environmentPath))
} else {
    [Collections.Generic.List[string]]::new()
}

foreach ($entry in $values.GetEnumerator()) {
    $prefix = "$($entry.Key)="
    $replacement = "$prefix$($entry.Value)"
    $index = -1
    for ($lineIndex = 0; $lineIndex -lt $lines.Count; $lineIndex++) {
        if ($lines[$lineIndex].StartsWith($prefix, [StringComparison]::Ordinal)) {
            $index = $lineIndex
            break
        }
    }

    if ($index -ge 0) {
        $lines[$index] = $replacement
    } else {
        $lines.Add($replacement)
    }
}

[IO.File]::WriteAllLines(
    $environmentPath,
    $lines,
    [Text.UTF8Encoding]::new($false)
)

Write-Output "Supabase Storage configuration saved to frontend/.env.local. The secret value was not printed."
