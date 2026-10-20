import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { BatteryCharging, CircleCheck, GitPullRequest, Moon, RotateCcw, SquareTerminal } from "lucide-react";
import { cn } from "../lib/utils";

const FLUENT = [0, 0, 0, 1] as const;
const TOTAL = 312;

const points = [
  {
    icon: Moon,
    title: "Only while a session runs",
    body: "WakeKeeper sets the lid action to “Do nothing” when a session starts and puts your own setting back when it ends.",
  },
  {
    icon: RotateCcw,
    title: "Safe even if something crashes",
    body: "Your original setting is saved before anything changes. If the PC restarts mid-session, it's restored on the next launch.",
  },
  {
    icon: BatteryCharging,
    title: "Battery guard",
    body: "Optionally end the session below a charge level or when the charger is unplugged, so a closed laptop never runs flat.",
  },
];

/** "No fear of closing your laptop": the lid folds shut on scroll while the agent keeps reporting progress. */
export function LidClosed() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-120px" });
  const seen = useInView(ref, { once: true, margin: "-120px" });
  const reduce = useReducedMotion();
  const [closed, setClosed] = useState(false);
  const [tests, setTests] = useState(184);

  useEffect(() => {
    if (!seen) return;
    const id = setTimeout(() => setClosed(true), 900);
    return () => clearTimeout(id);
  }, [seen]);

  // The run keeps progressing while the lid is shut, then finishes.
  useEffect(() => {
    if (!inView || !closed) return;
    if (reduce) {
      setTests(TOTAL);
      return;
    }
    const id = setInterval(() => setTests((n) => Math.min(TOTAL, n + 4)), 140);
    return () => clearInterval(id);
  }, [inView, closed, reduce]);

  function toggle() {
    if (closed) setTests(184);
    setClosed((c) => !c);
  }

  const finished = tests >= TOTAL;

  return (
    <section className="border-b border-slate-200 bg-slate-900 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <div>
          <p className="font-mono text-xs text-sky-300">Lid-closed mode</p>
          <h2 className="mt-3 text-3xl font-semibold text-balance sm:text-4xl">No fear of closing your laptop.</h2>
          <p className="mt-4 max-w-md text-pretty text-slate-300">
            Start a long agent run, a render or an overnight backup, close the lid and walk away. Windows normally sleeps the
            moment the lid shuts. With WakeKeeper, the work carries on.
          </p>
          <ul className="mt-8 space-y-5">
            {points.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white/5 ring-1 ring-white/10">
                  <p.icon className="size-4 text-sky-300" aria-hidden />
                </span>
                <span>
                  <span className="block font-medium">{p.title}</span>
                  <span className="mt-0.5 block text-sm text-pretty text-slate-400">{p.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div ref={ref}>
          <div className="relative mx-auto aspect-[16/11] w-full max-w-lg">
            {/* Notifications that keep arriving while the lid is shut. */}
            <div className="absolute inset-x-[8%] top-[4%] z-10 space-y-2" aria-live="polite">
              <AnimatePresence>
                {closed && (
                  <motion.div
                    key="progress"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(-10px) scale(0.98)" }}
                    animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.4, ease: FLUENT, delay: reduce ? 0 : 0.8 }}
                    className="flex items-center gap-3 rounded-xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur-sm"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-950 ring-1 ring-white/10">
                      <SquareTerminal className="size-4 text-sky-300" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">Agent still running</span>
                      <span className="block truncate text-xs text-slate-300 tabular-nums">
                        migrate billing · tests {tests}/{TOTAL}
                      </span>
                    </span>
                    <span className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
                      <span
                        className="block h-full origin-left rounded-full bg-sky-400 transition-transform duration-150"
                        style={{ transform: `scaleX(${tests / TOTAL})` }}
                      />
                    </span>
                  </motion.div>
                )}
                {closed && finished && (
                  <motion.div
                    key="done"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(-10px) scale(0.98)" }}
                    animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.4, ease: FLUENT }}
                    className="flex items-center gap-3 rounded-xl bg-emerald-400/10 p-3 ring-1 ring-emerald-400/30"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-400/15">
                      <GitPullRequest className="size-4 text-emerald-300" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-emerald-200">Pull request #418 opened</span>
                      <span className="block truncate text-xs text-emerald-300/80">All {TOTAL} tests passed, lid closed the whole time</span>
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Laptop, front view. The lid folds down onto the base around its bottom edge. */}
            <div className="absolute inset-x-0 bottom-[8%] flex flex-col items-center">
              <motion.div
                aria-hidden
                initial={false}
                animate={{ transform: closed ? "scaleY(0.045)" : "scaleY(1)" }}
                transition={reduce ? { duration: 0 } : { duration: 0.9, ease: [0.77, 0, 0.175, 1] }}
                style={{ transformOrigin: "50% 100%" }}
                className="aspect-[16/10] w-[78%] rounded-t-[14px] bg-gradient-to-b from-slate-200 to-slate-400 p-[2.2%] shadow-[0_-1px_0_rgb(255_255_255/0.6)_inset]"
              >
                <div
                  className={cn(
                    "h-full rounded-[6px] bg-slate-950 p-[4%] font-mono text-[10px] leading-relaxed text-slate-300 transition-opacity duration-300 sm:text-[11px]",
                    closed && "opacity-0",
                  )}
                >
                  <p className="text-sky-300">› agent run --task "migrate billing"</p>
                  <p>› reading 214 files…</p>
                  <p>› editing src/billing/webhooks.ts</p>
                  <p className="tabular-nums">› tests {tests}/{TOTAL}</p>
                </div>
              </motion.div>
              {/* Base with a front-edge notch and a status light. */}
              <div className="relative h-3 w-[92%] rounded-b-[10px] bg-gradient-to-b from-slate-300 to-slate-500 shadow-[0_18px_30px_-12px_rgb(0_0_0/0.6)]">
                <span className="absolute top-0 left-1/2 h-1 w-[14%] -translate-x-1/2 rounded-b-md bg-slate-500/70" />
                <span
                  className={cn(
                    "absolute top-1 right-[8%] size-1 rounded-full transition-colors duration-500",
                    closed ? "bg-sky-300 shadow-[0_0_6px_var(--color-sky-300)]" : "bg-slate-600",
                  )}
                />
              </div>
            </div>
          </div>

          <div className="mx-auto mt-6 flex max-w-lg flex-wrap items-center justify-between gap-3">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 transition-colors duration-300",
                closed ? "bg-sky-400/10 text-sky-200 ring-sky-400/30" : "bg-white/5 text-slate-300 ring-white/10",
              )}
            >
              <CircleCheck className="size-4" aria-hidden />
              {closed ? "Lid closed · PC awake · work continuing" : "Lid open · agent running"}
            </div>
            <button type="button" onClick={toggle} className="rounded-md px-2 py-1 text-sm text-sky-300 transition-colors hover:bg-white/5">
              {closed ? "Open the lid" : "Close the lid"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
