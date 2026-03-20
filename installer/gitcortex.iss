; ============================================================================
; GitCortex Windows Installer - Inno Setup Script
; Bundles: server + tray + Node.js portable + Git (portable) + gh CLI + AI CLIs
; ============================================================================

#define MyAppName "GitCortex"
#define MyAppVersion "0.0.153"
#define MyAppPublisher "GitCortex"
#define MyAppURL "https://github.com/huanchong-99/GitCortex"
#define MyAppExeName "gitcortex-tray.exe"
#define DefaultPort "23456"

[Setup]
AppId={{7B8C4D2E-3F1A-4E5B-9C6D-8A7B3E2F1D4C}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}/issues
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=..\LICENSE
OutputDir=output
OutputBaseFilename=GitCortex-Setup-v{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
SetupIconFile=assets\GitCortex.ico
UninstallDisplayIcon={app}\gitcortex-tray.exe
MinVersion=10.0
ShowLanguageDialog=auto

[Languages]
Name: "chinesesimplified"; MessagesFile: "compiler:Languages\ChineseSimplified.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Types]
Name: "full"; Description: "Full installation (recommended)"
Name: "compact"; Description: "Compact installation (server only)"
Name: "custom"; Description: "Custom installation"; Flags: iscustom

[Components]
Name: "server"; Description: "GitCortex Server"; Types: full compact custom; Flags: fixed
Name: "tray"; Description: "System Tray Helper"; Types: full custom
Name: "nodejs"; Description: "Node.js 22 Runtime (portable)"; Types: full custom
Name: "git"; Description: "Git (portable, includes bash)"; Types: full custom
Name: "ghcli"; Description: "GitHub CLI (gh)"; Types: full custom
Name: "aiclis"; Description: "AI CLI Tools (offline cache)"; Types: full custom
Name: "vcredist"; Description: "Visual C++ Runtime"; Types: full custom

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional shortcuts:"; Components: tray
Name: "startupicon"; Description: "Start with Windows"; GroupDescription: "Startup:"; Components: tray
Name: "chinamirror"; Description: "Use npmmirror.com (China mirror)"; GroupDescription: "Network:"; Components: nodejs; Check: IsChineseLocale
Name: "firewall"; Description: "Add Windows Firewall exception (port {#DefaultPort})"; GroupDescription: "Network:"

[Files]
; Core binaries
Source: "build\gitcortex-server.exe"; DestDir: "{app}"; Components: server; Flags: ignoreversion
Source: "build\gitcortex-tray.exe"; DestDir: "{app}"; Components: tray; Flags: ignoreversion

; Node.js portable
Source: "build\node_portable\*"; DestDir: "{app}\node_portable"; Components: nodejs; Flags: ignoreversion recursesubdirs createallsubdirs

; Git (portable, includes bash for Claude Code)
Source: "build\git\*"; DestDir: "{app}\git"; Components: git; Flags: ignoreversion recursesubdirs createallsubdirs

; GitHub CLI
Source: "build\gh\*"; DestDir: "{app}\gh"; Components: ghcli; Flags: ignoreversion recursesubdirs createallsubdirs

; AI CLI offline cache (npm tarballs)
Source: "build\cli-cache\*"; DestDir: "{app}\cli-cache"; Components: aiclis; Flags: ignoreversion recursesubdirs createallsubdirs

; VC++ Runtime
Source: "build\vc_redist.x64.exe"; DestDir: "{tmp}"; Components: vcredist; Flags: deleteafterinstall

; Installer helper scripts
Source: "scripts\generate-key.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "scripts\configure-npm.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "scripts\install-single-cli.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion

; Assets
Source: "assets\GitCortex.ico"; DestDir: "{app}\assets"; Flags: ignoreversion

; modpath helper
Source: "modpath.iss"; DestDir: "{tmp}"; Flags: deleteafterinstall dontcopy

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Components: tray
Name: "{group}\Open {#MyAppName} Web UI"; Filename: "http://127.0.0.1:{#DefaultPort}"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon; Components: tray
Name: "{commonstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: startupicon; Components: tray

[Run]
; Install VC++ Runtime silently
Filename: "{tmp}\vc_redist.x64.exe"; Parameters: "/install /quiet /norestart"; StatusMsg: "Installing Visual C++ Runtime..."; Components: vcredist; Flags: waituntilterminated

; Generate encryption key and API token
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\generate-key.ps1"" -EnvFile ""{app}\.env"""; StatusMsg: "Generating encryption keys..."; Flags: runhidden waituntilterminated

; Configure npm mirror (if China mirror selected)
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\configure-npm.ps1"" -NodeDir ""{app}\node_portable"" -UseChinaMirror"; StatusMsg: "Configuring npm mirror..."; Components: nodejs; Tasks: chinamirror; Flags: runhidden waituntilterminated

; Configure npm (official registry, if China mirror NOT selected)
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\configure-npm.ps1"" -NodeDir ""{app}\node_portable"""; StatusMsg: "Configuring npm..."; Components: nodejs; Tasks: not chinamirror; Flags: runhidden waituntilterminated

; Install AI CLIs from offline cache
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -Command ""$env:GITCORTEX_INSTALL_DIR='{app}'; Get-ChildItem '{app}\cli-cache\*.tgz' | ForEach-Object {{ & '{app}\node_portable\npm.cmd' install -g $_.FullName 2>&1 }}"""; StatusMsg: "Installing AI CLI tools from cache..."; Components: aiclis and nodejs; Flags: runhidden waituntilterminated

; Install gh-copilot extension
Filename: "{app}\gh\gh.exe"; Parameters: "extension install github/gh-copilot"; StatusMsg: "Installing GitHub Copilot CLI..."; Components: ghcli and aiclis; Flags: runhidden waituntilterminated runasoriginaluser

; Launch tray app after install
Filename: "{app}\{#MyAppExeName}"; Description: "Launch {#MyAppName}"; Components: tray; Flags: nowait postinstall skipifsilent

; Open web UI after install
Filename: "http://127.0.0.1:{#DefaultPort}"; Description: "Open {#MyAppName} in browser"; Flags: shellexec nowait postinstall skipifsilent unchecked

[UninstallRun]
; Stop server before uninstall
Filename: "taskkill"; Parameters: "/F /IM gitcortex-server.exe"; Flags: runhidden
Filename: "taskkill"; Parameters: "/F /IM gitcortex-tray.exe"; Flags: runhidden

[UninstallDelete]
Type: filesandordirs; Name: "{app}\node_portable"
Type: filesandordirs; Name: "{app}\git"
Type: filesandordirs; Name: "{app}\gh"
Type: filesandordirs; Name: "{app}\cli-cache"
Type: filesandordirs; Name: "{app}\scripts"
Type: filesandordirs; Name: "{app}\assets"
Type: files; Name: "{app}\.env"

[Code]
// Check if system locale is Chinese
function IsChineseLocale(): Boolean;
var
  UILang: Integer;
begin
  UILang := GetUILanguage();
  // Chinese Simplified: 0x0804, Chinese Traditional: 0x0404
  Result := (UILang = $0804) or (UILang = $0404) or
            (UILang and $00FF = $04); // Any Chinese sublang
end;

// Check if system Node.js >= 22 is available
function IsSystemNodeAvailable(): Boolean;
var
  ResultCode: Integer;
  Output: AnsiString;
begin
  Result := False;
  if Exec('cmd.exe', '/C node --version > "%TEMP%\gc_node_ver.txt" 2>&1', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
  begin
    if ResultCode = 0 then
    begin
      if LoadStringFromFile(ExpandConstant('{tmp}\gc_node_ver.txt'), Output) then
      begin
        if (Pos('v22.', String(Output)) > 0) or (Pos('v23.', String(Output)) > 0) or
           (Pos('v24.', String(Output)) > 0) or (Pos('v25.', String(Output)) > 0) then
          Result := True;
      end;
    end;
  end;
end;

// Check if system Git >= 2.38 is available
function IsSystemGitAvailable(): Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('cmd.exe', '/C git --version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode)
           and (ResultCode = 0);
end;

// Add to user PATH
procedure ModifyPath();
var
  OldPath, NewPaths: String;
begin
  if RegQueryStringValue(HKEY_CURRENT_USER, 'Environment', 'Path', OldPath) then
  begin
    NewPaths := '';

    // Add app bin directory
    if Pos(ExpandConstant('{app}'), OldPath) = 0 then
      NewPaths := NewPaths + ExpandConstant('{app}') + ';';

    // Add node_portable
    if WizardIsComponentSelected('nodejs') and (Pos(ExpandConstant('{app}\node_portable'), OldPath) = 0) then
      NewPaths := NewPaths + ExpandConstant('{app}\node_portable') + ';';

    // Add node npm-global bin
    if WizardIsComponentSelected('nodejs') and (Pos(ExpandConstant('{app}\node_portable\npm-global'), OldPath) = 0) then
      NewPaths := NewPaths + ExpandConstant('{app}\node_portable\npm-global') + ';';

    // Add git
    if WizardIsComponentSelected('git') and (Pos(ExpandConstant('{app}\git\cmd'), OldPath) = 0) then
      NewPaths := NewPaths + ExpandConstant('{app}\git\cmd') + ';';

    // Add gh
    if WizardIsComponentSelected('ghcli') and (Pos(ExpandConstant('{app}\gh'), OldPath) = 0) then
      NewPaths := NewPaths + ExpandConstant('{app}\gh') + ';';

    if NewPaths <> '' then
    begin
      RegWriteStringValue(HKEY_CURRENT_USER, 'Environment', 'Path', NewPaths + OldPath);
    end;
  end;
end;

// Remove from user PATH on uninstall
procedure RemoveFromPath();
var
  OldPath, AppDir: String;
begin
  if RegQueryStringValue(HKEY_CURRENT_USER, 'Environment', 'Path', OldPath) then
  begin
    AppDir := ExpandConstant('{app}');
    // Simple removal: remove all occurrences of app directory segments
    StringChangeEx(OldPath, AppDir + ';', '', True);
    StringChangeEx(OldPath, AppDir + '\node_portable;', '', True);
    StringChangeEx(OldPath, AppDir + '\node_portable\npm-global;', '', True);
    StringChangeEx(OldPath, AppDir + '\git\cmd;', '', True);
    StringChangeEx(OldPath, AppDir + '\gh;', '', True);
    RegWriteStringValue(HKEY_CURRENT_USER, 'Environment', 'Path', OldPath);
  end;
end;

// Add firewall rule
procedure AddFirewallRule();
var
  ResultCode: Integer;
begin
  Exec('netsh', ExpandConstant('advfirewall firewall add rule name="GitCortex Server" dir=in action=allow protocol=TCP localport={#DefaultPort} program="{app}\gitcortex-server.exe"'),
       '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;

// Remove firewall rule on uninstall
procedure RemoveFirewallRule();
var
  ResultCode: Integer;
begin
  Exec('netsh', 'advfirewall firewall delete rule name="GitCortex Server"',
       '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    ModifyPath();
    if WizardIsTaskSelected('firewall') then
      AddFirewallRule();
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
  begin
    RemoveFromPath();
    RemoveFirewallRule();
  end;
end;
