import { cn } from "../lib/utils";

/** The same coffee cup the Windows app draws for its tray icon: filled when awake, outlined when idle. */
export function CupIcon({ active, className }: { active: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" strokeWidth={3} strokeLinecap="round" aria-hidden className={cn("size-5", className)}>
      <rect
        x="4"
        y="11"
        width="18"
        height="15"
        rx="2"
        className={cn(
          "transition-[fill,stroke] duration-200",
          active ? "fill-amber-600 stroke-amber-600" : "fill-transparent stroke-stone-500 dark:stroke-stone-400",
        )}
      />
      <path
        d="M22 14a4.5 4.5 0 0 1 0 9"
        className={cn("transition-[stroke] duration-200", active ? "stroke-amber-600" : "stroke-stone-500 dark:stroke-stone-400")}
      />
      <path
        d="M9 8c-2-2 2-3 0-6M16 8c-2-2 2-3 0-6"
        className={cn("stroke-amber-600 transition-opacity duration-200", active ? "opacity-100" : "opacity-0")}
      />
    </svg>
  );
}
