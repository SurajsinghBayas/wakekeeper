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
        Size = new Size(560, 520);
        MinimumSize = new Size(480, 420);
        StartPosition = FormStartPosition.CenterScreen;
        Font = SystemFonts.MessageBoxFont;

        var tabs = new TabControl { Dock = DockStyle.Fill };
        tabs.TabPages.Add(Page("General",
            CheckBox("Launch WakeKeeper at login", _s.LaunchAtLogin, v => _s.LaunchAtLogin = v),
            CheckBox("Start session when WakeKeeper launches", _s.StartSessionAtLaunch, v => _s.StartSessionAtLaunch = v),
            CheckBox("Start session after waking from sleep", _s.StartSessionAfterWake, v => _s.StartSessionAfterWake = v),
            CheckBox("Debug mode (writes debug.log to the settings folder)", Log.Enabled, v => Log.Enabled = v)));

        tabs.TabPages.Add(Page("Session Defaults",
            Number("Default duration (minutes, 0 = indefinite):", _s.DefaultDurationMinutes, 0, 10080, v => _s.DefaultDurationMinutes = v),
            CheckBox("Allow display sleep", _s.AllowDisplaySleep, v => _s.AllowDisplaySleep = v),
            Number("Allow screen saver / display off after (minutes, 0 = never):", _s.AllowScreenSaverAfterMinutes, 0, 1440, v => _s.AllowScreenSaverAfterMinutes = v),
            CheckBox("Keep awake when laptop lid is closed (changes the power plan's lid action during sessions)", _s.PreventSleepWhenLidClosed, v => _s.PreventSleepWhenLidClosed = v),
            CheckBox("End session if battery charge is below:", _s.EndSessionOnLowBattery, v => _s.EndSessionOnLowBattery = v),
            Number("    Battery threshold (%):", _s.LowBatteryPercent, 1, 99, v => _s.LowBatteryPercent = v),
            CheckBox("    Ignore battery level when plugged in", _s.IgnoreBatteryIfPluggedIn, v => _s.IgnoreBatteryIfPluggedIn = v),
            CheckBox("End session if power adapter is disconnected", _s.EndSessionIfUnplugged, v => _s.EndSessionIfUnplugged = v),
            CheckBox("    Start a new session if reconnected", _s.RestartSessionIfReplugged, v => _s.RestartSessionIfReplugged = v),
            CheckBox("End session when the PC is put to sleep", _s.EndSessionOnForcedSleep, v => _s.EndSessionOnForcedSleep = v)));

        tabs.TabPages.Add(Page("System Control",
            CheckBox("Move cursor when idle", _s.MoveCursorWhenIdle, v => _s.MoveCursorWhenIdle = v),
            Number("    after (minutes of inactivity):", _s.MoveCursorAfterMinutes, 1, 120, v => _s.MoveCursorAfterMinutes = v),
            CheckBox("Lock screen when idle", _s.LockScreenWhenIdle, v => _s.LockScreenWhenIdle = v),
            Number("    after (minutes of inactivity):", _s.LockScreenAfterMinutes, 1, 240, v => _s.LockScreenAfterMinutes = v)));

        tabs.TabPages.Add(Page("Notifications",
            CheckBox("Notify when a session starts or ends", _s.NotifyOnStartEnd, v => _s.NotifyOnStartEnd = v),
            CheckBox("Notify when a Trigger starts a session", _s.NotifyOnTriggerStart, v => _s.NotifyOnTriggerStart = v),
            Number("Remind me every (minutes, 0 = off):", _s.ReminderEveryMinutes, 0, 1440, v => _s.ReminderEveryMinutes = v)));

        tabs.TabPages.Add(TriggersPage());
        tabs.TabPages.Add(DriveAlivePage());
        tabs.TabPages.Add(Page("Hot Keys",
            HotkeyBox("Start / end session:", _s.StartEndHotkey, k => _s.StartEndHotkey = k),
            HotkeyBox("Toggle allow display sleep:", _s.ToggleDisplaySleepHotkey, k => _s.ToggleDisplaySleepHotkey = k),
            new Label { Text = "Click a box and press a key combination. Backspace clears it.", AutoSize = true, ForeColor = SystemColors.GrayText }));
        tabs.TabPages.Add(Page("Statistics",
            new Label { Text = $"Sessions started: {_s.TotalSessions}", AutoSize = true },
            new Label { Text = $"Time kept awake: {_s.TotalAwakeHours:0.0} hours", AutoSize = true }));

        Controls.Add(tabs);
    }

    private static TabPage Page(string title, params Control[] controls)
    {
        var flow = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill, FlowDirection = FlowDirection.TopDown, WrapContents = false, AutoScroll = true, Padding = new Padding(10),
        };
        foreach (var c in controls) { c.Margin = new Padding(3, 4, 3, 4); flow.Controls.Add(c); }
        var page = new TabPage(title);
        page.Controls.Add(flow);
        return page;
    }

    private static CheckBox CheckBox(string text, bool value, Action<bool> set)
    {
        var cb = new CheckBox { Text = text, Checked = value, AutoSize = true, MaximumSize = new Size(500, 0) };
        cb.CheckedChanged += (_, _) => set(cb.Checked);
        return cb;
    }

    private static Control Number(string label, int value, int min, int max, Action<int> set)
    {
        var num = new NumericUpDown { Minimum = min, Maximum = max, Value = Math.Clamp(value, min, max), Width = 70 };
        num.ValueChanged += (_, _) => set((int)num.Value);
        return Row(new Label { Text = label, AutoSize = true, Anchor = AnchorStyles.Left }, num);
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

        return Page("Triggers",
            CheckBox("Enable Triggers", _s.TriggersEnabled, v => _s.TriggersEnabled = v),
            new Label { Text = "A Trigger starts a session automatically while all of its criteria are true.", AutoSize = true, MaximumSize = new Size(500, 0) },
            list,
            Row(add, edit, remove));
    }

    private TabPage DriveAlivePage()
    {
        var list = new CheckedListBox { Width = 500, Height = 200, CheckOnClick = true };
        foreach (var d in DriveAlive.CandidateDrives())
        {
            string label = $"{d.Name} {d.VolumeLabel} ({d.DriveType})";
            list.Items.Add(label, _s.DriveAliveDrives.Contains(d.Name, StringComparer.OrdinalIgnoreCase));
        }
        list.ItemCheck += (_, e) =>
        {
            var root = list.Items[e.Index].ToString()!.Split(' ')[0];
            _s.DriveAliveDrives.RemoveAll(r => string.Equals(SystemProbe.NormalizeRoot(r), root, StringComparison.OrdinalIgnoreCase));
            if (e.NewValue == CheckState.Checked) _s.DriveAliveDrives.Add(root);
        };

        return Page("Drive Alive",
            CheckBox("Keep selected drives awake", _s.DriveAliveEnabled, v => _s.DriveAliveEnabled = v),
            CheckBox("Only while a session is active", _s.DriveAliveOnlyDuringSession, v => _s.DriveAliveOnlyDuringSession = v),
            Number("Write to drives every (seconds):", _s.DriveAliveIntervalSeconds, 10, 3600, v => _s.DriveAliveIntervalSeconds = v),
            list);
    }
}

/// <summary>Dialog for creating or editing one Trigger and its criteria.</summary>
internal sealed class TriggerEditor : Form
{
    public TriggerEditor(Trigger trigger)
    {
        Text = "Trigger";
        Size = new Size(520, 480);
        StartPosition = FormStartPosition.CenterParent;
        Font = SystemFonts.MessageBoxFont;
        var working = trigger.Criteria.ToList();

        var name = new TextBox { Text = trigger.Name, Width = 300 };
        var enabled = new CheckBox { Text = "Enabled", Checked = trigger.Enabled, AutoSize = true };
        var displaySleep = new CheckBox { Text = "Allow display to sleep", Checked = trigger.AllowDisplaySleep, AutoSize = true };
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

        var addCrit = new Button { Text = "Add criterion", AutoSize = true };
        addCrit.Click += (_, _) =>
        {
            working.Add(new Criterion
            {
                Kind = Enum.Parse<CriterionKind>(kind.Text), Text = text.Text.Trim(), Number = (int)number.Value,
                From = TimeOnly.FromDateTime(from.Value), To = TimeOnly.FromDateTime(to.Value),
            });
            Reload();
        };
        var removeCrit = new Button { Text = "Remove criterion", AutoSize = true };
        removeCrit.Click += (_, _) => { if (criteria.SelectedItem is Criterion c) { working.Remove(c); Reload(); } };

        var ok = new Button { Text = "OK", DialogResult = DialogResult.OK };
        ok.Click += (_, _) =>
        {
            trigger.Name = string.IsNullOrWhiteSpace(name.Text) ? "Trigger" : name.Text.Trim();
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
        flow.Controls.Add(new Label { Text = "All criteria must be true:", AutoSize = true });
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
