# Installs the freshly built setup wizard and checks how WakeKeeper behaves when people open, close,
# reopen, run it as administrator, sign in, quit and uninstall. Exit code 1 if any check fails.
param([string]$Setup = 'out\release\WakeKeeper-Setup.exe', [string]$Shots = 'shots')
$ErrorActionPreference = 'Continue'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
New-Item -ItemType Directory -Force $Shots | Out-Null
$script:failed = 0; $script:passed = 0
function Check($name, $ok, $detail = '') {
  if ($ok) { $script:passed++; Write-Host "PASS  $name" } else { $script:failed++; Write-Host "FAIL  $name $detail" }
}
function Shot($name) {
  $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  $bmp = New-Object Drawing.Bitmap $b.Width, $b.Height
  $g = [Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($b.Location, [Drawing.Point]::Empty, $b.Size)
  $bmp.Save("$Shots\$name.png"); $g.Dispose(); $bmp.Dispose()
}
function Procs { @(Get-Process WakeKeeper -ErrorAction SilentlyContinue) }
function WindowShown { $p = Procs; ($p | Where-Object { $_.MainWindowTitle -eq 'WakeKeeper' }).Count -gt 0 }
function WaitFor($cond, $seconds = 8) { for ($i = 0; $i -lt $seconds * 4; $i++) { if (& $cond) { return $true }; Start-Sleep -Milliseconds 250 }; return $false }

Start-Process $Setup -ArgumentList '/S' -Wait
$exe = "$env:LOCALAPPDATA\Programs\WakeKeeper\WakeKeeper.exe"
Check 'installer puts WakeKeeper.exe in place' (Test-Path $exe)
$run = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -ErrorAction SilentlyContinue).WakeKeeper
Check 'start-at-sign-in entry stays in the background' ($run -like '*--background') $run
Check 'Start menu shortcut' (Test-Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\WakeKeeper.lnk")

# Opened by the user: the window appears.
Start-Process $exe
Check 'opening WakeKeeper shows its window' (WaitFor { WindowShown })
Start-Sleep 1; Shot 'L1-opened'

# Closing the window keeps it running in the taskbar.
(Procs)[0].CloseMainWindow() | Out-Null
Check 'closing the window keeps WakeKeeper running' (WaitFor { -not (WindowShown) -and (Procs).Count -eq 1 })
Start-Sleep 1; Shot 'L2-closed'

# Opening it again brings the window back (no second copy).
Start-Process $exe
Check 'opening it again shows the window' (WaitFor { WindowShown })
Check 'still only one copy running' ((Procs).Count -eq 1) "$((Procs).Count)"
Shot 'L3-reopened'

# Quit, then open again.
& $exe --quit
Check 'quit exits the app' (WaitFor { (Procs).Count -eq 0 })
Start-Process $exe
Check 'opens again after quitting' (WaitFor { WindowShown })
& $exe --quit; WaitFor { (Procs).Count -eq 0 } | Out-Null

# Sign-in start: stays hidden in the tray.
Start-Process $exe -ArgumentList '--background'
Start-Sleep 4
Check 'sign-in start runs without a window' ((Procs).Count -eq 1 -and -not (WindowShown))
Start-Process $exe
Check 'opening it after a sign-in start shows the window' (WaitFor { WindowShown })
& $exe --quit; WaitFor { (Procs).Count -eq 0 } | Out-Null

# Run as administrator.
Start-Process $exe -Verb RunAs
Check 'run as administrator shows the window' (WaitFor { WindowShown })
Shot 'L4-admin'

# Crash (killed), then open again.
Get-Process WakeKeeper -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 1
Start-Process $exe
Check 'opens again after a crash' (WaitFor { WindowShown })
& $exe --quit; WaitFor { (Procs).Count -eq 0 } | Out-Null

# Uninstall removes everything.
Start-Process "$env:LOCALAPPDATA\Programs\WakeKeeper\Uninstall.exe" -ArgumentList '/S' -Wait
Start-Sleep 3
Check 'uninstall removes the app' (-not (Test-Path $exe))
$run = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -ErrorAction SilentlyContinue).WakeKeeper
Check 'uninstall removes the sign-in entry' (-not $run)

Get-WinEvent -FilterHashtable @{ LogName = 'Application'; StartTime = (Get-Date).AddMinutes(-20) } -ErrorAction SilentlyContinue |
  Where-Object { $_.ProviderName -in '.NET Runtime', 'Application Error' -and $_.Message -like '*WakeKeeper*' } |
  ForEach-Object { $script:failed++; Write-Host "FAIL  crash logged: $($_.Message.Substring(0, [Math]::Min(1200, $_.Message.Length)))" }

Write-Host "`n$script:passed passed, $script:failed failed"
if ($script:failed -gt 0) { exit 1 }
