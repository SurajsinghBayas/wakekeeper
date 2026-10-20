namespace WakeKeeper;

/// <summary>Evaluates Triggers every few seconds. When every criterion of an enabled Trigger is true,
/// a Trigger session starts; when they stop being true, that session ends. Manual sessions take
/// precedence and are never replaced by a Trigger.</summary>
public sealed class TriggerEngine
{
    private readonly Settings _settings;
    private readonly SessionManager _sessions;
    private DateTime _pausedUntil = DateTime.MinValue;

    public TriggerEngine(Settings settings, SessionManager sessions)
    {
        _settings = settings;
        _sessions = sessions;
    }

    public bool Paused => DateTime.Now < _pausedUntil;

    public void PauseFor(TimeSpan span)
    {
        _pausedUntil = DateTime.Now + span;
        if (_sessions.Current is { Kind: SessionKind.Trigger }) _sessions.End();
    }

    public void Tick()
    {
        if (!_settings.TriggersEnabled || Paused)
        {
            if (_sessions.Current is { Kind: SessionKind.Trigger }) _sessions.End();
            return;
        }

        var current = _sessions.Current;
        if (current != null && current.Kind != SessionKind.Trigger) return;

        var match = _settings.Triggers.FirstOrDefault(t => t.Enabled && t.Criteria.Count > 0 && t.Criteria.All(Evaluate));
        if (match == null)
        {
            if (current != null) _sessions.End();
        }
        else if (current?.Trigger != match)
        {
            _sessions.Start(new Session { Kind = SessionKind.Trigger, Trigger = match });
        }
    }

    public static bool Evaluate(Criterion c)
    {
        try
        {
            return c.Kind switch
            {
                CriterionKind.AppRunning => c.Number == 1 ? SystemProbe.IsProcessFrontmost(c.Text) : SystemProbe.IsProcessRunning(c.Text),
                CriterionKind.PowerAdapter => SystemProbe.OnAcPower,
                CriterionKind.BatteryAbove => (SystemProbe.BatteryPercent ?? 100) >= c.Number,
                CriterionKind.WifiNetwork => string.Equals(SystemProbe.WifiSsid, c.Text, StringComparison.Ordinal),
                CriterionKind.Schedule => InSchedule(c, DateTime.Now),
                CriterionKind.IdleTimeBelow => Native.IdleSeconds() < c.Number * 60,
                CriterionKind.CpuAbove => SystemProbe.CpuPercent() >= c.Number,
                CriterionKind.DrivePresent => SystemProbe.DriveMounted(c.Text),
                _ => false,
            };
        }
        catch (Exception ex)
        {
            Log.Write($"Criterion {c} failed: {ex.Message}");
            return false;
        }
    }

    /// <summary>Handles windows that cross midnight (e.g. 22:00–06:00); the day is the one the window started on.</summary>
    public static bool InSchedule(Criterion c, DateTime now)
    {
        var t = TimeOnly.FromDateTime(now);
        if (c.From <= c.To)
            return c.Days.Contains(now.DayOfWeek) && t >= c.From && t < c.To;
        if (t >= c.From) return c.Days.Contains(now.DayOfWeek);
        return t < c.To && c.Days.Contains(now.AddDays(-1).DayOfWeek);
    }
}
