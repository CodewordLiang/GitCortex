# ============================================================================
# GitCortex Installer Build Script
# Downloads dependencies, compiles Rust binaries, invokes Inno Setup compiler.
# Usage: powershell -ExecutionPolicy Bypass -File build-installer.ps1
# ============================================================================
param(
    [switch]$SkipRustBuild,
    [switch]$SkipDownloads,
    [switch]$ChinaMirror,
    [string]$InnoSetupPath = "D:\InnoSetup6\ISCC.exe"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BuildDir = Join-Path $ScriptDir "build"
$OutputDir = Join-Path $ScriptDir "output"

# --- Versions ---
$NodeVersion = "22.12.0"
$MinGitVersion = "2.47.1"
$GhVersion = "2.63.2"

# --- Mirror URLs ---
if ($ChinaMirror) {
    $NodeBaseUrl = "https://npmmirror.com/mirrors/node/v$NodeVersion"
    $GhBaseUrl = "https://mirror.ghproxy.com/https://github.com/cli/cli/releases/download/v$GhVersion"
} else {
    $NodeBaseUrl = "https://nodejs.org/dist/v$NodeVersion"
    $GhBaseUrl = "https://github.com/cli/cli/releases/download/v$GhVersion"
}
$MinGitBaseUrl = "https://github.com/git-for-windows/git/releases/download/v${MinGitVersion}.windows.1"
$VcRedistUrl = "https://aka.ms/vs/17/release/vc_redist.x64.exe"

# --- Helper functions ---
function Write-Step { param([string]$msg) Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

function Download-File {
    param([string]$Url, [string]$OutFile)
    if (Test-Path $OutFile) {
        Write-Host "  [SKIP] Already exists: $(Split-Path -Leaf $OutFile)"
        return
    }
    Write-Host "  [DOWNLOAD] $Url"
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing
    Write-Host "  [OK] $(Split-Path -Leaf $OutFile)"
}

function Extract-Zip {
    param([string]$ZipFile, [string]$DestDir)
    if (Test-Path $DestDir) {
        Write-Host "  [SKIP] Already extracted: $(Split-Path -Leaf $DestDir)"
        return
    }
    Write-Host "  [EXTRACT] $(Split-Path -Leaf $ZipFile) -> $(Split-Path -Leaf $DestDir)"
    Expand-Archive -Path $ZipFile -DestinationPath $DestDir -Force
}

# --- Create directories ---
New-Item -ItemType Directory -Path $BuildDir -Force | Out-Null
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

# ============================================================================
# Step 1: Download dependencies
# ============================================================================
if (-not $SkipDownloads) {
    Write-Step "Downloading dependencies"

    # Node.js portable
    $NodeZip = Join-Path $BuildDir "node-v${NodeVersion}-win-x64.zip"
    Download-File -Url "$NodeBaseUrl/node-v${NodeVersion}-win-x64.zip" -OutFile $NodeZip
    $NodeExtractDir = Join-Path $BuildDir "node-extract"
    Extract-Zip -ZipFile $NodeZip -DestDir $NodeExtractDir
    $NodeSrcDir = Get-ChildItem $NodeExtractDir -Directory | Select-Object -First 1
    if ($NodeSrcDir -and -not (Test-Path (Join-Path $BuildDir "node_portable"))) {
        Move-Item $NodeSrcDir.FullName (Join-Path $BuildDir "node_portable")
        Remove-Item $NodeExtractDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    # MinGit
    $MinGitZip = Join-Path $BuildDir "MinGit-${MinGitVersion}-64-bit.zip"
    Download-File -Url "$MinGitBaseUrl/MinGit-${MinGitVersion}-64-bit.zip" -OutFile $MinGitZip
    $MinGitDir = Join-Path $BuildDir "mingit"
    Extract-Zip -ZipFile $MinGitZip -DestDir $MinGitDir

    # GitHub CLI
    $GhZip = Join-Path $BuildDir "gh_${GhVersion}_windows_amd64.zip"
    Download-File -Url "$GhBaseUrl/gh_${GhVersion}_windows_amd64.zip" -OutFile $GhZip
    $GhExtractDir = Join-Path $BuildDir "gh-extract"
    Extract-Zip -ZipFile $GhZip -DestDir $GhExtractDir
    $GhSrcDir = Get-ChildItem $GhExtractDir -Directory | Select-Object -First 1
    $GhBinDir = Join-Path $BuildDir "gh"
    if ($GhSrcDir -and -not (Test-Path $GhBinDir)) {
        $GhBinSrc = Join-Path $GhSrcDir.FullName "bin"
        if (Test-Path $GhBinSrc) {
            New-Item -ItemType Directory -Path $GhBinDir -Force | Out-Null
            Copy-Item "$GhBinSrc\*" $GhBinDir -Recurse
        } else {
            Move-Item $GhSrcDir.FullName $GhBinDir
        }
        Remove-Item $GhExtractDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    # VC++ Runtime
    $VcRedist = Join-Path $BuildDir "vc_redist.x64.exe"
    Download-File -Url $VcRedistUrl -OutFile $VcRedist

    # AI CLI tarballs (download from npm)
    Write-Step "Downloading AI CLI npm packages"
    $CliCacheDir = Join-Path $BuildDir "cli-cache"
    New-Item -ItemType Directory -Path $CliCacheDir -Force | Out-Null

    $NpmRegistry = if ($ChinaMirror) { "https://registry.npmmirror.com" } else { "https://registry.npmjs.org" }
    $NpmPackages = @(
        "@anthropic-ai/claude-code",
        "@openai/codex",
        "@google/gemini-cli",
        "@sourcegraph/amp",
        "@qwen-code/qwen-code",
        "opencode-ai",
        "@kilocode/cli",
        "cursor-agent"
    )

    # Use bundled or system npm to pack
    $NpmCmd = Join-Path $BuildDir "node_portable\npm.cmd"
    if (-not (Test-Path $NpmCmd)) {
        $NpmCmd = "npm"
    }

    foreach ($pkg in $NpmPackages) {
        $safeName = $pkg -replace "/", "-" -replace "@", ""
        $existing = Get-ChildItem $CliCacheDir -Filter "${safeName}*.tgz" -ErrorAction SilentlyContinue
        if ($existing) {
            Write-Host "  [SKIP] $pkg already cached"
            continue
        }
        Write-Host "  [PACK] $pkg"
        try {
            Push-Location $CliCacheDir
            & $NpmCmd pack $pkg --registry $NpmRegistry 2>&1 | Out-Null
            Pop-Location
        } catch {
            Write-Host "  [WARN] Failed to download $pkg : $_" -ForegroundColor Yellow
            Pop-Location
        }
    }
}

# ============================================================================
# Step 2: Build Rust binaries
# ============================================================================
if (-not $SkipRustBuild) {
    Write-Step "Building Rust binaries"
    Push-Location $ProjectRoot

    Write-Host "  Building frontend..."
    & pnpm install
    Push-Location (Join-Path $ProjectRoot "frontend")
    & pnpm build
    Pop-Location

    Write-Host "  Building gitcortex-server..."
    & cargo build --release -p server
    Copy-Item "target\release\server.exe" (Join-Path $BuildDir "gitcortex-server.exe") -Force

    Write-Host "  Building gitcortex-tray..."
    & cargo build --release -p gitcortex-tray
    Copy-Item "target\release\gitcortex-tray.exe" (Join-Path $BuildDir "gitcortex-tray.exe") -Force

    Pop-Location
}

# ============================================================================
# Step 3: Run Inno Setup compiler
# ============================================================================
Write-Step "Building installer"

if (-not (Test-Path $InnoSetupPath)) {
    Write-Host "[ERROR] Inno Setup compiler not found at: $InnoSetupPath" -ForegroundColor Red
    Write-Host "Install Inno Setup 6 from https://jrsoftware.org/isdl.php"
    exit 1
}

$IssFile = Join-Path $ScriptDir "gitcortex.iss"
Write-Host "  Running ISCC: $IssFile"
& $InnoSetupPath $IssFile

if ($LASTEXITCODE -eq 0) {
    $OutputExe = Get-ChildItem $OutputDir -Filter "*.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    Write-Host "`n[SUCCESS] Installer built: $($OutputExe.FullName)" -ForegroundColor Green
    Write-Host "Size: $([math]::Round($OutputExe.Length / 1MB, 1)) MB"
} else {
    Write-Host "`n[ERROR] Inno Setup compilation failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}
