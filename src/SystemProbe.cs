using System.Diagnostics;
using System.Text.RegularExpressions;

namespace WakeKeeper;

/// <summary>Read-only system state used by sessions and Trigger criteria.</summary>
internal static class SystemProbe
{
    public static bool OnAcPower => SystemInformation.PowerStatus.PowerLineStatus == PowerLineStatus.Online;

    public static bool HasBattery => !SystemInformation.PowerStatus.BatteryChargeStatus.HasFlag(BatteryChargeStatus.NoSystemBattery);

    /// <summary>Battery charge 0–100, or null when no battery is present.</summary>
    public static int? BatteryPercent
    {
        get
        {
            var ps = SystemInformation.PowerStatus;
            if (!HasBattery || ps.BatteryLifePercent > 1f) return null;
            return (int)Math.Round(ps.BatteryLifePercent * 100);
        }
    }

    public static bool IsProcessRunning(string name)
    {
        name = Path.GetFileNameWithoutExtension(name);
        var procs = Process.GetProcessesByName(name);
        foreach (var p in procs) p.Dispose();
        return procs.Length > 0;
    }

    public static bool IsProcessFrontmost(string name)
    {
        Native.GetWindowThreadProcessId(Native.GetForegroundWindow(), out var pid);
        if (pid == 0) return false;
        try
        {
            using var p = Process.GetProcessById((int)pid);
            return string.Equals(p.ProcessName, Path.GetFileNameWithoutExtension(name), StringComparison.OrdinalIgnoreCase);
        }
        catch (ArgumentException) { return false; }
    }

    /// <summary>Distinct names of processes that own a visible window, for the "While an app is open" menu.</summary>
    public static List<string> WindowedProcessNames()
    {
        var names = new SortedSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var p in Process.GetProcesses())
        {
            try { if (p.MainWindowHandle != IntPtr.Zero && p.Id != Environment.ProcessId) names.Add(p.ProcessName); }
            catch { /* access denied for some system processes */ }
            finally { p.Dispose(); }
        }
        return names.ToList();
    }

    private static string? _ssid;
    private static DateTime _ssidAt = DateTime.MinValue;

    /// <summary>Current Wi-Fi SSID via netsh, cached for 30 s. Windows 11 24H2+ requires
    /// Location access for this.</summary>
    public static string? WifiSsid
    {
        get
        {
            if (DateTime.UtcNow - _ssidAt < TimeSpan.FromSeconds(30)) return _ssid;
            _ssidAt = DateTime.UtcNow;
            _ssid = null;
            try
            {
                var psi = new ProcessStartInfo("netsh", "wlan show interfaces")
                {
                    RedirectStandardOutput = true, UseShellExecute = false, CreateNoWindow = true,
                };
                using var p = Process.Start(psi)!;
                var output = p.StandardOutput.ReadToEnd();
                p.WaitForExit(3000);
                var m = Regex.Match(output, @"^\s*SSID\s*:\s*(.+)$", RegexOptions.Multiline);
                if (m.Success) _ssid = m.Groups[1].Value.Trim();
            }
            catch (Exception ex) { Log.Write($"netsh failed: {ex.Message}"); }
            return _ssid;
        }
    }

    private static long _prevIdle, _prevTotal;

    /// <summary>System-wide CPU utilisation since the previous call, 0–100.</summary>
    public static int CpuPercent()
    {
        if (!Native.GetSystemTimes(out var idle, out var kernel, out var user)) return 0;
        long total = kernel + user; // kernel time includes idle time
        long dIdle = idle - _prevIdle, dTotal = total - _prevTotal;
        _prevIdle = idle; _prevTotal = total;
        return dTotal <= 0 ? 0 : (int)Math.Clamp(100 - dIdle * 100 / dTotal, 0, 100);
    }

    public static bool DriveMounted(string root) =>
        DriveInfo.GetDrives().Any(d => d.IsReady && string.Equals(d.Name, NormalizeRoot(root), StringComparison.OrdinalIgnoreCase));

    public static string NormalizeRoot(string root)
    {
        root = root.Trim();
        if (root.Length == 1) root += ":";
        if (!root.EndsWith('\\')) root += "\\";
        return root.ToUpperInvariant();
    }

    private static readonly string[] PartialDownloadPatterns = { "*.crdownload", "*.part", "*.partial", "*.download", "*.opdownload", "*.!ut" };

    public static string DownloadsFolder =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads");

    /// <summary>True while a browser/torrent client has an in-progress download in the folder.</summary>
    public static bool HasPartialDownloads(string folder)
    {
        try
        {
            return PartialDownloadPatterns.Any(pattern =>
                Directory.EnumerateFileSystemEntries(folder, pattern, SearchOption.TopDirectoryOnly).Any());
        }
        catch (IOException) { return false; }
        catch (UnauthorizedAccessException) { return false; }
    }
}
