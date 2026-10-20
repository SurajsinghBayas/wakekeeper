namespace WakeKeeper;

public enum SessionKind { Indefinite, Duration, Until, WhileApp, WhileDownloading, Trigger }

public sealed class Session
{
    public SessionKind Kind { get; init; }
    public DateTime Started { get; } = DateTime.Now;
    public DateTime? Ends { get; set; }
    public string? AppName { get; init; }
    public Trigger? Trigger { get; init; }
    public bool AllowDisplaySleep { get; set; }
    public bool ScreenSaverAllowed { get; set; }

    public TimeSpan? Remaining => Ends is { } end ? (end - DateTime.Now < TimeSpan.Zero ? TimeSpan.Zero : end - DateTime.Now) : null;

    public string Describe() => Kind switch
    {
        SessionKind.Indefinite => "Indefinitely",
        SessionKind.Duration or SessionKind.Until => $"Until {Ends:t} ({Format(Remaining!.Value)} left)",
        SessionKind.WhileApp => $"While {AppName} is running",
        SessionKind.WhileDownloading => "While a file is downloading",
        SessionKind.Trigger => $"Trigger: {Trigger!.Name}",
        _ => Kind.ToString(),
    };

    public static string Format(TimeSpan t) => t.TotalHours >= 1 ? $"{(int)t.TotalHours}h {t.Minutes:00}m" : $"{t.Minutes}m {t.Seconds:00}s";
}

/// <summary>Owns the single active session and the execution-state request that keeps the PC awake,
/// held for the lifetime of the session. Must be driven from the UI thread because
/// SetThreadExecutionState is per-thread.</summary>
public sealed class SessionManager
{
    private readonly Settings _settings;
    private int _downloadQuietTicks;
    private DateTime _lastReminder;
    private bool _endedByUnplug;

    public Session? Current { get; private set; }
    public event Action? Changed;
    public event Action<string, string>? Notify;

    public SessionManager(Settings settings) => _settings = settings;

    public void Start(Session session)
    {
        if (Current != null) End(silent: true);
        session.AllowDisplaySleep = session.Trigger?.AllowDisplaySleep ?? _settings.AllowDisplaySleep;
        Current = session;
        _downloadQuietTicks = 0;
        _lastReminder = DateTime.Now;
        _endedByUnplug = false;
        _settings.TotalSessions++;

        if (_settings.PreventSleepWhenLidClosed && !LidControl.Override())
            Notify?.Invoke("Lid-closed mode unavailable", "Could not change the lid-close action. Try running WakeKeeper as administrator once.");

        ApplyExecutionState();
        Log.Write($"Session started: {session.Kind}");
        bool notify = session.Kind == SessionKind.Trigger ? _settings.NotifyOnTriggerStart : _settings.NotifyOnStartEnd;
        if (notify) Notify?.Invoke("Session started", session.Describe());
        Changed?.Invoke();
    }

    public void StartDefault()
    {
        int m = _settings.DefaultDurationMinutes;
        Start(m > 0 ? new Session { Kind = SessionKind.Duration, Ends = DateTime.Now.AddMinutes(m) } : new Session { Kind = SessionKind.Indefinite });
    }

    public void End(bool silent = false)
    {
        if (Current is not { } s) return;
        _settings.TotalAwakeHours += (DateTime.Now - s.Started).TotalHours;
        Current = null;
        Native.SetThreadExecutionState(Native.ExecutionState.Continuous);
        LidControl.Restore();
        Log.Write($"Session ended: {s.Kind}");
        if (!silent && _settings.NotifyOnStartEnd) Notify?.Invoke("Session ended", "Your PC can sleep normally again.");
        Changed?.Invoke();
        try { _settings.Save(); } catch (IOException) { }
    }

    public void Extend(int minutes)
    {
        if (Current is not { Ends: { } end } s) return;
        s.Ends = end.AddMinutes(minutes);
        Changed?.Invoke();
    }

    public void ToggleDisplaySleep()
    {
        if (Current is { } s) s.AllowDisplaySleep = !s.AllowDisplaySleep;
        else _settings.AllowDisplaySleep = !_settings.AllowDisplaySleep;
        ApplyExecutionState();
        Changed?.Invoke();
    }

    private void ApplyExecutionState()
    {
        if (Current is not { } s) return;
        var flags = Native.ExecutionState.Continuous | Native.ExecutionState.SystemRequired;
        // On Windows a display request also suppresses the screen saver, so "allow screen saver after N
        // minutes" is implemented by dropping the display request once that time has elapsed.
        if (!s.AllowDisplaySleep && !s.ScreenSaverAllowed) flags |= Native.ExecutionState.DisplayRequired;
        Native.SetThreadExecutionState(flags);
    }

    /// <summary>Called once per second.</summary>
    public void Tick()
    {
        if (Current is not { } s)
        {
            if (_endedByUnplug && _settings.RestartSessionIfReplugged && SystemProbe.OnAcPower)
            {
                _endedByUnplug = false;
                StartDefault();
            }
            return;
        }

        string? reason = null;
        switch (s.Kind)
        {
            case SessionKind.Duration or SessionKind.Until when DateTime.Now >= s.Ends:
                reason = "Time is up"; break;
            case SessionKind.WhileApp when !SystemProbe.IsProcessRunning(s.AppName!):
                reason = $"{s.AppName} quit"; break;
            case SessionKind.WhileDownloading:
                _downloadQuietTicks = SystemProbe.HasPartialDownloads(SystemProbe.DownloadsFolder) ? 0 : _downloadQuietTicks + 1;
                if (_downloadQuietTicks >= 15) reason = "Download finished";
                break;
        }

        if (reason == null && s.Kind != SessionKind.Trigger)
        {
            bool ac = SystemProbe.OnAcPower;
            if (_settings.EndSessionIfUnplugged && !ac && SystemProbe.HasBattery)
            {
                reason = "Power adapter disconnected";
                _endedByUnplug = true;
            }
            else if (_settings.EndSessionOnLowBattery && SystemProbe.BatteryPercent is { } pct && pct < _settings.LowBatteryPercent
                     && !(ac && _settings.IgnoreBatteryIfPluggedIn))
            {
                reason = $"Battery below {_settings.LowBatteryPercent}%";
            }
        }

        if (reason != null)
        {
            bool unplug = _endedByUnplug;
            End(silent: true);
            _endedByUnplug = unplug;
            if (_settings.NotifyOnStartEnd) Notify?.Invoke("Session ended", reason);
            return;
        }

        if (!s.ScreenSaverAllowed && _settings.AllowScreenSaverAfterMinutes > 0
            && DateTime.Now - s.Started >= TimeSpan.FromMinutes(_settings.AllowScreenSaverAfterMinutes))
        {
            s.ScreenSaverAllowed = true;
            ApplyExecutionState();
        }

        if (_settings.ReminderEveryMinutes > 0 && DateTime.Now - _lastReminder >= TimeSpan.FromMinutes(_settings.ReminderEveryMinutes))
        {
            _lastReminder = DateTime.Now;
            Notify?.Invoke("Still keeping your PC awake", s.Describe());
        }

        TrackIdle();
    }

    // Our own cursor nudges reset Windows' idle timer, so real user inactivity is tracked as
    // (idle carried over from before our nudges) + (current idle).
    private double _carriedIdle, _lastIdle;
    private bool _justJiggled, _locked;

    private void TrackIdle()
    {
        double idle = Native.IdleSeconds();
        if (idle < _lastIdle && !_justJiggled) { _carriedIdle = 0; _locked = false; } // genuine user input
        _justJiggled = false;
        _lastIdle = idle;
        double userIdle = _carriedIdle + idle;

        if (_settings.LockScreenWhenIdle && !_locked && userIdle >= _settings.LockScreenAfterMinutes * 60)
        {
            _locked = Native.LockWorkStation();
        }
        else if (_settings.MoveCursorWhenIdle && idle >= _settings.MoveCursorAfterMinutes * 60)
        {
            _carriedIdle += idle;
            _justJiggled = true;
            Native.JiggleMouse();
        }
    }

    /// <summary>Windows is going to sleep anyway (lid, power button, Start ▸ Sleep).</summary>
    public void OnSuspend()
    {
        if (_settings.EndSessionOnForcedSleep && Current is { Kind: not SessionKind.Trigger }) End(silent: true);
    }

    public void OnResume()
    {
        if (_settings.StartSessionAfterWake && Current == null) StartDefault();
    }
}
