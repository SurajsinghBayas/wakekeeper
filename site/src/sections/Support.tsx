import NumberFlow from "@number-flow/react";
import { useInView } from "motion/react";
import { useRef } from "react";
import { BookOpen, Bug, Mail } from "lucide-react";
import { CopyButton } from "../components/Copy";
import { release } from "../lib/release";
import { useStats, type Stats } from "../lib/stats";

const counters: { key: keyof Stats; label: string }[] = [
  { key: "downloads", label: "Downloads" },
  { key: "requests", label: "Support requests" },
  { key: "resolved", label: "Resolved" },
  { key: "stars", label: "GitHub stars" },
];

/** Live counters from GitHub. They count up from zero the first time they scroll into view. */
export function StatsStrip() {
  const ref = useRef<HTMLDListElement>(null);
  const seen = useInView(ref, { once: true, margin: "-60px" });
  const stats = useStats();

  return (
    <section aria-label="WakeKeeper in numbers" className="border-b border-slate-200 bg-white">
      <dl ref={ref} className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4">
        {counters.map((c) => (
          <div key={c.key} className="flex flex-col gap-1 bg-white px-4 py-7 sm:px-6">
            <dt className="text-sm text-slate-500">{c.label}</dt>
            <dd className="text-3xl font-semibold tabular-nums">
              {stats ? <NumberFlow value={seen ? stats[c.key] : 0} /> : <span className="text-slate-300">—</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const mailto = `mailto:${release.supportEmail}?subject=${encodeURIComponent(`WakeKeeper ${release.version} support`)}&body=${encodeURIComponent(
  "What happened:\n\nWhat I expected:\n\nWindows version (Settings › System › About):\n\n",
)}`;

export function Support() {
  return (
    <section id="support" className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-xs text-sky-700">Support</p>
          <h2 className="mt-3 text-3xl font-semibold text-balance sm:text-4xl">Stuck? A real person answers.</h2>
          <p className="mt-4 text-pretty text-slate-600">
            Email is the quickest way to get help. Tell us your Windows version and what happened. If you can, turn on{" "}
            <span className="font-medium text-slate-800">Feedback &amp; Support › Debug Mode</span> in the tray menu, try again,
            and attach the debug log.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="flex min-w-0 flex-col rounded-2xl border border-sky-200 bg-white p-6 md:col-span-1">
            <span className="grid size-10 place-items-center rounded-xl bg-sky-600 text-white">
              <Mail className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 font-medium">Email support</h3>
            <div className="mt-1 flex min-w-0 items-center gap-1">
              <a href={mailto} className="truncate text-sky-700 underline-offset-4 hover:underline">
                {release.supportEmail}
              </a>
              <CopyButton value={release.supportEmail} label="Copy support email" toastMessage="Email address copied" />
            </div>
            <p className="mt-2 text-sm text-pretty text-slate-600">Questions, problems, ideas. Usually answered within a day or two.</p>
            <a
              href={mailto}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-sky-600 px-4 text-sm font-medium text-white transition-[transform,background-color] duration-150 ease-out hover:bg-sky-700 active:scale-[0.97]"
            >
              <Mail className="size-4" aria-hidden />
              Write an email
            </a>
          </div>

          {release.issuesUrl && (
            <a
              href={release.issuesUrl}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                <Bug className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-medium">Report a bug on GitHub</h3>
              <p className="mt-2 text-sm text-pretty text-slate-600">Public and searchable, so the next person with the same problem finds the answer.</p>
              <span className="mt-auto pt-5 text-sm font-medium text-sky-700 group-hover:underline">Open an issue</span>
            </a>
          )}

          <a
            href={`${release.repo}#troubleshooting`}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-slate-200">
              <BookOpen className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 font-medium">Troubleshooting guide</h3>
            <p className="mt-2 text-sm text-pretty text-slate-600">Fixes for the common ones: SmartScreen, hot keys, sleep settings, company PCs.</p>
            <span className="mt-auto pt-5 text-sm font-medium text-sky-700 group-hover:underline">Read the guide</span>
          </a>
        </div>
      </div>
    </section>
  );
}
