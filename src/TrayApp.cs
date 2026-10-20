using System.Drawing.Drawing2D;
using Microsoft.Win32;

namespace WakeKeeper;

/// <summary>System-tray application: icon, menu, timers, hot keys and power events.</summary>
internal sealed class TrayApp : ApplicationContext
{
    // Grouped the way the menu shows them; a separator goes between groups.
    private static readonly int[][] MinuteGroups = { new[] { 5 }, new[] { 10, 15 }, new[] { 20, 25 }, new[] { 30, 35 }, new[] { 40, 45 }, new[] { 50, 55 } };
    private static readonly int[][] HourGroups = { new[] { 1, 2, 3, 4, 5, 6, 7, 8, 9 }, new[] { 10, 12, 24 } };

    private readonly Settings _settings;
    private readonly SessionManager _sessions;
    private readonly TriggerEngine _triggers;
    private readonly DriveSpinner _driveSpinner;
    private readonly NotifyIcon _tray;
    private readonly Icon _activeIcon, _inactiveIcon;
    private readonly System.Windows.Forms.Timer _timer = new() { Interval = 1000 };
    private readonly HotkeyWindow _hotkeys;
    private SettingsForm? _settingsForm;
    private AboutDialog? _about;
    private int _tickCount;
    private Icon? _countdownIcon;
    private string? _countdownLabel;

    public TrayApp(InstanceSignals signals)
    {
        bool firstRun = !Settings.Exists;
        _settings = Settings.Load();
        Log.Enabled = _settings.DebugMode;
        // The installer may have registered (or the user removed) the startup entry; the registry is the truth.
        _settings.LaunchAtLogin = Startup.IsEnabled;
        LidControl.Restore(); // recover from a crash while lid-closed mode was active
        _sessions = new SessionManager(_settings);
        _triggers = new TriggerEngine(_settings, _sessions);
        _driveSpinner = new DriveSpinner(_settings, _sessions);

        _activeIcon = DrawIcon(active: true);
        _inactiveIcon = DrawIcon(active: false);
        _tray = new NotifyIcon { Icon = _inactiveIcon, Visible = true, Text = "WakeKeeper", ContextMenuStrip = new ContextMenuStrip() };
        _tray.ContextMenuStrip.Opening += (_, _) => BuildMenu();
        _tray.MouseClick += (_, e) =>
        {
            // Left click starts or ends a session; right click shows the menu.
            if (e.Button == MouseButtons.Left) ToggleSession();
        };

        _sessions.Changed += UpdateTray;
        _sessions.Notify += (title, body) => _tray.ShowBalloonTip(4000, title, body, ToolTipIcon.None);

        _hotkeys = new HotkeyWindow();
        _hotkeys.Pressed += id =>
        {
            if (id == HotkeyWindow.StartEndId) ToggleSession();
            else if (id == HotkeyWindow.DisplaySleepId) _sessions.ToggleDisplaySleep();
        };
        RegisterHotkeys();

        SystemEvents.PowerModeChanged += OnPowerModeChanged;
        SystemEvents.SessionSwitch += OnSessionSwitch;

        _timer.Tick += (_, _) => Tick();
        _timer.Start();

        // Creating the ContextMenuStrip installed the WinForms synchronization context.
        var ui = SynchronizationContext.Current!;
        signals.Listen(
            onQuit: () => ui.Post(_ => ExitThread(), null),
            onShow: () => ui.Post(_ => _tray.ShowBalloonTip(4000, "WakeKeeper is already running",
                "Click the cup in the taskbar to keep your PC awake. Right-click it for more options.", ToolTipIcon.None), null));

        if (_settings.StartSessionAtLaunch) _sessions.StartDefault();
        UpdateTray();

        if (firstRun)
        {
            _settings.Save();
            _tray.ShowBalloonTip(8000, "WakeKeeper is ready",
                "Click the cup in the taskbar to keep your PC awake. Right-click it for timers, lid-closed mode and more.", ToolTipIcon.None);
        }
    }

    private void Tick()
    {
        _sessions.Tick();
        if (++_tickCount % 5 == 0) _triggers.Tick();
        _driveSpinner.Tick();
        if (_sessions.Current?.Remaining != null) UpdateTray();
    }

    private void ToggleSession()
    {
        if (_sessions.Current != null) EndSession();
        else _sessions.StartDefault();
    }

    private void EndSession()
    {
        // Ending a Trigger session would immediately restart it, so offer to pause Triggers.
        if (_sessions.Current is { Kind: SessionKind.Trigger })
        {
            var r = MessageBox.Show("This session was started by an auto-start rule. Pause all rules for 1 hour?",
                "WakeKeeper", MessageBoxButtons.OKCancel, MessageBoxIcon.Question);
            if (r != DialogResult.OK) return;
            _triggers.PauseFor(TimeSpan.FromHours(1));
            return;
        }
        _sessions.End();
    }

    private void UpdateTray()
    {
        var s = _sessions.Current;
        _tray.Icon = s == null ? _inactiveIcon
            : _settings.ShowTimeRemainingInTray && s.Remaining is { } left ? CountdownIcon(left)
            : _activeIcon;
        var text = s == null ? "WakeKeeper — not active" : $"WakeKeeper — {s.Describe()}";
        _tray.Text = text.Length > 127 ? text[..127] : text;
    }

    /// <summary>The tray has no room for text beside the icon, so the time left is drawn as the icon itself.</summary>
    private Icon CountdownIcon(TimeSpan left)
    {
        string label = left.TotalMinutes < 60 ? $"{Math.Max(1, (int)Math.Ceiling(left.TotalMinutes))}"
            : left.TotalHours < 100 ? $"{(int)left.TotalHours}h"
            : $"{(int)left.TotalDays}d";
        if (label == _countdownLabel && _countdownIcon != null) return _countdownIcon;

        using var bmp = new Bitmap(32, 32);
        using (var g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;
            using var tile = new GraphicsPath();
            tile.AddArc(0, 0, 12, 12, 180, 90);
            tile.AddArc(20, 0, 12, 12, 270, 90);
            tile.AddArc(20, 20, 12, 12, 0, 90);
            tile.AddArc(0, 20, 12, 12, 90, 90);
            tile.CloseFigure();
            using var fill = new SolidBrush(Color.FromArgb(255, 2, 132, 199));
            g.FillPath(fill, tile);
            float size = label.Length <= 2 ? 17 : 12.5f;
            using var font = new Font("Segoe UI", size, FontStyle.Bold, GraphicsUnit.Pixel);
            using var format = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
            g.DrawString(label, font, Brushes.White, new RectangleF(0, 1, 32, 32), format);
        }
        var handle = bmp.GetHicon();
        var icon = (Icon)Icon.FromHandle(handle).Clone();
        Native.DestroyIcon(handle);

        var old = _countdownIcon;
        _countdownIcon = icon;
        _countdownLabel = label;
        _tray.Icon = icon;
        old?.Dispose();
        return icon;
    }

    private void BuildMenu()
    {
        var menu = _tray.ContextMenuStrip!;
        menu.Items.Clear();
        var s = _sessions.Current;

        if (s != null)
        {
            menu.Items.Add(new ToolStripMenuItem(s.Describe()) { Enabled = false });
            menu.Items.Add("&End session", null, (_, _) => EndSession());
            if (s.Kind is SessionKind.Duration or SessionKind.Until)
            {
                var extend = new ToolStripMenuItem("Add time");
                foreach (var m in new[] { 15, 30, 60, 120 })
                    extend.DropDownItems.Add(FormatMinutes(m), null, (_, _) => _sessions.Extend(m));
                menu.Items.Add(extend);
            }
        }
        else
        {
            menu.Items.Add(new ToolStripMenuItem("Not keeping your PC awake") { Enabled = false });
        }

        if (SystemProbe.HasBattery)
            menu.Items.Add(Check("Keep running with lid closed", _settings.PreventSleepWhenLidClosed, SetLidClosedMode));

        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add(new ToolStripMenuItem("Keep awake:") { Enabled = false });
        menu.Items.Add(new ToolStripMenuItem("&Until I stop it", null, (_, _) => _sessions.Start(new Session { Kind = SessionKind.Indefinite }))
        {
            ShortcutKeyDisplayString = _settings.StartEndHotkey.IsSet ? _settings.StartEndHotkey.ToString() : null,
        });
        menu.Items.Add(DurationMenu("&Minutes", MinuteGroups, 1));
        menu.Items.Add(DurationMenu("&Hours", HourGroups, 60));
        menu.Items.Add("&Custom time...", null, (_, _) => PromptTime());

        var apps = new ToolStripMenuItem("While an &app is open");
        foreach (var name in SystemProbe.WindowedProcessNames())
            apps.DropDownItems.Add(name, null, (_, _) => _sessions.Start(new Session { Kind = SessionKind.WhileApp, AppName = name }));
        if (apps.DropDownItems.Count == 0) apps.Enabled = false;
        menu.Items.Add(apps);
        menu.Items.Add("Until &downloads finish", null, (_, _) => _sessions.Start(new Session { Kind = SessionKind.WhileDownloading }));

        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add(QuickSettingsMenu());
        menu.Items.Add("&Settings...", null, (_, _) => ShowSettings());

        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("About WakeKeeper", null, (_, _) => ShowAbout());
        menu.Items.Add(SupportMenu());

        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("&Quit WakeKeeper", null, (_, _) => ExitThread());
    }

    private ToolStripMenuItem DurationMenu(string text, int[][] groups, int unitMinutes)
    {
        var item = new ToolStripMenuItem(text);
        foreach (var group in groups)
        {
            if (item.DropDownItems.Count > 0) item.DropDownItems.Add(new ToolStripSeparator());
            foreach (var n in group)
            {
                int minutes = n * unitMinutes;
                item.DropDownItems.Add(FormatMinutes(minutes), null, (_, _) => StartFor(minutes));
            }
        }
        return item;
    }

    /// <summary>Quick Options mirror the saved Settings (the defaults for new sessions), not just the current session.</summary>
    private ToolStripMenuItem QuickSettingsMenu()
    {
        var quick = new ToolStripMenuItem("Quick Options");
        var items = quick.DropDownItems;
        items.Add(new ToolStripMenuItem("Saved defaults for new sessions.\nChanges apply to the running one too.") { Enabled = false });

        items.Add(new ToolStripSeparator());
        items.Add(Header("New sessions"));
        items.Add(Check("Let the screen turn off", _settings.AllowDisplaySleep, v => _sessions.SetDisplaySleep(v)));
        if (SystemProbe.HasBattery)
            items.Add(Check("Keep running with lid closed", _settings.PreventSleepWhenLidClosed, SetLidClosedMode));
        items.Add(Check($"Allow screen saver when idle {_settings.AllowScreenSaverAfterMinutes} min", _settings.AllowScreenSaver, v => _settings.AllowScreenSaver = v));
        if (SystemProbe.HasBattery)
        {
            items.Add(Check($"Stop below {_settings.LowBatteryPercent}% battery", _settings.EndSessionOnLowBattery, v => _settings.EndSessionOnLowBattery = v));
            items.Add(Check("Stop when unplugged", _settings.EndSessionIfUnplugged, v => _settings.EndSessionIfUnplugged = v));
        }

        items.Add(new ToolStripSeparator());
        items.Add(Header("When I'm away"));
        items.Add(Check($"Lock the PC when idle {_settings.LockScreenAfterMinutes} min", _settings.LockScreenWhenIdle, v => _settings.LockScreenWhenIdle = v));
        items.Add(Check($"Nudge the mouse when idle {_settings.MoveCursorAfterMinutes} min", _settings.MoveCursorWhenIdle, v => _settings.MoveCursorWhenIdle = v));

        items.Add(new ToolStripSeparator());
        items.Add(Header("More"));
        var triggers = _settings.TriggersEnabled && _triggers.Paused ? "Auto-start rules (paused)" : "Auto-start rules";
        items.Add(Check(triggers, _settings.TriggersEnabled, v => _settings.TriggersEnabled = v));
        items.Add(Check("Keep drives spinning", _settings.SpinDrivesEnabled, v => _settings.SpinDrivesEnabled = v));
        items.Add(Check("Show time left on the tray icon", _settings.ShowTimeRemainingInTray, v =>
        {
            _settings.ShowTimeRemainingInTray = v;
            UpdateTray();
        }));
        return quick;
    }

    private ToolStripMenuItem SupportMenu()
    {
        var support = new ToolStripMenuItem("Help && Feedback");
        var items = support.DropDownItems;
        items.Add("Troubleshooting guide", null, (_, _) => Links.Open(Links.Help));
        items.Add("Email support", null, (_, _) => Links.Open(Links.Email));
        items.Add("Report a bug", null, (_, _) => Links.Open(Links.Contact));
        items.Add(Check("Diagnostic logging", _settings.DebugMode, v =>
        {
            _settings.DebugMode = Log.Enabled = v;
            if (v) Log.Write($"Debug mode on, WakeKeeper {Links.Version}, {Environment.OSVersion}");
        }));
        items.Add(new ToolStripMenuItem("Open diagnostic log", null, (_, _) => Links.Open(Log.FilePath)) { Enabled = File.Exists(Log.FilePath) });

        items.Add(new ToolStripSeparator());
        items.Add("Restore Windows Power Settings...", null, (_, _) => RestorePowerSettings());
        items.Add("Uninstall WakeKeeper...", null, (_, _) => Links.Open("ms-settings:appsfeatures"));

        items.Add(new ToolStripSeparator());
        items.Add("Star on GitHub", null, (_, _) => Links.Open(Links.Star));

        items.Add(new ToolStripSeparator());
        items.Add("View source code", null, (_, _) => Links.Open(Links.Contribute));
        return support;
    }

    private static ToolStripMenuItem Header(string text) => new(text)
    {
        Enabled = false,
        Font = new Font(SystemFonts.MenuFont ?? Control.DefaultFont, FontStyle.Bold),
    };

    private void SetLidClosedMode(bool v)
    {
        _settings.PreventSleepWhenLidClosed = v;
        if (_sessions.Current == null) return;
        if (v && !LidControl.Override())
            _tray.ShowBalloonTip(5000, "Lid-closed mode unavailable", "Windows didn't allow the lid setting to be changed on this PC.", ToolTipIcon.Warning);
        else if (!v) LidControl.Restore();
    }

    private void RestorePowerSettings()
    {
        var r = MessageBox.Show(
            "This ends the current session and puts back your original Windows lid and sleep settings. Use it if your PC isn't sleeping the way it did before WakeKeeper.",
            "Restore Windows Power Settings", MessageBoxButtons.OKCancel, MessageBoxIcon.Information);
        if (r != DialogResult.OK) return;
        _sessions.End(silent: true);
        LidControl.Restore();
        Native.SetThreadExecutionState(Native.ExecutionState.Continuous);
        _tray.ShowBalloonTip(4000, "Power settings restored", "Windows will sleep normally again.", ToolTipIcon.None);
    }

    private void ShowAbout()
    {
        if (_about is { IsDisposed: false }) { _about.Activate(); return; }
        _about = new AboutDialog(_settings);
        _about.Show();
    }

    private ToolStripMenuItem Check(string text, bool value, Action<bool> set)
    {
        var item = new ToolStripMenuItem(text) { Checked = value, CheckOnClick = true };
        item.CheckedChanged += (_, _) => { set(item.Checked); _settings.Save(); };
        return item;
    }

    private void StartFor(int minutes) =>
        _sessions.Start(new Session { Kind = SessionKind.Duration, Ends = DateTime.Now.AddMinutes(minutes) });

    private void PromptTime()
    {
        using var dialog = new TimeDialog();
        if (dialog.ShowDialog() != DialogResult.OK || dialog.Ends is not { } ends) return;
        _sessions.Start(new Session { Kind = dialog.IsDuration ? SessionKind.Duration : SessionKind.Until, Ends = ends });
    }

    private void ShowSettings()
    {
        if (_settingsForm is { IsDisposed: false }) { _settingsForm.Activate(); return; }
        _settingsForm = new SettingsForm(_settings);
        _settingsForm.FormClosed += (_, _) =>
        {
            _settings.Save();
            Startup.Apply(_settings.LaunchAtLogin);
            RegisterHotkeys();
        };
        _settingsForm.Show();
    }

    private void RegisterHotkeys()
    {
        _hotkeys.UnregisterAll();
        if (!_hotkeys.Register(HotkeyWindow.StartEndId, _settings.StartEndHotkey))
            Log.Write($"Hot key {_settings.StartEndHotkey} is in use by another app");
        _hotkeys.Register(HotkeyWindow.DisplaySleepId, _settings.ToggleDisplaySleepHotkey);
    }

    private void OnPowerModeChanged(object? sender, PowerModeChangedEventArgs e)
    {
        if (e.Mode == PowerModes.Suspend) _sessions.OnSuspend();
        else if (e.Mode == PowerModes.Resume) _sessions.OnResume();
    }

    private void OnSessionSwitch(object? sender, SessionSwitchEventArgs e)
    {
        // Mirrors "Fast User Switching: end sessions when switching users".
        if (e.Reason == SessionSwitchReason.ConsoleDisconnect) _sessions.End(silent: true);
    }

    private static string FormatMinutes(int m) => m < 60 ? $"{m} minutes" : m == 60 ? "1 hour" : $"{m / 60} hours";

    /// <summary>Draws a coffee-cup tray icon: filled when active, outlined when inactive.</summary>
    private static Icon DrawIcon(bool active)
    {
        using var bmp = new Bitmap(32, 32);
        using (var g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            var color = active ? Color.FromArgb(255, 2, 132, 199) : Color.FromArgb(255, 100, 116, 139);
            using var pen = new Pen(color, 3) { StartCap = LineCap.Round, EndCap = LineCap.Round, LineJoin = LineJoin.Round };
            using var brush = new SolidBrush(color);

            // Mug body: flat top, rounded bottom (matches the app icon).
            using var body = new GraphicsPath();
            body.AddLine(4, 13, 21, 13);
            body.AddLine(21, 13, 21, 20);
            body.AddArc(13, 13, 8, 12, 0, 90);
            body.AddArc(4, 13, 8, 12, 90, 90);
            body.CloseFigure();
            if (active) g.FillPath(brush, body); else g.DrawPath(pen, body);

            g.DrawArc(pen, 18, 15, 9, 8, -90, 180); // handle
            if (active)
            {
                g.DrawBezier(pen, 10, 10, 8, 7, 12, 6, 10, 2);
                g.DrawBezier(pen, 16, 10, 14, 7, 18, 6, 16, 2);
            }
        }
        var handle = bmp.GetHicon();
        var icon = (Icon)Icon.FromHandle(handle).Clone();
        Native.DestroyIcon(handle);
        return icon;
    }

    protected override void ExitThreadCore()
    {
        _timer.Stop();
        _sessions.End(silent: true);
        SystemEvents.PowerModeChanged -= OnPowerModeChanged;
        SystemEvents.SessionSwitch -= OnSessionSwitch;
        _hotkeys.UnregisterAll();
        _hotkeys.DestroyHandle();
        _tray.Visible = false;
        _tray.Dispose();
        _countdownIcon?.Dispose();
        _settings.Save();
        base.ExitThreadCore();
    }
}

/// <summary>Hidden message-only window that receives WM_HOTKEY.</summary>
internal sealed class HotkeyWindow : NativeWindow
{
    public const int StartEndId = 1, DisplaySleepId = 2;
    private readonly HashSet<int> _registered = new();
    public event Action<int>? Pressed;

    public HotkeyWindow() => CreateHandle(new CreateParams { Parent = new IntPtr(-3) }); // HWND_MESSAGE

    public bool Register(int id, Hotkey key)
    {
        if (!key.IsSet) return true;
        if (!Native.RegisterHotKey(Handle, id, key.Modifiers | Native.MOD_NOREPEAT, (uint)key.Key)) return false;
        _registered.Add(id);
        return true;
    }

    public void UnregisterAll()
    {
        foreach (var id in _registered) Native.UnregisterHotKey(Handle, id);
        _registered.Clear();
    }

    protected override void WndProc(ref Message m)
    {
        if (m.Msg == Native.WM_HOTKEY) Pressed?.Invoke(m.WParam.ToInt32());
        base.WndProc(ref m);
    }
}

/// <summary>"Launch at login" via the per-user Run key (no admin rights needed).</summary>
internal static class Startup
{
    private const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run";

    public static bool IsEnabled
    {
        get
        {
            using var key = Registry.CurrentUser.OpenSubKey(RunKey);
            return key?.GetValue("WakeKeeper") != null;
        }
    }

    public static void Apply(bool enabled)
    {
        using var key = Registry.CurrentUser.OpenSubKey(RunKey, writable: true);
        if (key == null) return;
        if (enabled) key.SetValue("WakeKeeper", $"\"{Environment.ProcessPath}\"");
        else key.DeleteValue("WakeKeeper", throwOnMissingValue: false);
    }
}
