# Configure npm registry mirror for the bundled Node.js installation.
# Usage: configure-npm.ps1 -NodeDir <path> [-UseChinaMirror]
param(
    [Parameter(Mandatory=$true)][string]$NodeDir,
    [switch]$UseChinaMirror
)

$ErrorActionPreference = "Stop"

$NpmrcPath = Join-Path $NodeDir ".npmrc"

if ($UseChinaMirror) {
    $content = @"
registry=https://registry.npmmirror.com
disturl=https://npmmirror.com/mirrors/node
"@
    Set-Content -Path $NpmrcPath -Value $content -Encoding UTF8
    Write-Host "[INFO] Configured npm to use npmmirror.com (China mirror)"
} else {
    $content = @"
registry=https://registry.npmjs.org
"@
    Set-Content -Path $NpmrcPath -Value $content -Encoding UTF8
    Write-Host "[INFO] Configured npm to use official registry"
}

# Also set npm prefix to keep global packages inside the bundled directory
$GlobalDir = Join-Path $NodeDir "npm-global"
if (-not (Test-Path $GlobalDir)) {
    New-Item -ItemType Directory -Path $GlobalDir -Force | Out-Null
}

Add-Content -Path $NpmrcPath -Value "prefix=$GlobalDir"
Write-Host "[INFO] npm global prefix set to $GlobalDir"
