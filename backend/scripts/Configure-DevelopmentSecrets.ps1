[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string] $SessionPoolerUri
)

$ErrorActionPreference = 'Stop'

function Set-ProjectSecret {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Project,

        [Parameter(Mandatory = $true)]
        [string] $Key,

        [Parameter(Mandatory = $true)]
        [string] $Value
    )

    & dotnet user-secrets set $Key $Value --project $Project
    if ($LASTEXITCODE -ne 0) {
        throw "User secret could not be saved for project '$Project'."
    }
}

$placeholder = '[YOUR-PASSWORD]'
if ($SessionPoolerUri.IndexOf($placeholder, [StringComparison]::Ordinal) -lt 0) {
    throw "SessionPoolerUri must contain the literal $placeholder placeholder. Do not put the database password in the command."
}

$parseableUri = $SessionPoolerUri.Replace($placeholder, 'temporary-placeholder')
$databaseUri = [Uri] $parseableUri

if ($databaseUri.Scheme -notin @('postgres', 'postgresql')) {
    throw 'SessionPoolerUri must use the postgres:// or postgresql:// scheme.'
}

if ($databaseUri.Port -ne 5432) {
    throw 'Use the Supabase Session Pooler on port 5432, not the Transaction Pooler on port 6543.'
}

if (-not $databaseUri.Host.EndsWith('.pooler.supabase.com', [StringComparison]::OrdinalIgnoreCase)) {
    throw 'The connection host must be a Supabase pooler host.'
}

$userInfoParts = $databaseUri.UserInfo.Split(':', 2)
$databaseUser = [Uri]::UnescapeDataString($userInfoParts[0])
$databaseName = $databaseUri.AbsolutePath.Trim('/')

if ([string]::IsNullOrWhiteSpace($databaseUser) -or [string]::IsNullOrWhiteSpace($databaseName)) {
    throw 'The Supabase URI does not contain a database user or database name.'
}

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$authProject = Join-Path $workspaceRoot 'src\Services\Auth\LocalCart.Auth.Api'
$productProject = Join-Path $workspaceRoot 'src\Services\Product\LocalCart.Product.Api'

if (-not (Test-Path -LiteralPath $authProject) -or -not (Test-Path -LiteralPath $productProject)) {
    throw 'Run this script from the LocalCart repository. One or more API projects could not be found.'
}

$securePassword = Read-Host 'Supabase database password' -AsSecureString
$passwordPointer = [IntPtr]::Zero

try {
    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $databasePassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)

    if ([string]::IsNullOrWhiteSpace($databasePassword)) {
        throw 'The database password cannot be empty.'
    }

    # ADO.NET connection strings escape a double quote by doubling it inside a quoted value.
    $escapedPassword = $databasePassword.Replace('"', '""')
    $connectionString = 'Host={0};Port={1};Database={2};Username={3};Password="{4}";SSL Mode=Require;Trust Server Certificate=true;Pooling=true;Minimum Pool Size=0;Maximum Pool Size=20;Connection Idle Lifetime=300;Timeout=15;Command Timeout=30;Keepalive=30' -f `
        $databaseUri.Host,
        $databaseUri.Port,
        $databaseName,
        $databaseUser,
        $escapedPassword

    $jwtBytes = New-Object byte[] 64
    $randomNumberGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $randomNumberGenerator.GetBytes($jwtBytes)
        $jwtSigningKey = [Convert]::ToBase64String($jwtBytes)
    }
    finally {
        $randomNumberGenerator.Dispose()
    }

    Set-ProjectSecret -Project $authProject -Key 'ConnectionStrings:MarketplaceDatabase' -Value $connectionString
    Set-ProjectSecret -Project $productProject -Key 'ConnectionStrings:MarketplaceDatabase' -Value $connectionString
    Set-ProjectSecret -Project $authProject -Key 'Jwt:SigningKey' -Value $jwtSigningKey
    Set-ProjectSecret -Project $productProject -Key 'Jwt:SigningKey' -Value $jwtSigningKey

    Write-Host 'Supabase connection and shared JWT signing key were saved to .NET User Secrets.' -ForegroundColor Green
    Write-Host 'Redis was not changed. Configure it separately with Configure-RedisSecret.ps1.' -ForegroundColor Yellow
}
finally {
    if ($passwordPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }

    if ($null -ne $securePassword) {
        $securePassword.Dispose()
    }

    Remove-Variable databasePassword, escapedPassword, connectionString, jwtSigningKey, jwtBytes -ErrorAction SilentlyContinue
}
