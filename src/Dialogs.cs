using System.Diagnostics;
using System.Reflection;

namespace WakeKeeper;

/// <summary>Where the Feedback &amp; Support menu points.</summary>
internal static class Links
{
    public const string Repo = "https://github.com/SurajsinghBayas/wakekeeper";
    public const string Help = Repo + "#troubleshooting";
    public const string Contact = Repo + "/issues/new";
    public const string Star = Repo + "/stargazers";
    public const string Contribute = Repo + "#building";

    public static void Open(string url)
    {
        try { Process.Start(new ProcessStartInfo(url) { UseShellExecute = true }); }
        catch (Exception ex) { Log.Write($"Could not open {url}: {ex.Message}"); }
    }

    public static string Version
    {
        get
        {
            var v = Assembly.GetExecutingAssembly().GetName().Version;
            return v == null ? "" : $"{v.Major}.{v.Minor}.{v.Build}";
        }
    }
}

/// <summary>"Other Time/Until": keep awake for a number of hours and minutes, or until a clock time.</summary>
internal sealed class TimeDialog : Form
{
    private readonly RadioButton _for = Segment("For"), _until = Segment("Until");
    private readonly NumericUpDown _hours = new() { Minimum = 0, Maximum = 999, Width = 70, TextAlign = HorizontalAlignment.Center };
    private readonly NumericUpDown _minutes = new() { Minimum = 0, Maximum = 59, Width = 70, TextAlign = HorizontalAlignment.Center };
    private readonly DateTimePicker _time = new()
    {
        Format = DateTimePickerFormat.Custom, CustomFormat = "ddd d MMM  HH:mm", ShowUpDown = true, Width = 180,
        Value = DateTime.Now.AddHours(1),
    };
    private readonly Panel _forPanel, _untilPanel;

    /// <summary>When the session should end, or null if the dialog was cancelled.</summary>
    public DateTime? Ends { get; private set; }
    public bool IsDuration => _for.Checked;

    public TimeDialog()
    {
        Text = "Other Time/Until";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterScreen;
        MinimizeBox = MaximizeBox = false;
        ShowInTaskbar = true;
        TopMost = true;
        Font = SystemFonts.MessageBoxFont;
        AutoSize = true;
        AutoSizeMode = AutoSizeMode.GrowAndShrink;
        Padding = new Padding(16);

        var segments = new FlowLayoutPanel { AutoSize = true, Anchor = AnchorStyles.None, Margin = new Padding(0, 0, 0, 12) };
        segments.Controls.AddRange(new Control[] { _for, _until });

        _forPanel = Stack(Field(_hours, "hours"), Field(_minutes, "minutes"));
        _untilPanel = Stack(Field(_time, "end time"));
        _hours.Value = 1;

        var ok = new Button { Text = "Continue", AutoSize = true, Anchor = AnchorStyles.None, Margin = new Padding(0, 12, 0, 0) };
        ok.Click += (_, _) => Submit();
        AcceptButton = ok;

        var root = new TableLayoutPanel { AutoSize = true, ColumnCount = 1, Dock = DockStyle.Fill };
        root.Controls.Add(segments);
        root.Controls.Add(_forPanel);
        root.Controls.Add(_untilPanel);
        root.Controls.Add(ok);
        Controls.Add(root);

        _for.CheckedChanged += (_, _) => Sync();
        _for.Checked = true;
        Sync();
    }

    private static RadioButton Segment(string text) => new()
    {
        Text = text, Appearance = Appearance.Button, AutoSize = false, Width = 80, Height = 28,
        TextAlign = ContentAlignment.MiddleCenter, FlatStyle = FlatStyle.System, Margin = new Padding(0),
    };

    private static Control Field(Control input, string caption)
    {
        var label = new Label { Text = caption, AutoSize = true, Anchor = AnchorStyles.None, Font = new Font(SystemFonts.MessageBoxFont!, FontStyle.Bold) };
        input.Anchor = AnchorStyles.None;
        var t = new TableLayoutPanel { AutoSize = true, ColumnCount = 1, Anchor = AnchorStyles.None, Margin = new Padding(0, 4, 0, 4) };
        t.Controls.Add(input);
        t.Controls.Add(label);
        return t;
    }

    private static Panel Stack(params Control[] fields)
    {
        var p = new FlowLayoutPanel { AutoSize = true, FlowDirection = FlowDirection.TopDown, Anchor = AnchorStyles.None, WrapContents = false };
        p.Controls.AddRange(fields);
        return p;
    }

    private void Sync()
    {
        _forPanel.Visible = _for.Checked;
        _untilPanel.Visible = _until.Checked;
        (_for.Checked ? (Control)_hours : _time).Select();
    }

    private void Submit()
    {
        DateTime ends;
        if (_for.Checked)
        {
            var span = TimeSpan.FromHours((double)_hours.Value) + TimeSpan.FromMinutes((double)_minutes.Value);
            if (span <= TimeSpan.Zero) { MessageBox.Show(this, "Enter at least one minute.", "WakeKeeper"); return; }
            ends = DateTime.Now + span;
        }
        else
        {
            ends = _time.Value;
            // A time earlier than now means that time tomorrow, like an alarm clock.
            if (ends <= DateTime.Now) ends = DateTime.Today.AddDays(1) + _time.Value.TimeOfDay;
        }
        Ends = ends;
        DialogResult = DialogResult.OK;
    }
}

/// <summary>About WakeKeeper: version, lifetime statistics and links.</summary>
internal sealed class AboutDialog : Form
{
    public AboutDialog(Settings settings)
    {
        Text = "About WakeKeeper";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterScreen;
        MinimizeBox = MaximizeBox = false;
        TopMost = true;
        Font = SystemFonts.MessageBoxFont;
        AutoSize = true;
        AutoSizeMode = AutoSizeMode.GrowAndShrink;
        Padding = new Padding(24, 20, 24, 16);

        var root = new TableLayoutPanel { AutoSize = true, ColumnCount = 1, Dock = DockStyle.Fill };
        Control Centered(Control c) { c.Anchor = AnchorStyles.None; c.Margin = new Padding(0, 3, 0, 3); root.Controls.Add(c); return c; }

        var appIcon = Environment.ProcessPath is { } path ? Icon.ExtractAssociatedIcon(path) : null;
        if (appIcon != null)
            Centered(new PictureBox { Image = new Icon(appIcon, 64, 64).ToBitmap(), SizeMode = PictureBoxSizeMode.Zoom, Size = new Size(64, 64) });
        Centered(new Label { Text = "WakeKeeper", AutoSize = true, Font = new Font(Font.FontFamily, 14, FontStyle.Bold) });
        Centered(new Label { Text = $"Version {Links.Version}", AutoSize = true, ForeColor = SystemColors.GrayText });
        Centered(new Label
        {
            Text = "Keeps your PC awake while agents, builds, downloads and backups run.",
            AutoSize = true, MaximumSize = new Size(300, 0), TextAlign = ContentAlignment.MiddleCenter, Margin = new Padding(0, 10, 0, 10),
        });
        Centered(new Label
        {
            Text = $"{settings.TotalSessions:N0} sessions · {settings.TotalAwakeHours:N1} hours kept awake",
            AutoSize = true, ForeColor = SystemColors.GrayText,
        });

        var links = new FlowLayoutPanel { AutoSize = true };
        links.Controls.Add(Link("Website & source", Links.Repo));
        links.Controls.Add(Link("Report an issue", Links.Contact));
        Centered(links).Margin = new Padding(0, 10, 0, 6);

        var ok = new Button { Text = "OK", DialogResult = DialogResult.OK, AutoSize = true };
        Centered(ok);
        AcceptButton = CancelButton = ok;
        Controls.Add(root);
    }

    private static LinkLabel Link(string text, string url)
    {
        var l = new LinkLabel { Text = text, AutoSize = true };
        l.LinkClicked += (_, _) => Links.Open(url);
        return l;
    }
}
