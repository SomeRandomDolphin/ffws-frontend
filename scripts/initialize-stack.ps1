param([string]$WelangExcelPath = '')
$ErrorActionPreference = 'Stop'
$frontendRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = [IO.Path]::GetFullPath((Join-Path $frontendRoot '..\backend'))
$monitoringRoot = Join-Path $backendRoot 'services\monitoring-api'
if (-not (Test-Path -LiteralPath (Join-Path $monitoringRoot 'Dockerfile.monitoring'))) {
    throw 'Checkout the backend integration branch first.'
}
$envPath = Join-Path $frontendRoot '.env.production'
$lines = if (Test-Path -LiteralPath $envPath) { @(Get-Content -LiteralPath $envPath) } else { @(Get-Content -LiteralPath (Join-Path $frontendRoot '.env.production.example')) }
foreach ($key in @('ARCHIVE_PASSWORD', 'ARCHIVE_ROOT_PASSWORD')) {
    $existing = $lines | Where-Object { $_ -match "^$key=" } | Select-Object -First 1
    if (-not $existing -or $existing -match '=replace-') {
        $secret = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24)).ToLowerInvariant()
        $lines = @($lines | Where-Object { $_ -notmatch "^$key=" }) + "$key=$secret"
    }
}
if (-not ($lines | Where-Object { $_ -match '^FFWS_BIND_ADDRESS=' })) { $lines += 'FFWS_BIND_ADDRESS=127.0.0.1' }
[IO.File]::WriteAllLines($envPath, [string[]]$lines, [Text.UTF8Encoding]::new($false))
$importsPath = Join-Path $monitoringRoot 'imports\history'
New-Item -ItemType Directory -Force -Path $importsPath | Out-Null
$databasePath = Join-Path $monitoringRoot 'configs\surabaya\database.local.yaml'
if (-not (Test-Path -LiteralPath $databasePath)) {
    $previous = Join-Path $backendRoot 'configs\surabaya\database.local.yaml'
    $source = if (Test-Path -LiteralPath $previous) { $previous } else { Join-Path $monitoringRoot 'configs\surabaya\database.example.yaml' }
    Copy-Item -LiteralPath $source -Destination $databasePath
}
if ($WelangExcelPath) {
    Copy-Item -LiteralPath (Resolve-Path -LiteralPath $WelangExcelPath) -Destination (Join-Path $importsPath 'welang.xlsx')
}
Write-Output 'Archive configuration prepared. Secrets have not been printed.'
Write-Output 'Configure backend/.env for the existing Laravel database and APP_KEY before starting Compose.'
Write-Output 'Confirm the monitoring service database.local.yaml contains the sensor connection.'
