# WakeKeeper

A Windows tray app that keeps your PC awake while long jobs run, with timers, app and download sessions,
lid-closed mode and automatic Triggers.

## Build

Requires the .NET 8 SDK.

```powershell
dotnet run                                  # debug
dotnet publish -c Release -r win-x64 --self-contained -p:PublishSingleFile=true
```

The output is `bin/Release/net8.0-windows/win-x64/publish/WakeKeeper.exe`.
Settings are stored in `%APPDATA%\WakeKeeper\settings.json`.

## How it works

| Feature                                                                                  | Windows implementation                                                                   |
|------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| Sessions: indefinite, minutes/hours, until a time, while an app runs, while a file downloads | `SetThreadExecutionState`                                                             |
| Allow display sleep, allow screen saver after N                                          | `ES_DISPLAY_REQUIRED` toggled on or off                                                  |
| Lid closed mode                                                                          | `powercfg` sets the lid action to "Do nothing" during sessions, with a crash-safe restore |
| End on low battery, end if unplugged, restart when replugged                             | `SystemInformation.PowerStatus`                                                          |
| Move cursor / lock screen after inactivity                                               | `GetLastInputInfo`, `SendInput`, `LockWorkStation`                                       |
| Triggers: app, battery and power, Wi-Fi, schedule, idle, CPU, drives                     | Process list, `netsh wlan`, `GetSystemTimes`, `DriveInfo`                                |
| Drive Alive                                                                              | Hidden file written at a set interval                                                    |
| Hot keys                                                                                 | `RegisterHotKey`                                                                         |
| End on sleep, start after wake, user switching                                           | `SystemEvents.PowerModeChanged` / `SessionSwitch`                                        |
| Launch at login                                                                          | `HKCU\…\Run`                                                                           |
| Notifications, reminders, statistics                                                     | Tray balloon tips                                                                        |

### Not yet included
- Triggers for Bluetooth, USB, audio output, displays, DNS, IP and VPN. Each one needs its own Windows API.
- A scripting interface (a CLI or named pipe).

### Windows-specific notes
- On Windows, the screen saver and display sleep are both controlled by the display request. Because of that, "allow screen saver after N" also lets the display turn off.
- On some machines, changing the lid action needs administrator rights. If it fails, WakeKeeper shows a notification.
- On Windows 11 24H2 and later, reading the Wi-Fi SSID needs Location access.
- Left-clicking the tray icon starts or ends a session, and right-clicking opens the menu.
