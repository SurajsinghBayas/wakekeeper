import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { Check, ChevronRight, Volume2, Wifi, BatteryMedium, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { CupIcon } from "./CupIcon";
import { cn } from "../lib/utils";

type Session = { label: string; endsAt: number | null };
type Submenu = "minutes" | "hours" | "apps" | null;

const MINUTES = [5, 10, 15, 30, 45];
const HOURS = [1, 2, 3, 4, 6, 8, 12, 24];
const APPS = ["chrome", "Teams", "vlc", "obs64"];

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** A working replica of WakeKeeper's tray menu. It runs entirely in the page: nothing here touches the visitor's PC. */
export function TrayDemo() {
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(true);
  const [submenu, setSubmenu] = useState<Submenu>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [displaySleep, setDisplaySleep] = useState(false);
  const [triggers, setTriggers] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  // A ticking clock is genuinely external state, so an effect is the right tool here.
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setSession((s) => (s?.endsAt && s.endsAt <= t ? null : s));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = session?.endsAt ? Math.max(0, session.endsAt - now) : null;

  function start(label: string, minutes: number | null) {
    const endsAt = minutes ? Date.now() + minutes * 60_000 : null;
    setSession({ label, endsAt });
    setSubmenu(null);
    toast("Session started", { description: endsAt ? `Until ${formatTime(endsAt)}` : label });
  }

  function end() {
    setSession(null);
    toast("Session ended", { description: "Your PC can sleep normally again." });
  }

  const h = remaining !== null ? Math.floor(remaining / 3_600_000) : 0;
  const m = remaining !== null ? Math.floor((remaining % 3_600_000) / 60_000) : 0;
  const s = remaining !== null ? Math.floor((remaining % 60_000) / 1000) : 0;

  const submenuItems =
    submenu === "minutes"
      ? MINUTES.map((n) => ({ label: `${n} minutes`, run: () => start(`${n} minutes`, n) }))
      : submenu === "hours"
        ? HOURS.map((n) => ({ label: n === 1 ? "1 hour" : `${n} hours`, run: () => start(`${n} hours`, n * 60) }))
        : submenu === "apps"
          ? APPS.map((a) => ({ label: a, run: () => start(`While ${a} is running`, null) }))
          : [];

  return (
    <figure>
    <div
      className="relative isolate aspect-[4/5] w-full overflow-hidden rounded-2xl border border-stone-300 bg-stone-200 shadow-sm sm:aspect-[4/3] dark:border-stone-800 dark:bg-stone-900"
      aria-label="Interactive demo of the WakeKeeper tray menu"
      role="region"
    >
      {/* Desktop wallpaper: flat tone with a faint dot grid, no gradients. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-50 [background-image:radial-gradient(var(--color-stone-400)_1px,transparent_1px)] [background-size:20px_20px] dark:opacity-20"
      />

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="menu"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(6px) scale(0.98)" }}
            animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-3 bottom-14 z-10 flex origin-bottom-right items-end gap-1.5 sm:right-6"
          >
            <AnimatePresence mode="popLayout">
              {submenu && (
                <motion.ul
                  key={submenu}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateX(6px)" }}
                  animate={{ opacity: 1, transform: "translateX(0px)" }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  className="w-32 rounded-lg border border-stone-200 bg-white p-1 text-[13px] shadow-lg dark:border-stone-700 dark:bg-stone-800"
                >
                  {submenuItems.map((item) => (
                    <li key={item.label}>
                      <MenuButton onClick={item.run}>{item.label}</MenuButton>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>

            <div className="w-56 rounded-lg border border-stone-200 bg-white p-1 text-[13px] shadow-lg sm:w-60 dark:border-stone-700 dark:bg-stone-800">
              <div className="py-1.5 pr-2.5 pl-8 text-stone-500 dark:text-stone-400">
                {session ? (
                  <span className="block truncate">
                    {remaining !== null ? (
                      <NumberFlowGroup>
                        <span className="tabular-nums">
                          <NumberFlow value={h} />h <NumberFlow value={m} format={{ minimumIntegerDigits: 2 }} />m{" "}
                          <NumberFlow value={s} format={{ minimumIntegerDigits: 2 }} />s left
                        </span>
                      </NumberFlowGroup>
                    ) : (
                      session.label === "indefinite" ? "Indefinitely" : session.label
                    )}
                  </span>
                ) : (
                  "Not keeping your PC awake"
                )}
              </div>
              {session && <MenuButton onClick={end}>End Session</MenuButton>}
              <Separator />
              <div className="py-1 pr-2.5 pl-8 text-[11px] font-medium text-stone-400 uppercase">Start new session</div>
              <MenuButton onClick={() => start("indefinite", null)}>Indefinitely</MenuButton>
              <MenuButton submenu active={submenu === "minutes"} onClick={() => setSubmenu(submenu === "minutes" ? null : "minutes")}>
                Minutes
              </MenuButton>
              <MenuButton submenu active={submenu === "hours"} onClick={() => setSubmenu(submenu === "hours" ? null : "hours")}>
                Hours
              </MenuButton>
              <MenuButton submenu active={submenu === "apps"} onClick={() => setSubmenu(submenu === "apps" ? null : "apps")}>
                While App is Running
              </MenuButton>
              <MenuButton onClick={() => start("While a file is downloading", null)}>While File is Downloading</MenuButton>
              <Separator />
              <MenuButton checked={displaySleep} onClick={() => setDisplaySleep((v) => !v)}>
                Allow display sleep
              </MenuButton>
              <MenuButton checked={triggers} onClick={() => setTriggers((v) => !v)}>
                Triggers
              </MenuButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Taskbar */}
      <div className="absolute inset-x-0 bottom-0 flex h-11 items-center justify-end gap-1 border-t border-stone-300 bg-stone-100 px-2 text-stone-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400">
        <ChevronUp className="size-4" aria-hidden />
        <button
          type="button"
          aria-label={session ? "WakeKeeper tray icon: end session" : "WakeKeeper tray icon: start session"}
          aria-pressed={!!session}
          onClick={() => (session ? end() : start("indefinite", null))}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenuOpen((v) => !v);
            setSubmenu(null);
          }}
          className="grid size-8 place-items-center rounded-md transition-[transform,background-color] duration-150 ease-out hover:bg-stone-200 active:scale-[0.94] dark:hover:bg-stone-800"
        >
          <CupIcon active={!!session} />
        </button>
        <Wifi className="mx-1 size-4" aria-hidden />
        <Volume2 className="mx-1 size-4" aria-hidden />
        <BatteryMedium className="mx-1 size-4" aria-hidden />
        <span className="ml-2 font-mono text-[11px] tabular-nums">{formatTime(now)}</span>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="ml-2 rounded-md px-2 py-1 text-[11px] hover:bg-stone-200 dark:hover:bg-stone-800"
        >
          {menuOpen ? "Hide menu" : "Show menu"}
        </button>
      </div>
    </div>
    <figcaption className="mt-3 text-sm text-pretty text-stone-500">
      Try it: pick a duration, or click the cup in the taskbar to toggle a session. Right-click the cup to show or hide the menu.
    </figcaption>
    </figure>
  );
}

function MenuButton({
  children,
  onClick,
  submenu,
  active,
  checked,
}: {
  children: React.ReactNode;
  onClick: () => void;
  submenu?: boolean;
  active?: boolean;
  checked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={submenu ? active : undefined}
      aria-pressed={checked}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-stone-800 transition-colors duration-100 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-700",
        active && "bg-stone-100 dark:bg-stone-700",
      )}
    >
      <Check className={cn("size-3.5 shrink-0 text-amber-700 dark:text-amber-500", !checked && "invisible")} aria-hidden />
      <span className="flex-1 truncate">{children}</span>
      {submenu && <ChevronRight className="size-3.5 text-stone-400" aria-hidden />}
    </button>
  );
}

function Separator() {
  return <div className="my-1 h-px bg-stone-200 dark:bg-stone-700" role="separator" />;
}
