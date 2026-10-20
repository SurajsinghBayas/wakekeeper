import { useState } from "react";
import { Switch } from "@base-ui/react/switch";
import { CupIcon } from "../components/CupIcon";
import { cn } from "../lib/utils";

const criteria = [
  { id: "app", label: "App running", value: "vlc" },
  { id: "power", label: "Power adapter", value: "connected" },
  { id: "schedule", label: "Schedule", value: "20:00 – 01:00, every day" },
] as const;

type Id = (typeof criteria)[number]["id"];

export function Triggers() {
  const [on, setOn] = useState<Record<Id, boolean>>({ app: true, power: true, schedule: false });
  const active = criteria.every((c) => on[c.id]);

  return (
    <section className="border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900/40">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <div>
          <p className="font-mono text-xs text-stone-500">Triggers</p>
          <h2 className="mt-3 text-3xl font-semibold text-balance">Set the rule once and forget about it.</h2>
          <p className="mt-4 max-w-md text-pretty text-stone-600 dark:text-stone-400">
            A Trigger starts a session automatically while all of its conditions are true, and ends it as soon as one stops
            being true. Sessions you start yourself always take priority.
          </p>
          <p className="mt-4 max-w-md text-sm text-pretty text-stone-500">
            Toggle the conditions to see when this example would keep the PC awake.
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 sm:p-6 dark:border-stone-800 dark:bg-stone-950">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-stone-500">Trigger</p>
              <p className="font-medium">Movie night</p>
            </div>
            <div
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors duration-200",
                active
                  ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "border-stone-200 text-stone-500 dark:border-stone-800",
              )}
              aria-live="polite"
            >
              <CupIcon active={active} className="size-4" />
              {active ? "Keeping awake" : "Waiting"}
            </div>
          </div>

          <ul className="mt-5 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
            {criteria.map((c) => (
              <li key={c.id} className="flex items-center gap-4 px-4 py-3.5">
                <label htmlFor={`crit-${c.id}`} className="min-w-0 flex-1 cursor-pointer">
                  <span className="block text-sm font-medium">{c.label}</span>
                  <span className="block truncate font-mono text-xs text-stone-500">{c.value}</span>
                </label>
                <Switch.Root
                  id={`crit-${c.id}`}
                  checked={on[c.id]}
                  onCheckedChange={(v) => setOn((prev) => ({ ...prev, [c.id]: v }))}
                  className="relative inline-flex h-6 w-10 shrink-0 rounded-full bg-stone-300 p-0.5 transition-colors duration-150 data-[checked]:bg-amber-600 dark:bg-stone-700"
                >
                  <Switch.Thumb className="size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out-strong data-[checked]:translate-x-4" />
                </Switch.Root>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-stone-500">
            Every condition must be true. {active ? "All three are, so a session is running." : "At least one isn't, so nothing happens."}
          </p>
        </div>
      </div>
    </section>
  );
}
