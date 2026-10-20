import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Minus, X } from "lucide-react";
import { AppTile } from "./CupIcon";
import { release } from "../lib/release";
import { cn } from "../lib/utils";

const FLUENT = [0, 0, 0, 1] as const;
const PAGES = ["welcome", "options", "installing", "finish"] as const;
type Page = (typeof PAGES)[number];

/** A click-through replica of the real setup wizard (NSIS, Modern UI) so people know what to expect. */
export function InstallerDemo() {
  const reduce = useReducedMotion();
  const [page, setPage] = useState<Page>("welcome");
  const [startup, setStartup] = useState(true);
  const [desktop, setDesktop] = useState(false);
  const [launch, setLaunch] = useState(true);
  const [done, setDone] = useState(false);
  const index = PAGES.indexOf(page);

  // The install step advances on its own, like the real wizard.
  useEffect(() => {
    if (page !== "installing") return;
    const id = setTimeout(() => setPage("finish"), reduce ? 400 : 2200);
    return () => clearTimeout(id);
  }, [page, reduce]);

  const next = () => (page === "finish" ? setDone(true) : setPage(PAGES[index + 1]));
  const back = () => setPage(PAGES[Math.max(0, index - 1)]);
  const restart = () => {
    setDone(false);
    setPage("welcome");
  };

  const sidePage = page === "welcome" || page === "finish";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xl shadow-slate-900/10">
      {/* Title bar */}
      <div className="flex h-9 items-center gap-2 border-b border-slate-200 bg-slate-50 pl-3 text-[12px] text-slate-700">
        <AppTile className="size-4" />
        <span className="truncate">WakeKeeper {release.version} Setup</span>
        <span className="ml-auto flex h-full" aria-hidden>
          <span className="grid w-11 place-items-center text-slate-500">
            <Minus className="size-3.5" />
          </span>
          <span className="grid w-11 place-items-center text-slate-500">
            <X className="size-3.5" />
          </span>
        </span>
      </div>

      <div className="relative h-[19rem] overflow-hidden sm:h-72">
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid h-full place-items-center bg-slate-50 p-6 text-center"
            >
              <div>
                <span className="mx-auto grid size-10 place-items-center rounded-full bg-sky-100 text-sky-700">
                  <Check className="size-5" aria-hidden />
                </span>
                <p className="mt-3 font-medium">Setup closed</p>
                <p className="mt-1 text-sm text-pretty text-slate-500">
                  {launch ? "WakeKeeper is now running. Look for the cup next to the clock." : "Open WakeKeeper from the Start menu whenever you need it."}
                </p>
                <button type="button" onClick={restart} className="mt-4 rounded-md px-2 py-1 text-sm text-sky-700 hover:bg-sky-50">
                  Replay setup
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={page}
              initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateX(16px)" }}
              animate={{ opacity: 1, transform: "translateX(0px)" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateX(-16px)" }}
              transition={{ duration: 0.22, ease: FLUENT }}
              className={cn("h-full", sidePage && "grid grid-cols-[6rem_1fr] sm:grid-cols-[9rem_1fr]")}
            >
              {sidePage && (
                <div className="grid place-items-center bg-sky-600">
                  <AppTile className="size-12 rounded-xl ring-2 ring-white/40 sm:size-16" />
                </div>
              )}

              {page === "welcome" && (
                <div className="p-5 sm:p-6">
                  <p className="text-lg font-semibold text-balance">Welcome to WakeKeeper</p>
                  <p className="mt-3 text-sm text-pretty text-slate-600">
                    WakeKeeper keeps your PC awake while AI agents, builds, downloads and backups run, even with the laptop lid
                    closed.
                  </p>
                  <p className="mt-3 text-sm text-pretty text-slate-600">
                    Setup takes a few seconds and doesn't need administrator rights.
                  </p>
                </div>
              )}

              {page === "options" && (
                <Inner title="Choose options" subtitle="Pick how WakeKeeper fits into Windows.">
                  <Option checked disabled label="WakeKeeper" hint="The tray app (required)" />
                  <Option checked={startup} onChange={setStartup} label="Start when I sign in to Windows" hint="Recommended" />
                  <Option checked={desktop} onChange={setDesktop} label="Desktop shortcut" />
                </Inner>
              )}

              {page === "installing" && (
                <Inner title="Installing" subtitle="Please wait while WakeKeeper is installed.">
                  <p className="truncate font-mono text-[12px] text-slate-500">Extract: WakeKeeper.exe</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full w-full origin-left rounded-full bg-sky-600"
                      style={{ animation: `${reduce ? "none" : "progress 2s cubic-bezier(0.4,0,0.2,1) forwards"}` }}
                    />
                  </div>
                  <style>{`@keyframes progress{from{transform:scaleX(0.04)}to{transform:scaleX(1)}}`}</style>
                </Inner>
              )}

              {page === "finish" && (
                <div className="p-5 sm:p-6">
                  <p className="text-lg font-semibold text-balance">WakeKeeper is installed</p>
                  <p className="mt-3 text-sm text-pretty text-slate-600">
                    WakeKeeper opens its window when you click Finish. After you close it, it stays next to the clock as a cup: click
                    it to keep your PC awake, right-click for timers and lid-closed mode.
                  </p>
                  <div className="mt-4">
                    <Option checked={launch} onChange={setLaunch} label="Start WakeKeeper now" />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Button bar */}
      <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
        <span className="mr-auto hidden text-[12px] text-slate-400 tabular-nums sm:inline">
          {done ? "" : `Step ${index + 1} of ${PAGES.length}`}
        </span>
        <WinButton onClick={back} disabled={done || index === 0 || page === "installing"}>
          Back
        </WinButton>
        <WinButton primary onClick={next} disabled={done || page === "installing"}>
          {page === "finish" ? "Finish" : page === "options" ? "Install" : "Next"}
        </WinButton>
        <WinButton onClick={restart} disabled={page === "welcome" && !done}>
          {done ? "Replay" : "Cancel"}
        </WinButton>
      </div>
    </div>
  );
}

function Inner({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="truncate text-[12px] text-slate-500">{subtitle}</p>
        </div>
        <AppTile className="size-8" />
      </div>
      <div className="space-y-1 p-5">{children}</div>
    </div>
  );
}

function Option({
  checked,
  onChange,
  disabled,
  label,
  hint,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left text-sm transition-colors enabled:hover:bg-slate-100 disabled:text-slate-500"
    >
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-[4px] border transition-colors duration-100",
          checked ? "border-sky-600 bg-sky-600 text-white" : "border-slate-400 bg-white",
          disabled && "opacity-60",
        )}
      >
        {checked && <Check className="size-3" strokeWidth={3} aria-hidden />}
      </span>
      <span className="min-w-0 truncate">{label}</span>
      {hint && <span className="ml-auto shrink-0 text-[12px] text-slate-400">{hint}</span>}
    </button>
  );
}

function WinButton({ primary, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "h-8 min-w-20 rounded-[5px] border px-3 text-[13px] transition-[transform,background-color] duration-100 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
        primary ? "border-sky-700 bg-sky-600 text-white hover:bg-sky-700" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
        className,
      )}
      {...props}
    />
  );
}
