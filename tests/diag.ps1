# Reproduces the reported launch/quit/relaunch problems with the released installer.
$ErrorActionPreference = 'Continue'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
New-Item -ItemType Directory -Force shots | Out-Null
function Shot($name) {
  $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  $bmp = New-Object Drawing.Bitmap $b.Width, $b.Height
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($b.Location, [Drawing.Point]::Empty, $b.Size)
  $bmp.Save("shots\$name.png"); $g.Dispose(); $bmp.Dispose()
}
function Procs($label) {
  $p = @(Get-Process WakeKeeper -ErrorAction SilentlyContinue)
  Write-Host "[$label] WakeKeeper processes: $($p.Count) $(($p | ForEach-Object { "pid=$($_.Id) responding=$($_.Responding) title='$($_.MainWindowTitle)'" }) -join '; ')"
}
Write-Host "Session: $([Environment]::UserInteractive) user=$env:USERNAME os=$([Environment]::OSVersion)"
Get-Process explorer -ErrorAction SilentlyContinue | Select-Object -First 1 | ForEach-Object { Write-Host "explorer running pid=$($_.Id)" }
Invoke-WebRequest https://github.com/SurajsinghBayas/wakekeeper/releases/latest/download/WakeKeeper-Setup.exe -OutFile setup.exe
Start-Process .\setup.exe -ArgumentList '/S' -Wait
$exe = "$env:LOCALAPPDATA\Programs\WakeKeeper\WakeKeeper.exe"
Write-Host "Installed: $(Test-Path $exe)"
Procs 'after install'
Start-Process $exe; Start-Sleep 6; Procs 'launch 1'; Shot '1-launch'
& $exe --quit; Start-Sleep 4; Procs 'after --quit'
Start-Process $exe; Start-Sleep 6; Procs 'launch 2'; Shot '2-relaunch'
Start-Process $exe; Start-Sleep 4; Procs 'second copy'; Shot '3-second-copy'
Get-Process WakeKeeper -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep 2
Start-Process $exe -Verb RunAs; Start-Sleep 6; Procs 'run as admin'; Shot '4-admin'
powercfg /requests
Get-ChildItem "$env:APPDATA\WakeKeeper" -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "settings file: $($_.Name) $($_.Length)" }
Get-WinEvent -FilterHashtable @{ LogName = 'Application'; StartTime = (Get-Date).AddMinutes(-15) } -ErrorAction SilentlyContinue |
  Where-Object { $_.ProviderName -in '.NET Runtime', 'Application Error', 'Windows Error Reporting' } |
  ForEach-Object { Write-Host "EVENT $($_.ProviderName) $($_.Id): $($_.Message.Substring(0, [Math]::Min(1500, $_.Message.Length)))" }
