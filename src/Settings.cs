using System.Text.Json;
using System.Text.Json.Serialization;

namespace WakeKeeper;

public enum CriterionKind { AppRunning, PowerAdapter, BatteryAbove, WifiNetwork, Schedule, IdleTimeBelow, CpuAbove, DrivePresent }

/// <summary>One condition of a Trigger. All enabled criteria must be true for the Trigger to fire.</summary>
public sealed class Criterion
{
    public CriterionKind Kind { get; set; }
    /// <summary>Process name, SSID, drive root (e.g. "E:\"), etc., depending on Kind.</summary>
    public string Text { get; set; } = "";
    /// <summary>Percent, minutes, or "require frontmost" (1/0), depending on Kind.</summary>
    public int Number { get; set; }
    public TimeOnly From { get; set; } = new(9, 0);
    public TimeOnly To { get; set; } = new(17, 0);
    public DayOfWeek[] Days { get; set; } = Enum.GetValues<DayOfWeek>();

    public override string ToString() => Kind switch
    {
        CriterionKind.AppRunning => $"App running: {Text}" + (Number == 1 ? " (frontmost)" : ""),
        CriterionKind.PowerAdapter => "Power adapter connected",
        CriterionKind.BatteryAbove => $"Battery ≥ {Number}%",
        CriterionKind.WifiNetwork => $"Wi-Fi: {Text}",
        CriterionKind.Schedule => $"Schedule {From:HH\\:mm}–{To:HH\\:mm} ({string.Join(",", Days.Select(d => d.ToString()[..3]))})",
        CriterionKind.IdleTimeBelow => $"Idle less than {Number} min",
        CriterionKind.CpuAbove => $"CPU ≥ {Number}%",
        CriterionKind.DrivePresent => $"Drive mounted: {Text}",
        _ => Kind.ToString(),
    };
}

public sealed class Trigger
{
    public string Name { get; set; } = "My rule";
    public bool Enabled { get; set; } = true;
    public bool AllowDisplaySleep { get; set; }
    public List<Criterion> Criteria { get; set; } = new();
}

public sealed class Hotkey
{
    public uint Modifiers { get; set; }
    public Keys Key { get; set; } = Keys.None;
    [JsonIgnore] public bool IsSet => Key != Keys.None;

    public override string ToString()
    {
        if (!IsSet) return "None";
        var parts = new List<string>();
        if ((Modifiers & Native.MOD_CONTROL) != 0) parts.Add("Ctrl");
        if ((Modifiers & Native.MOD_ALT) != 0) parts.Add("Alt");
        if ((Modifiers & Native.MOD_SHIFT) != 0) parts.Add("Shift");
        if ((Modifiers & Native.MOD_WIN) != 0) parts.Add("Win");
        parts.Add(Key.ToString());
        return string.Join("+", parts);
    }
}

public sealed class Settings
{
    // General
    public bool LaunchAtLogin { get; set; }
    public bool StartSessionAtLaunch { get; set; }
    public bool StartSessionAfterWake { get; set; }

    // Session defaults (non-Trigger sessions)
    public int DefaultDurationMinutes { get; set; } = 0; // 0 = indefinite
    public bool AllowDisplaySleep { get; set; }
    public bool AllowScreenSaver { get; set; }
    public int AllowScreenSaverAfterMinutes { get; set; } = 45; // of inactivity
    public bool PreventSleepWhenLidClosed { get; set; }
    public bool EndSessionOnLowBattery { get; set; }
    public int LowBatteryPercent { get; set; } = 10;
    public bool IgnoreBatteryIfPluggedIn { get; set; } = true;
    public bool EndSessionIfUnplugged { get; set; }
    public bool RestartSessionIfReplugged { get; set; }
    public bool EndSessionOnForcedSleep { get; set; } = true;

    // System control
    public bool MoveCursorWhenIdle { get; set; }
    public int MoveCursorAfterMinutes { get; set; } = 4;
    public bool LockScreenWhenIdle { get; set; }
    public int LockScreenAfterMinutes { get; set; } = 10;

    // Notifications
    public bool NotifyOnStartEnd { get; set; } = true;
    public bool NotifyOnTriggerStart { get; set; } = true;
    public int ReminderEveryMinutes { get; set; } = 0;
    public bool ShowTimeRemainingInTray { get; set; }

    // Support
    public bool DebugMode { get; set; }

    // Triggers
    public bool TriggersEnabled { get; set; } = true;
    public List<Trigger> Triggers { get; set; } = new();

    // Keep drives spinning
    public bool SpinDrivesEnabled { get; set; }
    public List<string> SpinDrives { get; set; } = new();
    public int SpinIntervalSeconds { get; set; } = 60;
    public bool SpinOnlyDuringSession { get; set; } = true;

    // Hot keys
    public Hotkey StartEndHotkey { get; set; } = new() { Modifiers = Native.MOD_CONTROL | Native.MOD_ALT, Key = Keys.A };
    public Hotkey ToggleDisplaySleepHotkey { get; set; } = new();

    // Statistics
    public double TotalAwakeHours { get; set; }
    public int TotalSessions { get; set; }

    private static readonly JsonSerializerOptions Json = new() { WriteIndented = true, Converters = { new JsonStringEnumConverter() } };

    public static string Folder => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "WakeKeeper");
    private static string FilePath => Path.Combine(Folder, "settings.json");

    public static bool Exists => File.Exists(FilePath);

    public static Settings Load()
    {
        try
        {
            if (File.Exists(FilePath))
            {
                var json = File.ReadAllText(FilePath);
                var s = JsonSerializer.Deserialize<Settings>(json, Json) ?? new();
                // 1.1 stored "0 = never" in the minutes field instead of a separate switch.
                if (!json.Contains("\"AllowScreenSaver\"")) s.AllowScreenSaver = s.AllowScreenSaverAfterMinutes > 0;
                if (s.AllowScreenSaverAfterMinutes <= 0) s.AllowScreenSaverAfterMinutes = 45;
                return s;
            }
        }
        catch (Exception ex) { Log.Write($"Settings load failed: {ex.Message}"); }
        return new();
    }

    public void Save()
    {
        Directory.CreateDirectory(Folder);
        var tmp = FilePath + ".tmp";
        File.WriteAllText(tmp, JsonSerializer.Serialize(this, Json));
        File.Move(tmp, FilePath, overwrite: true);
    }
}

internal static class Log
{
    public static bool Enabled { get; set; }
    public static string FilePath => Path.Combine(Settings.Folder, "debug.log");

    public static void Write(string message)
    {
        if (!Enabled) return;
        try
        {
            Directory.CreateDirectory(Settings.Folder);
            File.AppendAllText(FilePath, $"{DateTime.Now:O} {message}{Environment.NewLine}");
        }
        catch { /* logging must never crash the app */ }
    }
}
