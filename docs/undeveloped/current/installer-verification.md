# GitCortex Windows Installer - Verification Plan

## Test Environment Requirements
- Clean Windows 10/11 VM (no prior Node.js, Git, or AI CLIs installed)
- Internet access (or pre-downloaded installer for offline test)
- Admin privileges

## Verification Checklist

### 1. Installation

- [ ] Run `GitCortex-Setup-v{version}.exe`
- [ ] Language selection shows Chinese Simplified when system locale is zh-CN
- [ ] Component selection page shows all components checked by default
- [ ] China mirror option auto-appears for zh-CN locale
- [ ] Installation completes without errors
- [ ] Desktop shortcut created (if selected)
- [ ] Start Menu folder created
- [ ] VC++ Runtime installed silently
- [ ] `.env` file generated with valid encryption key and API token
- [ ] Firewall rule added for port 23456

### 2. Bundled Tools Verification

- [ ] `node --version` returns v22.x (from `{app}\node_portable`)
- [ ] `git --version` returns v2.47+ (from `{app}\mingit\cmd`)
- [ ] `gh --version` returns v2.63+ (from `{app}\gh`)
- [ ] All 9 AI CLIs installed from offline cache:
  - [ ] `claude --version`
  - [ ] `codex --version`
  - [ ] `gemini --version`
  - [ ] `amp --version`
  - [ ] `qwen --version`
  - [ ] `opencode --version`
  - [ ] `droid --version`
  - [ ] `cursor-agent --version`
  - [ ] `gh copilot --version`

### 3. Server Startup

- [ ] System tray icon appears after installation
- [ ] Right-click menu shows: Open GitCortex, Start Server, Stop Server, Quit
- [ ] Server starts automatically on tray app launch
- [ ] Browser opens to `http://127.0.0.1:23456`
- [ ] Web UI loads successfully
- [ ] Setup wizard or first-run wizard appears on first visit

### 4. First-Run Wizard

- [ ] Welcome step displays correctly
- [ ] Environment step shows all CLIs with checkmarks
- [ ] API Key step provides guidance
- [ ] "Skip" button works at any step
- [ ] Completing wizard navigates to Board page
- [ ] Wizard does not appear on subsequent visits

### 5. Settings > Runtime Environment

- [ ] Navigate to Settings > Runtime
- [ ] All bundled CLI tools listed with versions
- [ ] Refresh button re-detects CLI tools
- [ ] Installation paths displayed correctly

### 6. CLI Installation via UI

- [ ] Go to Settings > Agents
- [ ] Install button works for individual CLIs
- [ ] Uninstall button works
- [ ] Progress streaming shows output
- [ ] npm mirror (npmmirror.com) used when China mirror was selected during install

### 7. Core Functionality

- [ ] Create a new project (bind to a local git repository)
- [ ] Create a manual workflow with at least one task
- [ ] Verify Git worktree creation works (uses bundled MinGit)
- [ ] Start the workflow (requires at least one configured AI CLI with valid API key)

### 8. System Tray Lifecycle

- [ ] Start Server: starts `gitcortex-server.exe`
- [ ] Stop Server: stops the server process
- [ ] Open GitCortex: opens browser to web UI
- [ ] Quit: stops server and exits tray app
- [ ] Auto-start on login (if startup shortcut was created)

### 9. Reboot Test

- [ ] Restart the computer
- [ ] Tray app auto-starts (if startup was selected)
- [ ] Server starts automatically
- [ ] Web UI accessible

### 10. Update Test

- [ ] Download a newer installer version
- [ ] Run installer over existing installation
- [ ] `.env` file preserved (encryption key not regenerated)
- [ ] Database preserved
- [ ] Server starts successfully after update
- [ ] No duplicate PATH entries

### 11. Uninstall Test

- [ ] Run uninstaller from Start Menu or Add/Remove Programs
- [ ] Server process killed
- [ ] Tray app process killed
- [ ] Installation directory removed
- [ ] Firewall rule removed
- [ ] PATH entries cleaned up
- [ ] Desktop shortcut removed
- [ ] Start Menu folder removed
- [ ] `.env` and database files removed (or user prompted)

### 12. Silent Install Test

```powershell
GitCortex-Setup-v{version}.exe /VERYSILENT /SUPPRESSMSGBOXES /NORESTART
```
- [ ] Installs without any UI
- [ ] All components installed
- [ ] Server accessible after installation

## Known Limitations

1. **No code signing**: Windows SmartScreen may warn on first run. Users should click "More info" → "Run anyway".
2. **AI CLI versions**: Bundled .tgz packages are snapshot versions from build time. Use Settings > Agents to update.
3. **PATH conflicts**: If user has system Node.js/Git, bundled versions take precedence in GitCortex processes but don't affect user's system tools.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| SmartScreen blocks installer | Not code-signed | Click "More info" → "Run anyway" |
| Server won't start | Port 23456 in use | Check `netstat -ano | findstr :23456`, kill conflicting process |
| CLI not detected after install | PATH not refreshed | Restart tray app or reopen terminal |
| npm install fails | Network/mirror issue | Check npm mirror setting in `{app}\node_portable\.npmrc` |
| Database errors | Missing encryption key | Verify `GITCORTEX_ENCRYPTION_KEY` in `{app}\.env` |
