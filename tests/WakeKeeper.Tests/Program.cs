using System.Diagnostics;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;

namespace WakeKeeper.Tests;

/// <summary>Runs WakeKeeper's real tray app, windows and session logic on a Windows desktop, checks what Windows
/// reports (powercfg), and saves screenshots of every window and menu. Exit code 1 if any check fails.
/// Usage: WakeKeeper.Tests.exe &lt;screenshot folder&gt;</summary>
internal static class Program
{
    private static string _shots = "shots";
    private static int _failed, _passed;

    [STAThread]
    private static int Main(string[] args)
    {
        _shots = Path.GetFullPath(args.FirstOrDefault() ?? "shots");
        Directory.CreateDirectory(_shots);
        Application.SetHighDpiMode(HighDpiMode.PerMonitorV2);
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        var runner = new Form { ShowInTaskbar = false, Opacity = 0, Size = new Size(1, 1), StartPosition = FormStartPosition.Manual, Location = new Point(-2000, -2000) };
        runner.Shown += async (_, _) =>
        {
            try { await RunAll(); }
            catch (Exception ex) { Fail("unexpected exception", ex.ToString()); }
            runner.Close();
        };
        Application.Run(runner);
        Console.WriteLine($"\n{_passed} passed, {_failed} failed");
        File.WriteAllText(Path.Combine(_shots, "results.txt"), $"{_passed} passed, {_failed} failed\n" + Results);
        return _failed == 0 ? 0 : 1;
    }

    private static string Results = "";

    private static void Pass(string name) { _passed++; Report($"PASS  {name}"); }
    private static void Fail(string name, string detail) { _failed++; Report($"FAIL  {name}: {detail}"); }
    private static void Check(string name, bool ok, string detail = "") { if (ok) Pass(name); else Fail(name, detail); }
    private static void Report(string line) { Console.WriteLine(line); Results += line + "\n"; }

    private static Task Wait(int ms) => Task.Delay(ms);

    private static async Task RunAll()
    {
        Report($"Windows {Environment.OSVersion.Version}, battery: {SystemProbe.HasBattery}, screen: {Screen.PrimaryScreen!.Bounds.Size}");

        // Settings survive a save and reload.
        var saved = new Settings { LowBatteryPercent = 23, AllowScreenSaver = true, DefaultDurationMinutes = 90 };
        saved.Triggers.Add(new Trigger { Name = "Nightly", Criteria = { new Criterion { Kind = CriterionKind.Schedule } } });
        saved.Save();
        var loaded = Settings.Load();
        Check("settings round-trip", loaded.LowBatteryPercent == 23 && loaded.AllowScreenSaver && loaded.DefaultDurationMinutes == 90
            && loaded.Triggers.Count == 1 && loaded.Triggers[0].Criteria[0].Kind == CriterionKind.Schedule);
        new Settings().Save();

        using var signals = new InstanceSignals();
        var app = new TrayApp(signals, showWindow: true);
        await Wait(1200);

        // Opening the app shows the main window.
        var win = app.Window;
        Check("main window opens on launch", win is { Visible: true }, "window not visible");
        if (win == null) return;
        Shot(win, "01-main-idle");
        Check("idle status text", FindLabel(win, "Your PC can sleep normally") != null);

        // Start from the big button: Windows must now report a system (and display) request from us.
        Click(win, "Keep awake");
        await Wait(800);
        Check("primary button starts a session", app.Sessions.Current?.Kind == SessionKind.Indefinite);
        var req = PowerRequests();
        Check("Windows sees SYSTEM request", Section(req, "SYSTEM").Contains("WakeKeeper", StringComparison.OrdinalIgnoreCase), req);
        Check("Windows sees DISPLAY request", Section(req, "DISPLAY").Contains("WakeKeeper", StringComparison.OrdinalIgnoreCase), req);
        Shot(win, "02-main-active");

        // "Keep the screen on" off: display request goes away, system request stays.
        var screen = FindCheck(win, "Keep the screen on")!;
        screen.Checked = false;
        await Wait(500);
        req = PowerRequests();
        Check("screen-off option drops DISPLAY request", !Section(req, "DISPLAY").Contains("WakeKeeper", StringComparison.OrdinalIgnoreCase)
            && Section(req, "SYSTEM").Contains("WakeKeeper", StringComparison.OrdinalIgnoreCase), req);
        screen.Checked = true;
        await Wait(300);

        // Stop: requests are released.
        Click(win, "Stop keeping awake");
        await Wait(800);
        req = PowerRequests();
        Check("stop releases all requests", app.Sessions.Current == null && !req.Contains("WakeKeeper", StringComparison.OrdinalIgnoreCase), req);

        // Duration buttons.
        Click(win, "30 minutes");
        await Wait(300);
        var left = app.Sessions.Current?.Remaining;
        Check("30 minutes button", app.Sessions.Current?.Kind == SessionKind.Duration && left > TimeSpan.FromMinutes(29) && left <= TimeSpan.FromMinutes(30));
        Shot(win, "03-main-timed");
        app.Sessions.Extend(15);
        Check("add time extends the session", app.Sessions.Current?.Remaining > TimeSpan.FromMinutes(44));

        // A timed session ends by itself.
        app.Sessions.Start(new Session { Kind = SessionKind.Duration, Ends = DateTime.Now.AddSeconds(2) });
        await Wait(3500);
        Check("timed session ends when time is up", app.Sessions.Current == null);

        // While an app is open: ends when that app quits.
        var ping = Process.Start(new ProcessStartInfo("ping", "-n 4 127.0.0.1") { CreateNoWindow = true, UseShellExecute = false })!;
        app.Sessions.Start(new Session { Kind = SessionKind.WhileApp, AppName = "PING" });
        await Wait(1500);
        Check("app session runs while the app is open", app.Sessions.Current?.Kind == SessionKind.WhileApp);
        ping.WaitForExit(10000);
        await Wait(2500);
        Check("app session ends when the app quits", app.Sessions.Current == null);

        // Until downloads finish: stays while a partial download exists, ends ~15 s after it's gone.
        Directory.CreateDirectory(SystemProbe.DownloadsFolder);
        var partial = Path.Combine(SystemProbe.DownloadsFolder, "big-file.iso.crdownload");
        File.WriteAllText(partial, "x");
        app.Sessions.Start(new Session { Kind = SessionKind.WhileDownloading });
        await Wait(3000);
        Check("download session runs during a download", app.Sessions.Current?.Kind == SessionKind.WhileDownloading);
        File.Delete(partial);
        await Wait(17500);
        Check("download session ends after the download finishes", app.Sessions.Current == null);

        // Global hot key Ctrl+Alt+A toggles a session.
        SendHotkey(Keys.A);
        await Wait(800);
        Check("hot key starts a session", app.Sessions.Current != null);
        SendHotkey(Keys.A);
        await Wait(800);
        Check("hot key stops the session", app.Sessions.Current == null);

        // Lid-closed mode: changes the lid action only during a session and puts it back afterwards.
        var before = LidValues();
        Report($"lid action before: {before}");
        if (before != null)
        {
            app.SetLidClosedMode(true);
            app.Sessions.StartDefault();
            await Wait(800);
            Check("lid-closed mode sets lid action to Do nothing", LidValues() == "0 0", LidValues() ?? "unreadable");
            app.Sessions.End(silent: true);
            await Wait(800);
            Check("lid action restored after the session", LidValues() == before, LidValues() ?? "unreadable");

            // Crash recovery: override, then restore as a fresh start would.
            LidControl.Override();
            LidControl.Restore();
            Check("lid action restored after a crash", LidValues() == before && !LidControl.IsOverridden);
            app.SetLidClosedMode(false);
        }
        else Report("SKIP  lid tests: this PC has no lid setting");

        // Screen saver after idle: setting is honoured without errors.
        app.CurrentSettings.AllowScreenSaver = true;
        app.Sessions.StartDefault();
        await Wait(1200);
        Check("screen saver option keeps session running", app.Sessions.Current != null);
        app.Sessions.End(silent: true);
        app.CurrentSettings.AllowScreenSaver = false;

        // Tray menu and every submenu.
        app.Sessions.Start(new Session { Kind = SessionKind.Duration, Ends = DateTime.Now.AddMinutes(90) });
        var menu = app.BuildMenuForTest();
        var origin = new Point(Screen.PrimaryScreen.WorkingArea.Right - 20, Screen.PrimaryScreen.WorkingArea.Bottom - 10);
        menu.Show(origin, ToolStripDropDownDirection.AboveLeft);
        await Wait(600);
        Check("tray menu has at most 14 top-level entries", menu.Items.Count <= 14, $"{menu.Items.Count}");
        ShotScreen("04-tray-menu");
        int n = 5;
        foreach (var item in menu.Items.OfType<ToolStripMenuItem>().Where(i => i.HasDropDownItems).ToList())
        {
            item.ShowDropDown();
            await Wait(500);
            ShotScreen($"{n++:00}-menu-{Slug(item.Text!)}");
            item.HideDropDown();
        }
        menu.Close();
        app.Sessions.End(silent: true);

        // Settings window, every tab.
        app.ShowSettings();
        await Wait(800);
        var settings = app.SettingsWindow!;
        var tabs = settings.Controls.OfType<TabControl>().First();
        Check("settings has 6 tabs or fewer", tabs.TabCount <= 6, $"{tabs.TabCount}");
        for (int i = 0; i < tabs.TabCount; i++)
        {
            tabs.SelectedIndex = i;
            await Wait(300);
            Shot(settings, $"{n++:00}-settings-{Slug(tabs.TabPages[i].Text)}");
        }
        settings.Close();
        await Wait(300);

        // Custom time and About dialogs.
        using (var time = new TimeDialog())
        {
            time.Show();
            await Wait(500);
            Shot(time, $"{n++:00}-custom-time");
            time.Close();
        }
        app.ShowAbout();
        await Wait(600);
        Shot(app.AboutWindow!, $"{n++:00}-about");
        app.AboutWindow!.Close();

        // Closing the window hides it; the app keeps running and can show it again.
        win.Close();
        await Wait(600);
        Check("closing the window hides it (app keeps running)", !win.IsDisposed && !win.Visible);
        ShotScreen($"{n++:00}-after-close-balloon");
        app.ShowMainWindow();
        await Wait(500);
        Check("window can be opened again", app.Window is { Visible: true });

        // Quit: session ends, requests released, lid restored.
        app.SetLidClosedMode(before != null);
        app.Sessions.StartDefault();
        await Wait(500);
        app.ExitThread();
        await Wait(800);
        req = PowerRequests();
        Check("quit releases requests", !req.Contains("WakeKeeper", StringComparison.OrdinalIgnoreCase), req);
        if (before != null) Check("quit restores lid action", LidValues() == before, LidValues() ?? "");
    }

    // ---- helpers ----

    private static string Slug(string s) => Regex.Replace(s.Replace("&", "").ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');

    private static IEnumerable<Control> All(Control root) => root.Controls.Cast<Control>().SelectMany(c => new[] { c }.Concat(All(c)));
    private static Label? FindLabel(Control root, string text) => All(root).OfType<Label>().FirstOrDefault(l => l.Text == text);
    private static CheckBox? FindCheck(Control root, string text) => All(root).OfType<CheckBox>().FirstOrDefault(c => c.Text == text);

    private static void Click(Control root, string text)
    {
        var b = All(root).OfType<Button>().FirstOrDefault(x => x.Text == text);
        if (b == null) { Fail($"find button '{text}'", "not found"); return; }
        b.PerformClick();
    }

    private static string Run(string file, string args)
    {
        var p = Process.Start(new ProcessStartInfo(file, args) { RedirectStandardOutput = true, UseShellExecute = false, CreateNoWindow = true })!;
        var output = p.StandardOutput.ReadToEnd();
        p.WaitForExit(10000);
        return output;
    }

    private static string PowerRequests() => Run("powercfg", "/requests");

    /// <summary>Text under one heading of powercfg /requests (e.g. "SYSTEM:") up to the next heading.</summary>
    private static string Section(string requests, string name)
    {
        var m = Regex.Match(requests, $@"^{name}:\s*$(.*?)(?=^[A-Z]+:\s*$|\z)", RegexOptions.Multiline | RegexOptions.Singleline);
        return m.Success ? m.Groups[1].Value : "";
    }

    private static string? LidValues()
    {
        var output = Run("powercfg", "/query SCHEME_CURRENT SUB_BUTTONS LIDACTION");
        var values = Regex.Matches(output, @":\s*0x([0-9a-fA-F]{8})\s*$", RegexOptions.Multiline).Select(m => Convert.ToInt32(m.Groups[1].Value, 16)).ToList();
        return values.Count >= 2 ? $"{values[^2]} {values[^1]}" : null;
    }

    private static void Shot(Form form, string name)
    {
        form.Activate();
        Application.DoEvents();
        var r = form.Bounds;
        Capture(Rectangle.Inflate(r, 8, 8), name);
    }

    private static void ShotScreen(string name) => Capture(Screen.PrimaryScreen!.Bounds, name);

    private static void Capture(Rectangle r, string name)
    {
        r.Intersect(Screen.PrimaryScreen!.Bounds);
        using var bmp = new Bitmap(r.Width, r.Height);
        using (var g = Graphics.FromImage(bmp)) g.CopyFromScreen(r.Location, Point.Empty, r.Size);
        bmp.Save(Path.Combine(_shots, name + ".png"), ImageFormat.Png);
    }

    [DllImport("user32.dll")] private static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);

    private static void SendHotkey(Keys key)
    {
        const byte ctrl = 0x11, alt = 0x12;
        const uint up = 0x2;
        keybd_event(ctrl, 0, 0, UIntPtr.Zero);
        keybd_event(alt, 0, 0, UIntPtr.Zero);
        keybd_event((byte)key, 0, 0, UIntPtr.Zero);
        keybd_event((byte)key, 0, up, UIntPtr.Zero);
        keybd_event(alt, 0, up, UIntPtr.Zero);
        keybd_event(ctrl, 0, up, UIntPtr.Zero);
    }
}
