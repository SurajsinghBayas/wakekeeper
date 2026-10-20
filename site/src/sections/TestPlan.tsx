import { useState } from "react";
import { Checkbox } from "@base-ui/react/checkbox";
import NumberFlow from "@number-flow/react";
import { Check, ClipboardCopy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button, LinkButton } from "../components/Button";
import { release } from "../lib/release";
import { cn, readStorage, writeStorage } from "../lib/utils";

const tests = [
  { id: "indefinite", title: "Indefinite session", how: "Left-click the cup, then run powercfg /requests. WakeKeeper should be listed under SYSTEM and DISPLAY." },
  { id: "timed", title: "Timed session ends on its own", how: "Start a 5-minute session. When it ends, the icon goes back to an outline and a notification appears." },
  { id: "display", title: "Allow display sleep", how: "Turn on Quick Settings → Allow display sleep. powercfg /requests should now list WakeKeeper under SYSTEM only." },
  { id: "app", title: "While App is Running", how: "Open Notepad, start the session with it, then close Notepad. The session should end within a second or two." },
  { id: "download", title: "While File is Downloading", how: "Start a large download in your browser and start this session. It should end about 15 seconds after the download finishes." },
  { id: "hotkey", title: "Hot key", how: "Ctrl + Alt + A should start a session, and pressing it again should end it." },
  { id: "battery", title: "Battery rules (laptops)", how: "Turn on End session if not connected to power, start a session, then unplug the charger. The session should end." },
  { id: "lid", title: "Lid closed mode (laptops)", how: "Turn on Keep awake with lid closed, start a session and close the lid for a minute. Music or a download should keep going." },
  { id: "trigger", title: "Trigger", how: "Create a Trigger with App running = notepad. Open Notepad and a session should start within 5 seconds, then end after you close it." },
  { id: "cursor", title: "Move cursor when idle", how: "Set it to 1 minute and leave the PC alone. Your status in Teams or Slack should stay Available." },
  { id: "login", title: "Launch at login", how: "Turn it on in Settings → General, then sign out and back in. The cup should come back on its own." },
  { id: "restore", title: "Quit restores everything", how: "Quit during a lid-closed session. Your lid-close action under Control Panel → Power Options should be what it was before." },
] as const;

type Results = Record<string, boolean>;
const KEY = `wakekeeper-tests-${release.version}`;

export function TestPlan() {
  const [results, setResults] = useState<Results>(() => readStorage<Results>(KEY, {}));
  const passed = tests.filter((t) => results[t.id]).length;

  function set(id: string, value: boolean) {
    const next = { ...results, [id]: value };
    setResults(next);
    writeStorage(KEY, next);
  }

  async function copyReport() {
    const lines = [
      `WakeKeeper ${release.version} test report`,
      `Passed ${passed}/${tests.length}`,
      `Browser: ${navigator.userAgent}`,
      "",
      ...tests.map((t) => `[${results[t.id] ? "x" : " "}] ${t.title}`),
      "",
      "Windows version (run `winver`):",
      "Laptop or desktop:",
      "What went wrong:",
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast("Report copied", { description: "Fill in the last three lines and send it over." });
    } catch {
      toast.error("Couldn't copy the report.");
    }
  }

  return (
    <section id="test" className="border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="font-mono text-xs text-stone-500">Help test v{release.version}</p>
            <h2 className="mt-3 text-3xl font-semibold text-balance">Run through the checklist</h2>
            <p className="mt-3 text-pretty text-stone-600 dark:text-stone-400">
              This is the first public build. Tick each check that works on your PC; your progress is saved in this browser. When
              you're done, copy the report and send it with anything that broke.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-stone-500">
              <span className="text-2xl font-semibold text-stone-900 tabular-nums dark:text-stone-100">
                <NumberFlow value={passed} />
              </span>
              <span className="tabular-nums"> / {tests.length} passed</span>
            </p>
          </div>
        </div>

        <div className="mt-6 h-1 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800" aria-hidden>
          <div
            className="h-full origin-left rounded-full bg-amber-600 transition-transform duration-300 ease-out-strong"
            style={{ transform: `scaleX(${passed / tests.length})` }}
          />
        </div>

        <ul className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 md:grid-cols-2 dark:border-stone-800 dark:bg-stone-800">
          {tests.map((t) => {
            const done = !!results[t.id];
            return (
              <li key={t.id} className="bg-white dark:bg-stone-900">
                <label className="flex h-full cursor-pointer gap-3 p-4 transition-colors duration-150 hover:bg-stone-50 dark:hover:bg-stone-800/50">
                  <Checkbox.Root
                    checked={done}
                    onCheckedChange={(v) => set(t.id, v)}
                    className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-stone-300 bg-white transition-colors duration-150 data-[checked]:border-amber-600 data-[checked]:bg-amber-600 dark:border-stone-600 dark:bg-stone-900"
                  >
                    <Checkbox.Indicator className="text-white data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity duration-100">
                      <Check className="size-3.5" strokeWidth={3} aria-hidden />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span className="min-w-0">
                    <span className={cn("block font-medium transition-colors", done && "text-stone-500")}>{t.title}</span>
                    <span className="mt-1 block text-sm text-pretty text-stone-600 dark:text-stone-400">{t.how}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="primary" onClick={copyReport}>
            <ClipboardCopy aria-hidden />
            Copy test report
          </Button>
          {release.issuesUrl && (
            <LinkButton variant="secondary" href={release.issuesUrl} target="_blank" rel="noreferrer">
              Report an issue
              <ExternalLink aria-hidden />
            </LinkButton>
          )}
        </div>
      </div>
    </section>
  );
}
