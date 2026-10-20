using System.Drawing.Drawing2D;

namespace WakeKeeper;

/// <summary>The window people see when they open WakeKeeper: current status, one big start/stop button,
/// common durations and the two options most people need. Closing it hides it; the app stays in the tray.</summary>
internal sealed class MainWindow : Form
{
    private static readonly Color Ink = Color.FromArgb(15, 23, 42), Muted = Color.FromArgb(100, 116, 139),
        Line = Color.FromArgb(226, 232, 240), Sky = Color.FromArgb(2, 132, 199), SkySoft = Color.FromArgb(224, 242, 254),
        Silver = Color.FromArgb(248, 250, 252);

    private readonly TrayApp _app;
    private readonly Settings _settings;
    private readonly SessionManager _sessions;
    private readonly Label _status, _detail;
    private readonly Panel _statusCard;
    private readonly Button _primary;
    private readonly CheckBox _lid, _screen, _startup;
    private readonly ToolTip _tips = new();

    public MainWindow(TrayApp app, Settings settings, SessionManager sessions)
    {
        _app = app;
        _settings = settings;
        _sessions = sessions;

        Text = "WakeKeeper";
        AutoScaleMode = AutoScaleMode.Dpi;
        AutoScaleDimensions = new SizeF(96, 96);
        FormBorderStyle = FormBorderStyle.FixedSingle;
        MaximizeBox = false;
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Color.White;
        ForeColor = Ink;
        Font = new Font("Segoe UI", 10f);
        ClientSize = new Size(440, 600);
        if (Environment.ProcessPath is { } path) Icon = Icon.ExtractAssociatedIcon(path);

        var root = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill, FlowDirection = FlowDirection.TopDown, WrapContents = false,
            Padding = new Padding(24, 20, 24, 16), AutoScroll = true,
        };
        const int W = 392;

        // Header
        var header = new FlowLayoutPanel { AutoSize = true, WrapContents = false, Margin = new Padding(0, 0, 0, 14) };
        header.Controls.Add(new PictureBox
        {
            Image = TrayApp.AppTile(32), Size = new Size(32, 32), SizeMode = PictureBoxSizeMode.Zoom, Margin = new Padding(0, 2, 10, 0),
        });
        header.Controls.Add(new Label { Text = "WakeKeeper", AutoSize = true, Font = new Font("Segoe UI Semibold", 15f), Margin = new Padding(0, 1, 0, 0) });
        root.Controls.Add(header);

        // Status card
        _statusCard = new Panel { Size = new Size(W, 76), Margin = new Padding(0, 0, 0, 12), BackColor = Silver };
        _statusCard.Paint += (_, e) => PaintCard(e.Graphics, _statusCard.ClientRectangle, _sessions.Current != null);
        _status = new Label { AutoSize = false, Location = new Point(42, 12), Size = new Size(W - 56, 26), Font = new Font("Segoe UI Semibold", 12f), BackColor = Color.Transparent };
        _detail = new Label { AutoSize = false, Location = new Point(42, 40), Size = new Size(W - 56, 24), ForeColor = Muted, BackColor = Color.Transparent };
        _statusCard.Controls.Add(_status);
        _statusCard.Controls.Add(_detail);
        root.Controls.Add(_statusCard);

        _primary = MakeButton("", primary: true);
        _primary.Size = new Size(W, 46);
        _primary.Font = new Font("Segoe UI Semibold", 11f);
        _primary.Margin = new Padding(0, 0, 0, 18);
        _primary.Click += (_, _) => { if (_sessions.Current != null) _app.EndSession(); else _sessions.StartDefault(); };
        root.Controls.Add(_primary);

        // Durations
        root.Controls.Add(SectionLabel("Keep awake for"));
        var grid = new TableLayoutPanel { Size = new Size(W, 88), ColumnCount = 3, RowCount = 2, Margin = new Padding(0, 0, 0, 8) };
        for (int i = 0; i < 3; i++) grid.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33.33f));
        grid.RowStyles.Add(new RowStyle(SizeType.Percent, 50));
        grid.RowStyles.Add(new RowStyle(SizeType.Percent, 50));
        AddChoice(grid, "Until I stop it", () => _sessions.Start(new Session { Kind = SessionKind.Indefinite }));
        AddChoice(grid, "30 minutes", () => _app.StartFor(30));
        AddChoice(grid, "1 hour", () => _app.StartFor(60));
        AddChoice(grid, "2 hours", () => _app.StartFor(120));
        AddChoice(grid, "4 hours", () => _app.StartFor(240));
        AddChoice(grid, "Custom time…", () => _app.PromptTime(this));
        root.Controls.Add(grid);

        var whileRow = new TableLayoutPanel { Size = new Size(W, 44), ColumnCount = 2, Margin = new Padding(0, 0, 0, 18) };
        whileRow.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        whileRow.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50));
        var appButton = AddChoice(whileRow, "While an app is open ▾", () => { });
        appButton.Click += (_, _) => _app.AppsMenu().Show(appButton, new Point(0, appButton.Height));
        AddChoice(whileRow, "Until downloads finish", () => _sessions.Start(new Session { Kind = SessionKind.WhileDownloading }));
        root.Controls.Add(whileRow);

        // Options
        root.Controls.Add(SectionLabel("Options"));
        _lid = Option("Keep running with the lid closed", "Closing the lid won't put the laptop to sleep during a session. Your normal lid setting comes back afterwards.");
        _lid.CheckedChanged += (_, _) => { if (_lid.Checked != _settings.PreventSleepWhenLidClosed) _app.SetLidClosedMode(_lid.Checked); };
        _screen = Option("Keep the screen on", "Off: the screen can turn off while the PC itself stays awake.");
        _screen.CheckedChanged += (_, _) => { if (_screen.Checked == _settings.AllowDisplaySleep) { _sessions.SetDisplaySleep(!_screen.Checked); _settings.Save(); } };
        _startup = Option("Start WakeKeeper when I sign in", "WakeKeeper waits quietly in the taskbar, ready when you need it.");
        _startup.CheckedChanged += (_, _) =>
        {
            if (_startup.Checked == _settings.LaunchAtLogin) return;
            _settings.LaunchAtLogin = _startup.Checked;
            Startup.Apply(_startup.Checked);
            _settings.Save();
        };
        if (SystemProbe.HasBattery) root.Controls.Add(_lid);
        root.Controls.Add(_screen);
        root.Controls.Add(_startup);

        // Footer
        var footer = new FlowLayoutPanel { Size = new Size(W, 30), WrapContents = false, Margin = new Padding(0, 14, 0, 0) };
        footer.Controls.Add(Link("Settings", () => _app.ShowSettings()));
        footer.Controls.Add(Link("Help", () => Links.Open(Links.Help)));
        footer.Controls.Add(Link("About", () => _app.ShowAbout()));
        root.Controls.Add(footer);
        root.Controls.Add(new Label
        {
            Text = "Closing this window keeps WakeKeeper running. Find the cup next to the clock (click ^ if it's hidden).",
            AutoSize = true, MaximumSize = new Size(W, 0), ForeColor = Muted, Font = new Font("Segoe UI", 8.75f), Margin = new Padding(0, 4, 0, 0),
        });

        Controls.Add(root);
        _sessions.Changed += Refresh;
        Refresh();
    }

    public new void Refresh()
    {
        if (IsDisposed) return;
        var s = _sessions.Current;
        _status.Text = s == null ? "Your PC can sleep normally" : "Keeping your PC awake";
        _detail.Text = s == null ? "Choose how long to keep it awake." : s.Describe();
        _primary.Text = s == null ? "Keep awake" : "Stop keeping awake";
        StylePrimary(_primary, s == null);
        _lid.Checked = _settings.PreventSleepWhenLidClosed;
        _screen.Checked = !_settings.AllowDisplaySleep;
        _startup.Checked = _settings.LaunchAtLogin;
        _statusCard.Invalidate();
    }

    /// <summary>Called every second by the tray app so the time left counts down.</summary>
    public void Tick()
    {
        if (Visible && _sessions.Current is { Remaining: not null } s) _detail.Text = s.Describe();
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        // The window is a view onto the tray app; closing it only hides it.
        if (e.CloseReason == CloseReason.UserClosing)
        {
            e.Cancel = true;
            Hide();
            _app.OnMainWindowHidden();
        }
        base.OnFormClosing(e);
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing) { _sessions.Changed -= Refresh; _tips.Dispose(); }
        base.Dispose(disposing);
    }

    private static void PaintCard(Graphics g, Rectangle r, bool active)
    {
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.Clear(Color.White);
        using var path = Rounded(new Rectangle(0, 0, r.Width - 1, r.Height - 1), 12);
        using var fill = new SolidBrush(active ? SkySoft : Silver);
        using var pen = new Pen(active ? Color.FromArgb(186, 230, 253) : Line);
        g.FillPath(fill, path);
        g.DrawPath(pen, path);
        using var dot = new SolidBrush(active ? Sky : Color.FromArgb(148, 163, 184));
        g.FillEllipse(dot, 18, 21, 12, 12);
    }

    private static GraphicsPath Rounded(Rectangle r, int radius)
    {
        var p = new GraphicsPath();
        int d = radius * 2;
        p.AddArc(r.X, r.Y, d, d, 180, 90);
        p.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        p.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90);
        p.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        p.CloseFigure();
        return p;
    }

    private static Label SectionLabel(string text) => new()
    {
        Text = text, AutoSize = true, ForeColor = Muted, Font = new Font("Segoe UI Semibold", 9.5f), Margin = new Padding(0, 0, 0, 6),
    };

    private static Button MakeButton(string text, bool primary = false)
    {
        var b = new Button { Text = text, FlatStyle = FlatStyle.Flat, Cursor = Cursors.Hand, UseVisualStyleBackColor = false };
        if (primary) StylePrimary(b, true);
        else
        {
            b.BackColor = Color.White;
            b.ForeColor = Ink;
            b.FlatAppearance.BorderColor = Line;
            b.FlatAppearance.MouseOverBackColor = SkySoft;
            b.FlatAppearance.MouseDownBackColor = Color.FromArgb(186, 230, 253);
        }
        return b;
    }

    private static void StylePrimary(Button b, bool start)
    {
        b.BackColor = start ? Sky : Color.White;
        b.ForeColor = start ? Color.White : Ink;
        b.FlatAppearance.BorderColor = start ? Sky : Color.FromArgb(203, 213, 225);
        b.FlatAppearance.MouseOverBackColor = start ? Color.FromArgb(3, 105, 161) : Silver;
        b.FlatAppearance.MouseDownBackColor = start ? Color.FromArgb(7, 89, 133) : Line;
    }

    private Button AddChoice(TableLayoutPanel grid, string text, Action onClick)
    {
        var b = MakeButton(text);
        b.Dock = DockStyle.Fill;
        b.Margin = new Padding(0, 0, grid.ColumnCount == 3 ? 6 : 6, 6);
        b.Click += (_, _) => onClick();
        grid.Controls.Add(b);
        return b;
    }

    private CheckBox Option(string text, string tip)
    {
        var cb = new CheckBox { Text = text, AutoSize = true, Margin = new Padding(0, 2, 0, 6), Cursor = Cursors.Hand };
        _tips.SetToolTip(cb, tip);
        return cb;
    }

    private static LinkLabel Link(string text, Action onClick)
    {
        var l = new LinkLabel
        {
            Text = text, AutoSize = true, LinkColor = Color.FromArgb(3, 105, 161), ActiveLinkColor = Color.FromArgb(7, 89, 133),
            LinkBehavior = LinkBehavior.HoverUnderline, Margin = new Padding(0, 0, 18, 0),
        };
        l.LinkClicked += (_, _) => onClick();
        return l;
    }
}
