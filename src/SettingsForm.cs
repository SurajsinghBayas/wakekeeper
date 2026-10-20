namespace WakeKeeper;

/// <summary>Preferences window. Controls write straight into the shared <see cref="Settings"/>
/// instance; the tray app saves and re-applies them when the window closes.</summary>
public sealed class SettingsForm : Form
{
    private readonly Settings _s;

    public SettingsForm(Settings settings)
    {
        _s = settings;
        Text = "WakeKeeper Settings";
        AutoScaleMode = AutoScaleMode.Dpi;
        AutoScaleDimensions = new SizeF(96, 96);
        Size = new Size(600, 560);
        MinimumSize = new Size(520, 460);
        StartPosition = FormStartPosition.CenterScreen;
        Font = new Font("Segoe UI", 9.75f);
        if (Environment.ProcessPath is { } path) Icon = Icon.ExtractAssociatedIcon(path);

        var tabs = new TabControl { Dock = DockStyle.Fill, Padding = new Point(12, 5) };
        var openLog = new LinkLabel { Text = "Open diagnostic log", AutoSize = true, Enabled = File.Exists(Log.FilePath) };
        openLog.LinkClicked += (_, _) => Links.Open(Log.FilePath);
        tabs.TabPages.Add(Page("General",
            Heading("Startup"),
            CheckBox("Start WakeKeeper when I sign in to Windows", _s.LaunchAtLogin, v => _s.LaunchAtLogin = v),
            CheckBox("Keep the PC awake as soon as WakeKeeper starts", _s.StartSessionAtLaunch, v => _s.StartSessionAtLaunch = v),
            CheckBox("Keep it awake again after the PC wakes from sleep", _s.StartSessionAfterWake, v => _s.StartSessionAfterWake = v),
            Heading("Notifications"),
            CheckBox("Tell me when keeping awake starts or stops", _s.NotifyOnStartEnd, v => _s.NotifyOnStartEnd = v),
            CheckBox("Tell me when an auto-start rule starts", _s.NotifyOnTriggerStart, v => _s.NotifyOnTriggerStart = v),
            Number("Remind me it's still on every (minutes, 0 = never):", _s.ReminderEveryMinutes, 0, 1440, v => _s.ReminderEveryMinutes = v),
            CheckBox("Show the time left on the taskbar icon", _s.ShowTimeRemainingInTray, v => _s.ShowTimeRemainingInTray = v),
            Heading("Troubleshooting"),
            CheckBox("Diagnostic logging", _s.DebugMode, v => _s.DebugMode = Log.Enabled = v),
            openLog,
            new Label
            {
                Text = $"{_s.TotalSessions:N0} sessions so far · {_s.TotalAwakeHours:N1} hours kept awake",
                AutoSize = true, ForeColor = SystemColors.GrayText, Margin = new Padding(3, 14, 3, 3),
            }));

        tabs.TabPages.Add(Page("Sessions",
            Heading("Defaults"),
            Number("Default length (minutes, 0 = until I stop it):", _s.DefaultDurationMinutes, 0, 10080, v => _s.DefaultDurationMinutes = v),
            CheckBox("Let the screen turn off", _s.AllowDisplaySleep, v => _s.AllowDisplaySleep = v),
            CheckBox("Allow screen saver when I'm idle", _s.AllowScreenSaver, v => _s.AllowScreenSaver = v),
            Number("    after (minutes of inactivity):", _s.AllowScreenSaverAfterMinutes, 1, 1440, v => _s.AllowScreenSaverAfterMinutes = v),
            CheckBox("Keep running with the lid closed (changes the lid action only during sessions)", _s.PreventSleepWhenLidClosed, v => _s.PreventSleepWhenLidClosed = v),
            Heading("Battery and power"),
            CheckBox("End session if battery charge is below:", _s.EndSessionOnLowBattery, v => _s.EndSessionOnLowBattery = v),
            Number("    Battery threshold (%):", _s.LowBatteryPercent, 1, 99, v => _s.LowBatteryPercent = v),
            CheckBox("    Ignore battery level when plugged in", _s.IgnoreBatteryIfPluggedIn, v => _s.IgnoreBatteryIfPluggedIn = v),
            CheckBox("End session if power adapter is disconnected", _s.EndSessionIfUnplugged, v => _s.EndSessionIfUnplugged = v),
            CheckBox("    Start a new session if reconnected", _s.RestartSessionIfReplugged, v => _s.RestartSessionIfReplugged = v),
            CheckBox("End session when the PC is put to sleep", _s.EndSessionOnForcedSleep, v => _s.EndSessionOnForcedSleep = v)));

        tabs.TabPages.Add(Page("When idle",
            CheckBox("Nudge the mouse when idle (stay Available in chat apps)", _s.MoveCursorWhenIdle, v => _s.MoveCursorWhenIdle = v),
            Number("    after (minutes of inactivity):", _s.MoveCursorAfterMinutes, 1, 120, v => _s.MoveCursorAfterMinutes = v),
            CheckBox("Lock the PC when idle", _s.LockScreenWhenIdle, v => _s.LockScreenWhenIdle = v),
            Number("    after (minutes of inactivity):", _s.LockScreenAfterMinutes, 1, 240, v => _s.LockScreenAfterMinutes = v)));

        tabs.TabPages.Add(TriggersPage());
        tabs.TabPages.Add(DrivesPage());
        tabs.TabPages.Add(Page("Hot keys",
            HotkeyBox("Start / end session:", _s.StartEndHotkey, k => _s.StartEndHotkey = k),
            HotkeyBox("Toggle screen can turn off:", _s.ToggleDisplaySleepHotkey, k => _s.ToggleDisplaySleepHotkey = k),
            new Label { Text = "Click a box and press a key combination. Backspace clears it.", AutoSize = true, ForeColor = SystemColors.GrayText }));
        Controls.Add(tabs);
    }

    private static TabPage Page(string title, params Control[] controls)
    {
        var flow = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill, FlowDirection = FlowDirection.TopDown, WrapContents = false, AutoScroll = true, Padding = new Padding(10),
        };
        foreach (var c in controls) { if (c.Margin == new Padding(3)) c.Margin = new Padding(3, 4, 3, 4); flow.Controls.Add(c); }
        var page = new TabPage(title);
        page.Controls.Add(flow);
        return page;
    }

    private static Label Heading(string text) => new()
    {
        Text = text, AutoSize = true, Font = new Font("Segoe UI Semibold", 10f), Margin = new Padding(3, 10, 3, 2),
    };

    /// <summary>Leading spaces in a label mark a sub-option; they become an indent instead of a gap.</summary>
    private static Padding Indent(ref string text)
    {
        bool sub = text.StartsWith(' ');
        text = text.TrimStart();
        return sub ? new Padding(26, 2, 3, 4) : new Padding(3);
    }

    private static CheckBox CheckBox(string text, bool value, Action<bool> set)
    {
        var margin = Indent(ref text);
        var cb = new CheckBox { Text = text, Checked = value, AutoSize = true, MaximumSize = new Size(540, 0), Margin = margin };
        cb.CheckedChanged += (_, _) => set(cb.Checked);
        return cb;
    }

    private static Control Number(string label, int value, int min, int max, Action<int> set)
    {
        var num = new NumericUpDown { Minimum = min, Maximum = max, Value = Math.Clamp(value, min, max), Width = 70 };
        num.ValueChanged += (_, _) => set((int)num.Value);
        var margin = Indent(ref label);
        var row = Row(new Label { Text = label, AutoSize = true, Anchor = AnchorStyles.Left }, num);
        row.Margin = margin;
        return row;
    }

    private static Control HotkeyBox(string label, Hotkey initial, Action<Hotkey> set)
    {
        var box = new TextBox { ReadOnly = true, Width = 160, Text = initial.ToString() };
        box.KeyDown += (_, e) =>
        {
            e.SuppressKeyPress = true;
            if (e.KeyCode == Keys.Back) { set(new Hotkey()); box.Text = "None"; return; }
            if (e.KeyCode is Keys.ControlKey or Keys.ShiftKey or Keys.Menu or Keys.LWin or Keys.RWin) return;
            uint mods = (e.Control ? Native.MOD_CONTROL : 0) | (e.Alt ? Native.MOD_ALT : 0) | (e.Shift ? Native.MOD_SHIFT : 0);
            if (mods == 0) return; // require a modifier so normal typing isn't hijacked
            var key = new Hotkey { Modifiers = mods, Key = e.KeyCode };
            set(key);
            box.Text = key.ToString();
        };
        return Row(new Label { Text = label, AutoSize = true, Width = 180, Anchor = AnchorStyles.Left }, box);
    }

    private static FlowLayoutPanel Row(params Control[] controls)
    {
        var row = new FlowLayoutPanel { AutoSize = true, WrapContents = false, Margin = Padding.Empty };
        row.Controls.AddRange(controls);
        return row;
    }

    private TabPage TriggersPage()
    {
        var list = new ListBox { Width = 500, Height = 260, DisplayMember = nameof(Trigger.Name) };
        void Reload() { list.Items.Clear(); foreach (var t in _s.Triggers) list.Items.Add(t); }
        Reload();

        var add = new Button { Text = "Add...", AutoSize = true };
        add.Click += (_, _) =>
        {
            var t = new Trigger();
            if (new TriggerEditor(t).ShowDialog(this) == DialogResult.OK) { _s.Triggers.Add(t); Reload(); }
        };
        var edit = new Button { Text = "Edit...", AutoSize = true };
        edit.Click += (_, _) => { if (list.SelectedItem is Trigger t) { new TriggerEditor(t).ShowDialog(this); Reload(); } };
        list.DoubleClick += (_, _) => edit.PerformClick();
        var remove = new Button { Text = "Remove", AutoSize = true };
        remove.Click += (_, _) => { if (list.SelectedItem is Trigger t) { _s.Triggers.Remove(t); Reload(); } };

        return Page("Auto-start",
            CheckBox("Enable auto-start rules", _s.TriggersEnabled, v => _s.TriggersEnabled = v),
            new Label { Text = "A rule starts a session automatically while all of its conditions are true.", AutoSize = true, MaximumSize = new Size(500, 0) },
            list,
            Row(add, edit, remove));
    }

    private TabPage DrivesPage()
    {
        var list = new CheckedListBox { Width = 500, Height = 200, CheckOnClick = true };
        foreach (var d in DriveSpinner.CandidateDrives())
        {
            string label = $"{d.Name} {d.VolumeLabel} ({d.DriveType})";
            list.Items.Add(label, _s.SpinDrives.Contains(d.Name, StringComparer.OrdinalIgnoreCase));
        }
        list.ItemCheck += (_, e) =>
        {
            var root = list.Items[e.Index].ToString()!.Split(' ')[0];
            _s.SpinDrives.RemoveAll(r => string.Equals(SystemProbe.NormalizeRoot(r), root, StringComparison.OrdinalIgnoreCase));
            if (e.NewValue == CheckState.Checked) _s.SpinDrives.Add(root);
        };

        return Page("Drives",
            CheckBox("Keep selected drives spinning", _s.SpinDrivesEnabled, v => _s.SpinDrivesEnabled = v),
            CheckBox("Only while a session is active", _s.SpinOnlyDuringSession, v => _s.SpinOnlyDuringSession = v),
            Number("Write to drives every (seconds):", _s.SpinIntervalSeconds, 10, 3600, v => _s.SpinIntervalSeconds = v),
            list);
    }
}

/// <summary>Dialog for creating or editing one Trigger and its criteria.</summary>
internal sealed class TriggerEditor : Form
{
    public TriggerEditor(Trigger trigger)
    {
        Text = "Auto-start rule";
        Size = new Size(520, 480);
        StartPosition = FormStartPosition.CenterParent;
        Font = SystemFonts.MessageBoxFont;
        var working = trigger.Criteria.ToList();

        var name = new TextBox { Text = trigger.Name, Width = 300 };
        var enabled = new CheckBox { Text = "Enabled", Checked = trigger.Enabled, AutoSize = true };
        var displaySleep = new CheckBox { Text = "Let the screen turn off", Checked = trigger.AllowDisplaySleep, AutoSize = true };
        var criteria = new ListBox { Width = 470, Height = 150 };
        void Reload() { criteria.Items.Clear(); foreach (var c in working) criteria.Items.Add(c); }
        Reload();

        var kind = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Width = 150 };
        kind.Items.AddRange(Enum.GetNames<CriterionKind>());
        kind.SelectedIndex = 0;
        var text = new TextBox { Width = 140, PlaceholderText = "app / SSID / drive" };
        var number = new NumericUpDown { Width = 60, Maximum = 100 };
        var from = new DateTimePicker { Format = DateTimePickerFormat.Custom, CustomFormat = "HH:mm", ShowUpDown = true, Width = 70, Value = DateTime.Today.AddHours(9) };
        var to = new DateTimePicker { Format = DateTimePickerFormat.Custom, CustomFormat = "HH:mm", ShowUpDown = true, Width = 70, Value = DateTime.Today.AddHours(17) };
        var hint = new Label { AutoSize = true, ForeColor = SystemColors.GrayText, MaximumSize = new Size(470, 0) };
        kind.SelectedIndexChanged += (_, _) => hint.Text = Enum.Parse<CriterionKind>(kind.Text) switch
        {
            CriterionKind.AppRunning => "Text: process name (e.g. vlc). Number 1 = only when frontmost.",
            CriterionKind.BatteryAbove => "Number: minimum battery %.",
            CriterionKind.WifiNetwork => "Text: network name (SSID). Requires Location access on Windows 11.",
            CriterionKind.Schedule => "Uses From/To times, every day.",
            CriterionKind.IdleTimeBelow => "Number: minutes of keyboard/mouse inactivity.",
            CriterionKind.CpuAbove => "Number: CPU %.",
            CriterionKind.DrivePresent => "Text: drive letter (e.g. E).",
            _ => "",
        };
        kind.SelectedIndex = 0;

        var addCrit = new Button { Text = "Add condition", AutoSize = true };
        addCrit.Click += (_, _) =>
        {
            working.Add(new Criterion
            {
                Kind = Enum.Parse<CriterionKind>(kind.Text), Text = text.Text.Trim(), Number = (int)number.Value,
                From = TimeOnly.FromDateTime(from.Value), To = TimeOnly.FromDateTime(to.Value),
            });
            Reload();
        };
        var removeCrit = new Button { Text = "Remove condition", AutoSize = true };
        removeCrit.Click += (_, _) => { if (criteria.SelectedItem is Criterion c) { working.Remove(c); Reload(); } };

        var ok = new Button { Text = "OK", DialogResult = DialogResult.OK };
        ok.Click += (_, _) =>
        {
            trigger.Name = string.IsNullOrWhiteSpace(name.Text) ? "Rule" : name.Text.Trim();
            trigger.Enabled = enabled.Checked;
            trigger.AllowDisplaySleep = displaySleep.Checked;
            trigger.Criteria = working;
        };
        var cancel = new Button { Text = "Cancel", DialogResult = DialogResult.Cancel };
        AcceptButton = ok;
        CancelButton = cancel;

        var flow = new FlowLayoutPanel { Dock = DockStyle.Fill, FlowDirection = FlowDirection.TopDown, WrapContents = false, Padding = new Padding(10), AutoScroll = true };
        flow.Controls.Add(Row(new Label { Text = "Name:", AutoSize = true }, name));
        flow.Controls.Add(Row(enabled, displaySleep));
        flow.Controls.Add(new Label { Text = "All conditions must be true:", AutoSize = true });
        flow.Controls.Add(criteria);
        flow.Controls.Add(Row(kind, text, number));
        flow.Controls.Add(Row(new Label { Text = "From", AutoSize = true }, from, new Label { Text = "To", AutoSize = true }, to, addCrit, removeCrit));
        flow.Controls.Add(hint);
        flow.Controls.Add(Row(ok, cancel));
        Controls.Add(flow);
    }

    private static FlowLayoutPanel Row(params Control[] controls)
    {
        var row = new FlowLayoutPanel { AutoSize = true, WrapContents = false };
        row.Controls.AddRange(controls);
        return row;
    }
}
