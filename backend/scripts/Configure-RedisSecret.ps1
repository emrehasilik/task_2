[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string] $Endpoint,

    [ValidateRange(1, 65535)]
    [int] $Port = 6379,

    [ValidateNotNullOrEmpty()]
    [string] $User = 'default',

    [bool] $UseSsl = $true
)

$ErrorActionPreference = 'Stop'

if ($Endpoint.Contains('://') -or $Endpoint.Contains(':') -or $Endpoint.Contains('/')) {
    throw 'Endpoint must contain only the Redis host name. Do not include a scheme, port or path.'
}

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$productProject = Join-Path $workspaceRoot 'src\Services\Product\LocalCart.Product.Api'
if (-not (Test-Path -LiteralPath $productProject)) {
    throw 'Run this script from the LocalCart repository. Product API could not be found.'
}

$securePassword = Read-Host 'Redis password' -AsSecureString
$passwordPointer = [IntPtr]::Zero

try {
    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $redisPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)

    if ([string]::IsNullOrWhiteSpace($redisPassword)) {
        throw 'The Redis password cannot be empty.'
    }

    $secrets = @{
        'Redis:Endpoint' = $Endpoint
        'Redis:Port' = $Port.ToString([Globalization.CultureInfo]::InvariantCulture)
        'Redis:User' = $User
        'Redis:Password' = $redisPassword
        'Redis:UseSsl' = $UseSsl.ToString().ToLowerInvariant()
    }

    foreach ($secret in $secrets.GetEnumerator()) {
        & dotnet user-secrets set $secret.Key $secret.Value --project $productProject
        if ($LASTEXITCODE -ne 0) {
            throw "Redis secret '$($secret.Key)' could not be saved."
        }
    }

    Write-Host 'Redis endpoint, credentials and TLS setting were saved to Product API User Secrets.' -ForegroundColor Green
}
finally {
    if ($passwordPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }

    if ($null -ne $securePassword) {
        $securePassword.Dispose()
    }

    Remove-Variable redisPassword, secrets -ErrorAction SilentlyContinue
}
