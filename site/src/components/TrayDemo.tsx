import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import {
  BatteryMedium,
  Check,
  ChevronRight,
  ChevronUp,
  Folder,
  Globe,
  LayoutGrid,
  Search,
  SquareTerminal,
  Volume2,
  Wifi,
} from "lucide-react";
import { AppTile, CupIcon } from "./CupIcon";
import { cn } from "../lib/utils";

type Session = { label: string; endsAt: number | null };
type SubmenuKey = "minutes" | "hours" | "apps";
type Notice = { id: number; title: string; body: string };

const FLUENT = [0, 0, 0, 1] as const; // Windows 11 decelerate curve
const MINUTES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 24];
const APPS = ["WindowsTerminal", "Code", "chrome", "Teams", "obs64"];

const AGENT_LINES = [
  "› agent: reading 214 files in src/",
  "› agent: planning refactor of auth module",
  "› edit src/auth/session.ts (+48 −31)",
  "› edit src/auth/tokens.ts (+12 −9)",
  "› running test suite…",
  "  ✓ 312 passed  ✗ 0 failed",
  "› agent: opening pull request",
  "› agent: next task: migrate billing webhooks",
];
const VISIBLE_LINES = 5;

function clock(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** A working replica of WakeKeeper's tray menu on a Windows 11 desktop. Nothing here touches the visitor's PC. */
export function TrayDemo() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { margin: "-80px" });

  const [menuOpen, setMenuOpen] = useState(true);
  const [submenu, setSubmenu] = useState<{ key: SubmenuKey; top: number } | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [lid, setLid] = useState(true);
  const [displaySleep, setDisplaySleep] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [tooltip, setTooltip] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [agentLine, setAgentLine] = useState(VISIBLE_LINES - 1);
  const tooltipTimer = useRef<number>(undefined);

  // Clock and session expiry are external time, so one interval drives both. It pauses off-screen.
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setSession((s) => (s?.endsAt && s.endsAt <= t ? null : s));
    }, 1000);
    return () => clearInterval(id);
  }, [inView]);

  // The agent keeps producing output only while the PC is being kept awake.
  useEffect(() => {
    if (!inView || !session || reduce) return;
    const id = setInterval(() => setAgentLine((n) => n + 1), 1400);
    return () => clearInterval(id);
  }, [inView, session, reduce]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 4200);
    return () => clearTimeout(id);
  }, [notice]);

  function start(label: string, minutes: number | null) {
    const endsAt = minutes ? Date.now() + minutes * 60_000 : null;
    setSession({ label, endsAt });
    setMenuOpen(false);
    setSubmenu(null);
    setNotice({ id: Date.now(), title: "Keeping your PC awake", body: endsAt ? `Until ${clock(endsAt)}` : label });
  }

  function end() {
    setSession(null);
    setMenuOpen(false);
    setNotice({ id: Date.now(), title: "Session ended", body: "Your PC can sleep normally again." });
  }

  const remaining = session?.endsAt ? Math.max(0, session.endsAt - now) : null;
  const h = remaining !== null ? Math.floor(remaining / 3_600_000) : 0;
  const m = remaining !== null ? Math.floor((remaining % 3_600_000) / 60_000) : 0;
  const s = remaining !== null ? Math.floor((remaining % 60_000) / 1000) : 0;
  const status = !session
    ? "Not keeping your PC awake"
    : remaining !== null
      ? `${h}h ${String(m).padStart(2, "0")}m left`
      : session.label;

  const submenuItems =
    submenu?.key === "minutes"
      ? MINUTES.map((n) => ({ label: `${n} minutes`, short: `${n}m`, run: () => start(`${n} minutes`, n) }))
      : submenu?.key === "hours"
        ? HOURS.map((n) => ({ label: n === 1 ? "1 hour" : `${n} hours`, short: `${n}h`, run: () => start(`${n} hours`, n * 60) }))
        : submenu?.key === "apps"
          ? APPS.map((a) => ({ label: a, short: a, run: () => start(`While ${a} is running`, null) }))
          : [];
  // Minutes and hours are long lists; two columns keep them inside the desktop.
  const twoColumns = submenuItems.length > 6;

  const openSub = (key: SubmenuKey, el: HTMLElement) => setSubmenu({ key, top: el.offsetTop });

  const lines = Array.from({ length: VISIBLE_LINES }, (_, i) => {
    const n = agentLine - (VISIBLE_LINES - 1) + i;
    return { n, text: AGENT_LINES[n % AGENT_LINES.length] };
  });

  return (
    <figure>
      <div
        ref={rootRef}
        role="region"
        aria-label="Interactive demo of WakeKeeper on a Windows desktop"
        className="relative isolate aspect-[4/5] w-full overflow-hidden rounded-2xl border border-slate-300 bg-slate-200 shadow-xl shadow-slate-900/10 select-none sm:aspect-[4/3]"
      >
        {/* Wallpaper: silver with a soft sky bloom. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_55%_at_72%_38%,var(--color-sky-300),transparent_70%),radial-gradient(50%_50%_at_20%_90%,var(--color-sky-100),transparent_70%),linear-gradient(180deg,var(--color-slate-100),var(--color-slate-300))]"
        />

        {/* Agent terminal window */}
        <div className="absolute top-[6%] left-[5%] w-[78%] overflow-hidden rounded-lg border border-slate-900/10 bg-slate-950/95 shadow-lg shadow-slate-900/25 sm:w-[54%]">
          <div className="flex h-7 items-center gap-2 border-b border-white/10 px-3 text-[11px] text-slate-400">
            <SquareTerminal className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">agent · ~/projects/api</span>
            <span className="ml-auto flex shrink-0 items-center gap-1.5">
              <span className={cn("size-1.5 rounded-full transition-colors", session ? "bg-emerald-400" : "bg-amber-400")} />
              {session ? "running" : "may sleep"}
            </span>
          </div>
          <div className="space-y-1 p-3 font-mono text-[10.5px] leading-tight text-slate-300 sm:text-[11px]">
            {lines.map((line, i) => (
              <motion.p
                key={line.n}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: i === VISIBLE_LINES - 1 ? 1 : 0.45 + i * 0.12 }}
                transition={{ duration: 0.3, ease: FLUENT }}
                className={cn("truncate", line.text.includes("✓") && "text-emerald-400")}
              >
                {line.text}
              </motion.p>
            ))}
          </div>
        </div>

        {/* Context menu (Windows 11 flyout) */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="menu"
              initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(14px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.28, ease: FLUENT }}
              className="absolute right-2 bottom-14 z-10 sm:right-5"
              onPointerLeave={() => setSubmenu(null)}
            >
              <div className="relative">
                <AnimatePresence>
                  {submenu && (
                    <motion.ul
                      key={submenu.key}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateX(8px)" }}
                      animate={{ opacity: 1, transform: "translateX(0px)" }}
                      exit={{ opacity: 0, transition: { duration: 0.08 } }}
                      transition={{ duration: 0.2, ease: FLUENT }}
                      style={{ top: twoColumns ? 0 : Math.max(0, submenu.top - 4) }}
                      className={cn(
                        "absolute right-[calc(100%+4px)] rounded-lg border border-slate-300/70 bg-white/95 p-1 text-[13px] shadow-[0_8px_24px_rgb(15_23_42/0.16)] backdrop-blur-md",
                        twoColumns ? "grid w-28 grid-cols-2 text-xs sm:w-56 sm:text-[13px]" : "w-36 sm:w-40",
                      )}
                    >
                      {submenuItems.map((item) => (
                        <li key={item.label}>
                          <Item onClick={item.run} compact={twoColumns}>
                            {twoColumns ? (
                              <>
                                <span className="sm:hidden">{item.short}</span>
                                <span className="hidden sm:inline">{item.label}</span>
                              </>
                            ) : (
                              item.label
                            )}
                          </Item>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>

                <div className="w-56 rounded-lg border border-slate-300/70 bg-white/95 p-1 text-[13px] shadow-[0_8px_24px_rgb(15_23_42/0.16)] backdrop-blur-md sm:w-64">
                  <div className="flex items-center gap-2 py-1.5 pr-3 pl-2 text-slate-500">
                    <AppTile className="size-4" />
                    <span className="truncate">
                      {session && remaining !== null ? (
                        <NumberFlowGroup>
                          <span className="tabular-nums">
                            <NumberFlow value={h} />h <NumberFlow value={m} format={{ minimumIntegerDigits: 2 }} />m{" "}
                            <NumberFlow value={s} format={{ minimumIntegerDigits: 2 }} />s left
                          </span>
                        </NumberFlowGroup>
                      ) : (
                        status
                      )}
                    </span>
                  </div>
                  {session && (
                    <Item onClick={end} onHover={() => setSubmenu(null)}>
                      End session
                    </Item>
                  )}
                  <Item checked={lid} onClick={() => setLid((v) => !v)} onHover={() => setSubmenu(null)}>
                    Keep running with lid closed
                  </Item>
                  <Divider />
                  <Item onClick={() => start("Indefinitely", null)} onHover={() => setSubmenu(null)}>
                    Indefinitely
                  </Item>
                  {(["minutes", "hours", "apps"] as const).map((key) => (
                    <Item
                      key={key}
                      hasSubmenu
                      active={submenu?.key === key}
                      onHover={(el) => openSub(key, el)}
                      onClick={(el) => (submenu?.key === key ? setSubmenu(null) : openSub(key, el))}
                    >
                      {key === "minutes" ? "Minutes" : key === "hours" ? "Hours" : "While app is running"}
                    </Item>
                  ))}
                  <Item onClick={() => start("While a file is downloading", null)} onHover={() => setSubmenu(null)}>
                    While file is downloading
                  </Item>
                  <Divider />
                  <Item checked={displaySleep} onClick={() => setDisplaySleep((v) => !v)} onHover={() => setSubmenu(null)}>
                    Allow display to sleep
                  </Item>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Windows 11 notification */}
        <AnimatePresence>
          {notice && !menuOpen && (
            <motion.div
              key={notice.id}
              role="status"
              initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateX(calc(100% + 24px))" }}
              animate={{ opacity: 1, transform: "translateX(0px)" }}
              exit={{ opacity: 0, transform: reduce ? "none" : "translateX(24px)", transition: { duration: 0.16 } }}
              transition={{ duration: 0.36, ease: FLUENT }}
              className="absolute right-2 bottom-14 z-10 w-64 rounded-lg border border-slate-300/70 bg-white/95 p-3 shadow-[0_8px_24px_rgb(15_23_42/0.16)] backdrop-blur-md sm:right-3 sm:w-72"
            >
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <AppTile className="size-4" />
                WakeKeeper
                <span className="ml-auto">now</span>
              </div>
              <p className="mt-2 text-[13px] font-semibold">{notice.title}</p>
              <p className="text-[13px] text-slate-600">{notice.body}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Taskbar */}
        <div className="absolute inset-x-0 bottom-0 flex h-12 items-center border-t border-white/60 bg-slate-100/85 px-2 text-slate-700 backdrop-blur-md">
          <div className="hidden flex-1 sm:block" />
          <div className="flex items-center gap-0.5" aria-hidden>
            {[LayoutGrid, Search, Folder, Globe, SquareTerminal].map((Icon, i) => (
              <span key={i} className={cn("relative grid size-9 place-items-center rounded-md", i === 4 && "bg-white/70")}>
                <Icon className={cn("size-[18px]", i === 0 ? "text-sky-600" : "text-slate-600")} />
                {i === 4 && <span className="absolute bottom-0.5 h-[3px] w-3 rounded-full bg-sky-600" />}
              </span>
            ))}
          </div>
          <div className="flex flex-1 items-center justify-end gap-0.5">
            <ChevronUp className="mx-1 hidden size-4 sm:block" aria-hidden />
            <div className="relative">
              <AnimatePresence>
                {tooltip && !menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, transform: "translateY(4px)" }}
                    animate={{ opacity: 1, transform: "translateY(0px)" }}
                    exit={{ opacity: 0, transition: { duration: 0.08 } }}
                    transition={{ duration: 0.15, ease: FLUENT }}
                    className="pointer-events-none absolute right-0 bottom-[calc(100%+10px)] z-10 rounded-md border border-slate-300 bg-white px-2 py-1 text-[12px] whitespace-nowrap text-slate-700 shadow-md"
                  >
                    WakeKeeper · {status}
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                type="button"
                aria-label={session ? "WakeKeeper tray icon: end session" : "WakeKeeper tray icon: start session"}
                aria-pressed={!!session}
                onClick={() => (session ? end() : start("Indefinitely", null))}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setTooltip(false);
                  setSubmenu(null);
                  setMenuOpen((v) => !v);
                }}
                onPointerEnter={() => {
                  window.clearTimeout(tooltipTimer.current);
                  tooltipTimer.current = window.setTimeout(() => setTooltip(true), 450);
                }}
                onPointerLeave={() => {
                  window.clearTimeout(tooltipTimer.current);
                  setTooltip(false);
                }}
                className={cn(
                  "grid size-9 place-items-center rounded-md transition-[transform,background-color] duration-150 ease-out hover:bg-slate-900/5 active:scale-[0.92]",
                  menuOpen && "bg-slate-900/5",
                )}
              >
                <CupIcon active={!!session} />
              </button>
            </div>
            <span className="hidden items-center gap-2 px-2 sm:flex" aria-hidden>
              <Wifi className="size-4" />
              <Volume2 className="size-4" />
              <BatteryMedium className="size-4" />
            </span>
            <span className="px-1.5 text-right text-[11px] leading-tight tabular-nums">
              {clock(now)}
              <br />
              {new Date(now).toLocaleDateString([], { day: "numeric", month: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 flex min-h-8 flex-wrap items-center justify-between gap-2 text-sm text-pretty text-slate-500">
        <span>Click the cup to start or stop. Right-click it for the menu.</span>
        {!menuOpen && (
          <button type="button" onClick={() => setMenuOpen(true)} className="rounded-md px-2 py-1 text-sky-700 transition-colors hover:bg-sky-50">
            Open menu
          </button>
        )}
      </figcaption>
    </figure>
  );
}

function Item({
  children,
  onClick,
  onHover,
  hasSubmenu,
  active,
  checked,
  compact,
}: {
  children: React.ReactNode;
  onClick: (el: HTMLButtonElement) => void;
  onHover?: (el: HTMLButtonElement) => void;
  hasSubmenu?: boolean;
  active?: boolean;
  checked?: boolean;
  /** Drops the check column so short labels fit in narrow, multi-column submenus. */
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => onClick(e.currentTarget)}
      onPointerEnter={(e) => e.pointerType === "mouse" && onHover?.(e.currentTarget)}
      aria-expanded={hasSubmenu ? active : undefined}
      aria-pressed={checked}
      className={cn(
        "flex h-8 w-full items-center gap-2 rounded-[5px] px-2 text-left text-slate-800 transition-colors duration-75 hover:bg-slate-900/[0.06]",
        active && "bg-slate-900/[0.06]",
      )}
    >
      {!compact && <Check className={cn("size-3.5 shrink-0 text-sky-600", !checked && "invisible")} aria-hidden />}
      <span className="flex-1 truncate">{children}</span>
      {hasSubmenu && <ChevronRight className="size-3.5 text-slate-400" aria-hidden />}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 my-1 h-px bg-slate-200" role="separator" />;
}
