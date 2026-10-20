const features = [
  {
    name: "Sessions that end themselves",
    body: "Keep awake indefinitely, for a number of minutes or hours, or until a specific time. Extend a running session from the menu.",
    tech: "SetThreadExecutionState",
  },
  {
    name: "While an app runs",
    body: "Pick any open app. The session ends the moment it quits, which is handy for renders, game installs and long video calls.",
    tech: "Process watch, 1 s",
  },
  {
    name: "While a download finishes",
    body: "Watches your Downloads folder for in-progress Chrome, Edge, Firefox and torrent files, and ends 15 seconds after the last one completes.",
    tech: "*.crdownload, *.part",
  },
  {
    name: "Triggers",
    body: "Rules that start a session automatically when every condition is true: app running, plugged in, battery level, Wi-Fi network, schedule, idle time, CPU load, or a drive being connected.",
    tech: "Evaluated every 5 s",
  },
  {
    name: "Lid closed mode",
    body: "Keep a laptop running with the lid shut. The original lid action is saved first and restored when the session ends, even after a crash.",
    tech: "powercfg LIDACTION",
  },
  {
    name: "Battery safety",
    body: "End a session below a charge level, end it when the charger is unplugged, and start a new one when it's plugged back in.",
    tech: "PowerStatus",
  },
  {
    name: "Idle helpers",
    body: "Nudge the cursor by one pixel so chat apps don't mark you away, or lock the screen after a period of real inactivity.",
    tech: "SendInput, LockWorkStation",
  },
  {
    name: "Drive Alive",
    body: "Stops external drives from spinning down by writing a tiny hidden file to them at an interval you choose.",
    tech: ".wakekeeper-drivealive",
  },
  {
    name: "Global hot keys",
    body: "Ctrl + Alt + A starts or ends a session from anywhere. You can set another key to toggle display sleep.",
    tech: "RegisterHotKey",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-stone-200 dark:border-stone-800">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_2fr] lg:py-28">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-3xl font-semibold text-balance">Everything a keep-awake app should do, and nothing else.</h2>
          <p className="mt-4 text-pretty text-stone-600 dark:text-stone-400">
            A single small app with no installer, no account and no background service. It uses Windows' own power APIs, so
            Windows reports exactly why your PC is staying awake.
          </p>
        </div>
        <dl className="min-w-0 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
          {features.map((f) => (
            <div key={f.name} className="grid gap-x-6 gap-y-1 py-5 sm:grid-cols-[1fr_auto]">
              <dt className="font-medium">{f.name}</dt>
              <dd className="font-mono text-xs text-stone-400 sm:row-span-2 sm:pt-1 sm:text-right">{f.tech}</dd>
              <dd className="text-pretty text-stone-600 dark:text-stone-400">{f.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
