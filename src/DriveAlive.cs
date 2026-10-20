namespace WakeKeeper;

/// <summary>Keeps external drives spinning by touching a small hidden file on each one at an interval,
/// so they never spin down mid-task.</summary>
public sealed class DriveAlive
{
    private const string FileName = ".wakekeeper-drivealive";
    private readonly Settings _settings;
    private readonly SessionManager _sessions;
    private DateTime _last = DateTime.MinValue;

    public DriveAlive(Settings settings, SessionManager sessions)
    {
        _settings = settings;
        _sessions = sessions;
    }

    public void Tick()
    {
        if (!_settings.DriveAliveEnabled || _settings.DriveAliveDrives.Count == 0) return;
        if (_settings.DriveAliveOnlyDuringSession && _sessions.Current == null) return;
        if (DateTime.Now - _last < TimeSpan.FromSeconds(Math.Max(10, _settings.DriveAliveIntervalSeconds))) return;
        _last = DateTime.Now;

        foreach (var root in _settings.DriveAliveDrives)
        {
            var path = Path.Combine(SystemProbe.NormalizeRoot(root), FileName);
            try
            {
                if (!SystemProbe.DriveMounted(root)) continue;
                // FileMode.Create fails on an existing hidden file, so open and truncate instead.
                using (var fs = new FileStream(path, FileMode.OpenOrCreate, FileAccess.Write))
                using (var w = new StreamWriter(fs))
                {
                    fs.SetLength(0);
                    w.Write(DateTime.UtcNow.ToString("O"));
                    w.Flush();
                    fs.Flush(flushToDisk: true);
                }
                File.SetAttributes(path, FileAttributes.Hidden);
            }
            catch (Exception ex) { Log.Write($"Drive Alive write to {path} failed: {ex.Message}"); }
        }
    }

    /// <summary>Removable and fixed non-system drives that are candidates for Drive Alive.</summary>
    public static IEnumerable<DriveInfo> CandidateDrives()
    {
        var system = Path.GetPathRoot(Environment.SystemDirectory);
        return DriveInfo.GetDrives().Where(d => d.IsReady
            && d.DriveType is DriveType.Removable or DriveType.Fixed or DriveType.Network
            && !string.Equals(d.Name, system, StringComparison.OrdinalIgnoreCase));
    }
}
