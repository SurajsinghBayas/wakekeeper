namespace WakeKeeper;

internal static class Program
{
    [STAThread]
    private static void Main(string[] args)
    {
        // "--quit" is used by the installer and uninstaller to close a running copy gracefully,
        // so an active lid-closed session restores the user's power plan before files are replaced.
        if (args.Contains("--quit", StringComparer.OrdinalIgnoreCase))
        {
            InstanceSignals.Send(InstanceSignals.QuitName);
            return;
        }

        using var mutex = new Mutex(initiallyOwned: true, @"Local\WakeKeeper.SingleInstance", out bool first);
        if (!first)
        {
            // Already running (maybe hidden behind ^ in the taskbar): bring its window to the front instead.
            InstanceSignals.Send(InstanceSignals.ShowName);
            return;
        }

        ApplicationConfiguration.Initialize();
        using var signals = new InstanceSignals();
        bool background = args.Contains("--background", StringComparer.OrdinalIgnoreCase);
        Application.Run(new TrayApp(signals, showWindow: !background));
    }
}

/// <summary>Named events that let a second launch talk to the running instance.</summary>
internal sealed class InstanceSignals : IDisposable
{
    public const string QuitName = @"Local\WakeKeeper.Quit";
    public const string ShowName = @"Local\WakeKeeper.Show";

    private readonly EventWaitHandle _quit = new(false, EventResetMode.AutoReset, QuitName);
    private readonly EventWaitHandle _show = new(false, EventResetMode.AutoReset, ShowName);
    private readonly List<RegisteredWaitHandle> _waits = new();

    public void Listen(Action onQuit, Action onShow)
    {
        _waits.Add(ThreadPool.RegisterWaitForSingleObject(_quit, (_, _) => onQuit(), null, Timeout.Infinite, executeOnlyOnce: false));
        _waits.Add(ThreadPool.RegisterWaitForSingleObject(_show, (_, _) => onShow(), null, Timeout.Infinite, executeOnlyOnce: false));
    }

    public static void Send(string name)
    {
        if (EventWaitHandle.TryOpenExisting(name, out var handle))
            using (handle) handle.Set();
    }

    public void Dispose()
    {
        foreach (var w in _waits) w.Unregister(null);
        _quit.Dispose();
        _show.Dispose();
    }
}
