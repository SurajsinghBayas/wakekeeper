using System.Diagnostics;
using System.Text.RegularExpressions;

namespace WakeKeeper;

/// <summary>Lid-closed mode: keeps a laptop running with the lid shut. Execution-state requests cannot
/// stop lid-close sleep on Windows, so this
/// temporarily sets the active power plan's lid action to "Do nothing" and restores it afterwards.
/// The original values are persisted so they can be restored after a crash.</summary>
internal static class LidControl
{
    private const string LidAction = "SUB_BUTTONS LIDACTION";
    private static string BackupFile => Path.Combine(Settings.Folder, "lid-backup.txt");

    public static bool IsOverridden => File.Exists(BackupFile);

    public static bool Override()
    {
        if (IsOverridden) return true;
        var (ac, dc) = Query();
        if (ac is null || dc is null) return false;

        Directory.CreateDirectory(Settings.Folder);
        File.WriteAllText(BackupFile, $"{ac} {dc}");
        bool ok = Apply(0, 0);
        if (!ok) File.Delete(BackupFile);
        return ok;
    }

    public static void Restore()
    {
        if (!IsOverridden) return;
        var parts = File.ReadAllText(BackupFile).Split(' ');
        if (parts.Length == 2 && int.TryParse(parts[0], out var ac) && int.TryParse(parts[1], out var dc) && Apply(ac, dc))
            File.Delete(BackupFile);
    }

    private static bool Apply(int ac, int dc) =>
        PowerCfg($"/setacvalueindex SCHEME_CURRENT {LidAction} {ac}", out _)
        && PowerCfg($"/setdcvalueindex SCHEME_CURRENT {LidAction} {dc}", out _)
        && PowerCfg("/setactive SCHEME_CURRENT", out _);

    private static (int? ac, int? dc) Query()
    {
        if (!PowerCfg($"/query SCHEME_CURRENT {LidAction}", out var output)) return (null, null);
        // Lines look like "Current AC Power Setting Index: 0x00000001" (localised on non-English Windows,
        // so match on the hex values in order: AC first, then DC).
        var values = Regex.Matches(output, @":\s*0x([0-9a-fA-F]{8})\s*$", RegexOptions.Multiline)
            .Select(m => Convert.ToInt32(m.Groups[1].Value, 16)).ToList();
        return values.Count >= 2 ? (values[^2], values[^1]) : (null, null);
    }

    private static bool PowerCfg(string args, out string output)
    {
        output = "";
        try
        {
            var psi = new ProcessStartInfo("powercfg", args)
            {
                RedirectStandardOutput = true, RedirectStandardError = true, UseShellExecute = false, CreateNoWindow = true,
            };
            using var p = Process.Start(psi)!;
            output = p.StandardOutput.ReadToEnd();
            p.WaitForExit(5000);
            if (p.ExitCode != 0) Log.Write($"powercfg {args} exited {p.ExitCode}: {p.StandardError.ReadToEnd()}");
            return p.ExitCode == 0;
        }
        catch (Exception ex)
        {
            Log.Write($"powercfg {args} failed: {ex.Message}");
            return false;
        }
    }
}
