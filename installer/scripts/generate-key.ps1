# Generate GITCORTEX_ENCRYPTION_KEY and GITCORTEX_API_TOKEN, write to .env file.
# Usage: generate-key.ps1 -EnvFile <path>
param(
    [Parameter(Mandatory=$true)][string]$EnvFile
)

$ErrorActionPreference = "Stop"

function Generate-RandomHex {
    param([int]$Bytes)
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $buf = New-Object byte[] $Bytes
    $rng.GetBytes($buf)
    return ($buf | ForEach-Object { $_.ToString("x2") }) -join ""
}

# Generate 32-byte encryption key (hex string = 64 chars, but we need exactly 32 bytes as ASCII)
# The server expects a 32-byte ASCII string.
function Generate-AsciiKey {
    param([int]$Length)
    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $result = ""
    for ($i = 0; $i -lt $Length; $i++) {
        $buf = New-Object byte[] 1
        $rng.GetBytes($buf)
        $idx = $buf[0] % $chars.Length
        $result += $chars[$idx]
    }
    return $result
}

$EncryptionKey = Generate-AsciiKey -Length 32
$InstallDir = Split-Path -Parent $EnvFile

# Build .env content
# NOTE: GITCORTEX_API_TOKEN is NOT set by default.
# Local installations don't need API authentication (localhost only).
# To enable API auth, uncomment and set a token value.
$envContent = @"
# GitCortex Environment Configuration
# Generated during installation - DO NOT share these values.

# Encryption key for API key storage (32 bytes, required)
GITCORTEX_ENCRYPTION_KEY=$EncryptionKey

# API authentication token (optional, enables Bearer auth on all endpoints)
# Uncomment to require Bearer token for API access:
# GITCORTEX_API_TOKEN=your-token-here

# Local mode: skip API token requirement (localhost-only, safe)
GITCORTEX_LOCAL_MODE=1

# Server configuration
BACKEND_PORT=23456
HOST=127.0.0.1

# Claude Code requires git-bash on Windows
CLAUDE_CODE_GIT_BASH_PATH=$InstallDir\git\usr\bin\bash.exe

# Suppress npm update notices in CLI output
NO_UPDATE_NOTIFIER=1

# Logging level (debug/info/warn/error)
RUST_LOG=info
"@

# Write or append
if (Test-Path $EnvFile) {
    # Check if keys already exist to avoid duplicates
    $existing = Get-Content $EnvFile -Raw
    if ($existing -match "GITCORTEX_ENCRYPTION_KEY=") {
        Write-Host "[INFO] GITCORTEX_ENCRYPTION_KEY already exists in $EnvFile, skipping."
    } else {
        $existing = [System.IO.File]::ReadAllText($EnvFile)
        [System.IO.File]::WriteAllText($EnvFile, $existing + "`n" + $envContent, (New-Object System.Text.UTF8Encoding $false))
        Write-Host "[INFO] Keys appended to $EnvFile (UTF-8 no BOM)"
    }
} else {
    # Write UTF-8 WITHOUT BOM — critical for Rust env parsing
    # PowerShell's -Encoding UTF8 adds BOM on Windows PowerShell 5.x
    [System.IO.File]::WriteAllText($EnvFile, $envContent, (New-Object System.Text.UTF8Encoding $false))
    Write-Host "[INFO] Created $EnvFile with generated keys (UTF-8 no BOM)"
}
