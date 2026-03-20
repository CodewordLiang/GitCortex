# GitCortex Windows Installer

Builds a standalone `.exe` installer for Windows using [Inno Setup](https://jrsoftware.org/isinfo.php).

## What's Bundled

| Component | Purpose |
|-----------|---------|
| `gitcortex-server.exe` | Backend server with embedded frontend |
| `gitcortex-tray.exe` | System tray lifecycle manager |
| Node.js 22 (portable) | Runtime for AI CLI tools |
| MinGit | Git operations (worktrees, branches) |
| GitHub CLI (`gh`) | GitHub Copilot CLI extension |
| AI CLI .tgz cache | Offline install of all 9 AI CLIs |
| VC++ Runtime | Windows C++ runtime dependency |

## Prerequisites

- **Rust** nightly-2025-12-04
- **Node.js** >= 22 with pnpm
- **Inno Setup 6** ([download](https://jrsoftware.org/isdl.php))

## Build

```powershell
# One-click build (downloads deps + compiles + packages)
powershell -ExecutionPolicy Bypass -File build-installer.ps1

# With China mirror for npm packages
powershell -ExecutionPolicy Bypass -File build-installer.ps1 -ChinaMirror

# Skip Rust rebuild (if binaries already compiled)
powershell -ExecutionPolicy Bypass -File build-installer.ps1 -SkipRustBuild

# Skip downloads (if deps already cached in build/)
powershell -ExecutionPolicy Bypass -File build-installer.ps1 -SkipDownloads
```

Output: `output/GitCortex-Setup-v{version}.exe`

## Directory Structure

```
installer/
├── gitcortex.iss           # Inno Setup main script
├── modpath.iss             # PATH modification helper
├── build-installer.ps1     # One-click build script
├── scripts/
│   ├── generate-key.ps1    # Encryption key generator
│   ├── configure-npm.ps1   # npm mirror configurator
│   └── install-single-cli.ps1  # Per-CLI install/uninstall
├── assets/
│   └── gitcortex.ico       # Application icon
├── build/                  # (gitignored) Downloaded dependencies
└── output/                 # (gitignored) Built installer .exe
```

## Silent Install

```powershell
GitCortex-Setup-v0.0.153.exe /VERYSILENT /SUPPRESSMSGBOXES /NORESTART
```

## Code Signing

The installer is not currently code-signed. Windows SmartScreen will show a warning on first run. To bypass: click "More info" → "Run anyway".

For production releases, sign with a code-signing certificate:
```powershell
signtool sign /f cert.pfx /p password /tr http://timestamp.digicert.com /td sha256 /fd sha256 GitCortex-Setup-v0.0.153.exe
```
