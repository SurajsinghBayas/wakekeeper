using System.Drawing.Drawing2D;
using Microsoft.Win32;

namespace WakeKeeper;

/// <summary>System-tray application: icon, menu, timers, hot keys and power events.</summary>
public sealed class TrayApp : ApplicationContext
{
    private static readonly int[] DurationMinutes = { 5, 10, 15, 30, 45, 60, 120, 180, 240, 300, 360, 480, 720, 1440 };

    private readonly Settings _settings;
    private readonly SessionManager _sessions;
    private readonly TriggerEngine _triggers;
    private readonly DriveAlive _driveAlive;
    private readonly NotifyIcon _tray;
    private readonly Icon _activeIcon, _inactiveIcon;
    private readonly System.Windows.Forms.Timer _timer = new() { Interval = 1000 };
    private readonly HotkeyWindow _hotkeys;
    private SettingsForm? _settingsForm;
    private int _tickCount;

    public TrayApp()
    {
        _settings = Settings.Load();
        LidControl.Restore(); // recover from a crash while lid-closed mode was active
        _sessions = new SessionManager(_settings);
        _triggers = new TriggerEngine(_settings, _sessions);
        _driveAlive = new DriveAlive(_settings, _sessions);

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

        if (_settings.StartSessionAtLaunch) _sessions.StartDefault();
        UpdateTray();
    }

    private void Tick()
    {
        _sessions.Tick();
        if (++_tickCount % 5 == 0) _triggers.Tick();
        _driveAlive.Tick();
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
            var r = MessageBox.Show("This session was started by a Trigger. Pause all Triggers for 1 hour?",
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
        _tray.Icon = s != null ? _activeIcon : _inactiveIcon;
        var text = s == null ? "WakeKeeper — not active" : $"WakeKeeper — {s.Describe()}";
        _tray.Text = text.Length > 127 ? text[..127] : text;
    }

    private void BuildMenu()
    {
        var menu = _tray.ContextMenuStrip!;
        menu.Items.Clear();
        var s = _sessions.Current;

        if (s != null)
        {
            menu.Items.Add(new ToolStripMenuItem(s.Describe()) { Enabled = false });
            menu.Items.Add("End Session", null, (_, _) => EndSession());
            if (s.Kind is SessionKind.Duration or SessionKind.Until)
            {
                var extend = new ToolStripMenuItem("Extend Session By");
                foreach (var m in new[] { 15, 30, 60, 120 })
                    extend.DropDownItems.Add(FormatMinutes(m), null, (_, _) => _sessions.Extend(m));
                menu.Items.Add(extend);
            }
        }
        else
        {
            menu.Items.Add(new ToolStripMenuItem("Not keeping your PC awake") { Enabled = false });
        }

        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add(new ToolStripMenuItem("Start New Session:") { Enabled = false });
        menu.Items.Add("Indefinitely", null, (_, _) => _sessions.Start(new Session { Kind = SessionKind.Indefinite }));

        var minutes = new ToolStripMenuItem("Minutes");
        var hours = new ToolStripMenuItem("Hours");
        foreach (var m in DurationMinutes)
            (m < 60 ? minutes : hours).DropDownItems.Add(FormatMinutes(m), null, (_, _) => StartFor(m));
        menu.Items.Add(minutes);
        menu.Items.Add(hours);
        menu.Items.Add("Other Time/Until...", null, (_, _) => PromptUntil());

        var apps = new ToolStripMenuItem("While App is Running");
        foreach (var name in SystemProbe.WindowedProcessNames())
            apps.DropDownItems.Add(name, null, (_, _) => _sessions.Start(new Session { Kind = SessionKind.WhileApp, AppName = name }));
        if (apps.DropDownItems.Count == 0) apps.Enabled = false;
        menu.Items.Add(apps);
        menu.Items.Add("While File is Downloading", null, (_, _) => _sessions.Start(new Session { Kind = SessionKind.WhileDownloading }));

        menu.Items.Add(new ToolStripSeparator());
        var quick = new ToolStripMenuItem("Quick Settings");
        quick.DropDownItems.Add(Check("Allow display sleep", s?.AllowDisplaySleep ?? _settings.AllowDisplaySleep, _ => _sessions.ToggleDisplaySleep()));
        quick.DropDownItems.Add(Check("Keep awake with lid closed", _settings.PreventSleepWhenLidClosed, v =>
        {
            _settings.PreventSleepWhenLidClosed = v;
            if (_sessions.Current == null) return;
            if (v) LidControl.Override(); else LidControl.Restore();
        }));
        quick.DropDownItems.Add(Check($"Move cursor after {_settings.MoveCursorAfterMinutes} min of inactivity", _settings.MoveCursorWhenIdle, v => _settings.MoveCursorWhenIdle = v));
        quick.DropDownItems.Add(Check($"Lock screen after {_settings.LockScreenAfterMinutes} min of inactivity", _settings.LockScreenWhenIdle, v => _settings.LockScreenWhenIdle = v));
        quick.DropDownItems.Add(Check($"End session if battery is below {_settings.LowBatteryPercent}%", _settings.EndSessionOnLowBattery, v => _settings.EndSessionOnLowBattery = v));
        quick.DropDownItems.Add(Check("End session if not connected to power", _settings.EndSessionIfUnplugged, v => _settings.EndSessionIfUnplugged = v));
        quick.DropDownItems.Add(Check("Drive Alive", _settings.DriveAliveEnabled, v => _settings.DriveAliveEnabled = v));
        menu.Items.Add(quick);

        var triggerText = !_settings.TriggersEnabled ? "Triggers (off)" : _triggers.Paused ? "Triggers (paused)" : "Triggers";
        menu.Items.Add(Check(triggerText, _settings.TriggersEnabled, v => _settings.TriggersEnabled = v));

        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Settings...", null, (_, _) => ShowSettings());
        menu.Items.Add("Quit WakeKeeper", null, (_, _) => ExitThread());
    }

    private ToolStripMenuItem Check(string text, bool value, Action<bool> set)
    {
        var item = new ToolStripMenuItem(text) { Checked = value, CheckOnClick = true };
        item.CheckedChanged += (_, _) => { set(item.Checked); _settings.Save(); };
        return item;
    }

    private void StartFor(int minutes) =>
        _sessions.Start(new Session { Kind = SessionKind.Duration, Ends = DateTime.Now.AddMinutes(minutes) });

    private void PromptUntil()
    {
        using var form = new Form
        {
            Text = "Keep awake until", FormBorderStyle = FormBorderStyle.FixedDialog, StartPosition = FormStartPosition.CenterScreen,
            MinimizeBox = false, MaximizeBox = false, AutoSize = true, AutoSizeMode = AutoSizeMode.GrowAndShrink, Padding = new Padding(12),
        };
        var picker = new DateTimePicker
        {
            Format = DateTimePickerFormat.Custom, CustomFormat = "ddd d MMM  HH:mm", Value = DateTime.Now.AddHours(1), Width = 200,
        };
        var ok = new Button { Text = "Start", DialogResult = DialogResult.OK };
        var layout = new FlowLayoutPanel { AutoSize = true, Dock = DockStyle.Fill };
        layout.Controls.AddRange(new Control[] { picker, ok });
        form.Controls.Add(layout);
        form.AcceptButton = ok;
        if (form.ShowDialog() != DialogResult.OK) return;
        if (picker.Value <= DateTime.Now)
        {
            MessageBox.Show("Choose a time in the future.", "WakeKeeper");
            return;
        }
        _sessions.Start(new Session { Kind = SessionKind.Until, Ends = picker.Value });
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
            var color = active ? Color.FromArgb(255, 196, 120, 40) : Color.Gray;
            using var pen = new Pen(color, 3);
            using var brush = new SolidBrush(color);
            var cup = new Rectangle(4, 10, 18, 16);
            if (active) g.FillRectangle(brush, cup); else g.DrawRectangle(pen, cup);
            g.DrawArc(pen, 18, 13, 10, 9, -90, 180);
            if (active)
            {
                g.DrawBezier(pen, 9, 8, 7, 5, 11, 4, 9, 1);
                g.DrawBezier(pen, 16, 8, 14, 5, 18, 4, 16, 1);
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

    public static void Apply(bool enabled)
    {
        using var key = Registry.CurrentUser.OpenSubKey(RunKey, writable: true);
        if (key == null) return;
        if (enabled) key.SetValue("WakeKeeper", $"\"{Environment.ProcessPath}\"");
        else key.DeleteValue("WakeKeeper", throwOnMissingValue: false);
    }
}
