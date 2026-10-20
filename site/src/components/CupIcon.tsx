import { cn } from "../lib/utils";

/** The tray glyph the Windows app draws: a filled mug with steam while awake, an outline when idle. */
export function CupIcon({ active, className }: { active: boolean; className?: string }) {
  const stroke = active ? "stroke-sky-600" : "stroke-slate-500";
  return (
    <svg viewBox="0 0 32 32" fill="none" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("size-5", className)}>
      <path
        d="M5 13h16v6a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"
        className={cn("transition-[fill,stroke] duration-200", stroke, active ? "fill-sky-600" : "fill-transparent")}
      />
      <path d="M21 15.5h1.5a3.5 3.5 0 0 1 0 7H21" className={cn("transition-[stroke] duration-200", stroke)} />
      <path
        d="M10.5 10c-1.5-1.5 1.5-2.5 0-5M15.5 10c-1.5-1.5 1.5-2.5 0-5"
        className={cn("stroke-sky-600 transition-[opacity,transform] duration-300 ease-out", active ? "opacity-100" : "translate-y-1 opacity-0")}
      />
    </svg>
  );
}

/** The full-colour app tile used in the installer, Start menu and notifications. */
export function AppTile({ className }: { className?: string }) {
  return <img src="/favicon.svg" alt="" className={cn("size-8", className)} draggable={false} />;
}
