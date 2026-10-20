import { BrainCircuit, Bot, Clapperboard, CloudDownload, DatabaseBackup, Gamepad2, MonitorPlay, Network, Presentation } from "lucide-react";

const cases = [
  {
    icon: Bot,
    title: "AI coding agents",
    body: "Claude Code, Codex, Cursor and other agents can run for hours on a refactor or a test fix. If the PC sleeps, the run dies and the work is lost.",
    setup: "While app is running → WindowsTerminal",
  },
  {
    icon: Network,
    title: "Remote and SSH sessions",
    body: "Keep a machine reachable over Remote Desktop, SSH or Tailscale while you work on it from somewhere else.",
    setup: "Indefinitely + lid closed",
  },
  {
    icon: CloudDownload,
    title: "Big downloads and updates",
    body: "Game installs, model weights, OS images. The session ends on its own about 15 seconds after the last download finishes.",
    setup: "While file is downloading",
  },
  {
    icon: Clapperboard,
    title: "Renders and exports",
    body: "Video exports, 3D renders and long compiles that would otherwise stop halfway through the night.",
    setup: "While app is running → your renderer",
  },
  {
    icon: DatabaseBackup,
    title: "Backups and sync",
    body: "Let OneDrive, a NAS backup or a cloud sync finish with the lid closed and the laptop in its dock.",
    setup: "Trigger: power adapter + 1–6 am",
  },
  {
    icon: Presentation,
    title: "Presentations and calls",
    body: "Your screen never dims halfway through a slide, a screen share or a long call.",
    setup: "1 hour, display stays on",
  },
  {
    icon: MonitorPlay,
    title: "Dashboards and kiosks",
    body: "Monitoring walls, build radiators and shop displays that should stay on during working hours.",
    setup: "Trigger: schedule 9 am–6 pm",
  },
  {
    icon: BrainCircuit,
    title: "Model training and data jobs",
    body: "Fine-tunes, evals, scrapers and ETL scripts that run for hours and can't resume after a sleep.",
    setup: "While app is running → python",
  },
  {
    icon: Gamepad2,
    title: "Game servers and streams",
    body: "Host a match or a stream from a laptop without Windows putting it to sleep under you.",
    setup: "While app is running → obs64",
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-xs text-sky-700">Use cases</p>
          <h2 className="mt-3 text-3xl font-semibold text-balance sm:text-4xl">For the jobs that should finish while you're away.</h2>
          <p className="mt-4 text-pretty text-slate-600">
            Windows decides you're gone after a few idle minutes and puts everything to sleep. Here's where WakeKeeper helps, and
            the setting to use for each one.
          </p>
        </div>

        <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {cases.map((c, i) => (
            <li key={c.title} className={i === 0 ? "bg-sky-50 sm:col-span-2 lg:col-span-2 lg:row-span-2" : "bg-white"}>
              <div className="flex h-full flex-col p-5 sm:p-6">
                <span className={i === 0 ? "grid size-11 place-items-center rounded-xl bg-sky-600 text-white" : "grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200"}>
                  <c.icon className={i === 0 ? "size-5" : "size-4"} aria-hidden />
                </span>
                <h3 className={i === 0 ? "mt-5 text-2xl font-semibold text-balance" : "mt-4 font-medium"}>{c.title}</h3>
                <p className={i === 0 ? "mt-2 max-w-md text-pretty text-slate-600" : "mt-1.5 text-sm text-pretty text-slate-600"}>{c.body}</p>
                {i === 0 && (
                  <p className="mt-4 max-w-md text-sm text-pretty text-slate-600">
                    Point WakeKeeper at the terminal the agent runs in. It keeps the PC awake for exactly as long as that window is
                    open, and with lid-closed mode you can shut the laptop and come back to a finished pull request.
                  </p>
                )}
                <p className="mt-auto pt-5 font-mono text-[11px] text-slate-500">
                  <span className="text-slate-400">Set up: </span>
                  {c.setup}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
