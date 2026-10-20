import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { BatteryCharging, CircleCheck, GitPullRequest, Moon, RotateCcw, SquareTerminal } from "lucide-react";
import { cn } from "../lib/utils";
import { CupIcon } from "../components/CupIcon";

const FLUENT = [0, 0, 0, 1] as const;
const TOTAL = 312;
/** Lid angle in degrees: 0 is shut, OPEN leans slightly back past upright. */
const OPEN = 108;
/** A hand pushing the lid down: slow start, gathering speed until it meets the base. */
const PUSH = [0.45, 0, 0.75, 0.25] as const;

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
  const angle = useMotionValue(OPEN);

  // Close with a small settle bounce on contact; reopen on a spring so the lid wobbles to rest.
  useEffect(() => {
    if (reduce) {
      angle.set(closed ? 0 : OPEN);
      return;
    }
    const controls = closed
      ? animate(angle, [angle.get(), 0, 2.2, 0], { duration: 1.15, times: [0, 0.78, 0.89, 1], ease: [PUSH, "easeOut", "easeIn"] })
      : animate(angle, OPEN, { type: "spring", stiffness: 110, damping: 13, mass: 1 });
    return () => controls.stop();
  }, [closed, reduce, angle]);

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
    if (!closed) setTests(184);
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
          <div className="relative mx-auto aspect-[10/9] w-full max-w-lg">
            {/* Notifications that keep arriving while the lid is shut. */}
            <div className="absolute inset-x-[8%] top-[2%] z-10 space-y-2" aria-live="polite">
              <AnimatePresence>
                {closed && (
                  <motion.div
                    key="progress"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(-10px) scale(0.98)" }}
                    animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.4, ease: FLUENT, delay: reduce ? 0 : 1.2 }}
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

            <Laptop angle={angle} tests={tests} closed={closed} finished={finished} />
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

const KEY_ROWS = [13, 13, 12, 11];

/**
 * A laptop in real 3D: the deck lies tilted away from the viewer and the lid swings on its back hinge.
 * The lid has two faces, the silver shell and the display, so either side shows correctly at any angle.
 */
function Laptop({ angle, tests, closed, finished }: { angle: MotionValue<number>; tests: number; closed: boolean; finished: boolean }) {
  const lid = useTransform(angle, (a) => `translateZ(2px) rotateX(${a}deg)`);
  // The display switches off as the lid nears the base and wakes on the way back up.
  const screenOn = useTransform(angle, [18, 55], [0, 1]);
  // Light from the display spills onto the keys as the gap narrows, then vanishes at contact.
  const spill = useTransform(angle, [0, 4, 45, OPEN], [0, 0.7, 0.28, 0.1]);
  const shadow = useTransform(angle, [0, OPEN], [0.55, 0.35]);

  return (
    <div aria-hidden className="absolute inset-0" style={{ perspective: "1700px", perspectiveOrigin: "50% 10%" }}>
      <div
        className="absolute inset-x-[13%] bottom-[2%] aspect-[16/10]"
        style={{ transformStyle: "preserve-3d", transform: "rotateX(57deg)" }}
      >
        {/* Contact shadow on the desk. */}
        <motion.div
          className="absolute -inset-x-[4%] -inset-y-[6%] rounded-[24px] bg-black blur-xl"
          style={{ transform: "translateZ(-14px)", opacity: shadow }}
        />

        {/* Deck: hinge, keyboard and trackpad. */}
        <div className="absolute inset-0 rounded-[12px] bg-gradient-to-b from-slate-300 to-slate-400 shadow-[inset_0_1px_0_rgb(255_255_255/0.5)]">
          <div className="absolute inset-x-[6%] top-0 h-[3%] rounded-b-sm bg-slate-500/80" />
          <div className="absolute inset-x-[7%] top-[9%] flex h-[50%] flex-col gap-[3%] rounded-md bg-slate-500/40 p-[1.5%]">
            {KEY_ROWS.map((n, r) => (
              <div key={r} className="flex flex-1 gap-[1.2%]">
                {Array.from({ length: n }, (_, k) => (
                  <span key={k} className="flex-1 rounded-[2px] bg-slate-800/85" />
                ))}
              </div>
            ))}
            <div className="flex flex-1 gap-[1.2%]">
              <span className="w-[12%] rounded-[2px] bg-slate-800/85" />
              <span className="w-[9%] rounded-[2px] bg-slate-800/85" />
              <span className="flex-1 rounded-[2px] bg-slate-800/85" />
              <span className="w-[9%] rounded-[2px] bg-slate-800/85" />
              <span className="w-[12%] rounded-[2px] bg-slate-800/85" />
            </div>
          </div>
          <div className="absolute top-[64%] left-1/2 h-[30%] w-[38%] -translate-x-1/2 rounded-md bg-slate-300 ring-1 ring-slate-500/40" />
          <motion.div className="absolute inset-0 rounded-[12px] bg-sky-300 mix-blend-screen" style={{ opacity: spill }} />
        </div>

        {/* Front edge, with the status light. */}
        <div
          className="absolute top-full right-0 left-0 h-[10px] rounded-b-[8px] bg-gradient-to-b from-slate-400 to-slate-600"
          style={{ transformOrigin: "50% 0%", transform: "rotateX(-90deg)" }}
        >
          <span className="absolute top-0 left-1/2 h-[45%] w-[14%] -translate-x-1/2 rounded-b-md bg-slate-600" />
          <span
            className={cn(
              "absolute top-1/2 right-[9%] size-1 -translate-y-1/2 rounded-full transition-colors duration-500",
              closed ? "animate-pulse bg-sky-300" : "bg-slate-700",
            )}
          />
        </div>

        {/* Lid, hinged on the back edge of the deck. */}
        <motion.div className="absolute inset-0" style={{ transformOrigin: "50% 0%", transformStyle: "preserve-3d", transform: lid }}>
          <div
            className="absolute inset-0 grid place-items-center rounded-[12px] bg-gradient-to-b from-slate-200 to-slate-300 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.45)]"
            style={{ backfaceVisibility: "hidden" }}
          >
            <CupIcon active={false} className="size-[14%] opacity-40" />
          </div>
          <div
            className="absolute inset-0 rounded-[12px] bg-slate-900 p-[2.5%] ring-1 ring-slate-400"
            style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg) translateZ(1px)" }}
          >
            <span className="absolute top-[1%] left-1/2 size-[3px] -translate-x-1/2 rounded-full bg-slate-700" />
            <motion.div
              className="h-full overflow-hidden rounded-[6px] bg-slate-950 p-[4%] font-mono text-[clamp(7px,2.2vw,11px)] leading-relaxed text-slate-300"
              style={{ opacity: screenOn }}
            >
              <p className="text-sky-300">› agent run --task "migrate billing"</p>
              <p>› reading 214 files…</p>
              <p>› editing src/billing/webhooks.ts</p>
              <p className="tabular-nums">› tests {tests}/{TOTAL}</p>
              {finished && <p className="text-emerald-300">› pull request #418 opened</p>}
              <p className="mt-1 h-[1.2em] w-[0.6em] animate-pulse bg-slate-400/80" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
