import { useState } from "react";
import { Checkbox } from "@base-ui/react/checkbox";
import NumberFlow from "@number-flow/react";
import { Check, ClipboardCopy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button, LinkButton } from "../components/Button";
import { release } from "../lib/release";
import { cn, readStorage, writeStorage } from "../lib/utils";

const tests = [
  { id: "install", title: "Setup wizard", how: "Run WakeKeeper-Setup.exe and finish the wizard. The cup appears next to the clock along with a welcome notification." },
  { id: "toggle", title: "Click to start and stop", how: "Click the cup. It fills in and a notification says your PC is being kept awake. Click again to stop." },
  { id: "timed", title: "Timed session ends on its own", how: "Right-click › Keep awake for › 15 minutes. After 15 minutes the cup goes back to an outline." },
  { id: "screen", title: "Screen stays on", how: "Set Windows' screen timeout to 1 minute, start a session and leave the PC alone. The screen should stay on." },
  { id: "app", title: "While an app is open", how: "Open Notepad, choose it under While an app is open, then close Notepad. The session stops within a couple of seconds." },
  { id: "download", title: "Until downloads finish", how: "Start a large download in your browser, then this session. It stops shortly after the download finishes." },
  { id: "lid", title: "Lid closed (laptops)", how: "Tick Keep running with lid closed, start a session with music playing, and close the lid for a minute. The music keeps playing." },
  { id: "battery", title: "Battery rules (laptops)", how: "In Settings › Sessions, turn on End session if power adapter is disconnected. Start a session and unplug. It stops." },
  { id: "hotkey", title: "Hot key", how: "Ctrl + Alt + A starts a session, and pressing it again stops it." },
  { id: "trigger", title: "Auto-start rule", how: "Create a rule with App running = notepad. Open Notepad: a session starts within 5 seconds and stops when you close it." },
  { id: "login", title: "Starts with Windows", how: "Restart your PC. The cup is back in the taskbar without you opening anything." },
  { id: "uninstall", title: "Clean uninstall", how: "Uninstall from Settings › Apps. The cup disappears and your lid-close setting is what it was before." },
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
      "",
      ...tests.map((t) => `[${results[t.id] ? "x" : " "}] ${t.title}`),
      "",
      "Windows version (Settings › System › About):",
      "Laptop or desktop:",
      "What went wrong:",
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast("Report copied", { description: "Fill in the last three lines and paste it into an issue." });
    } catch {
      toast.error("Couldn't copy the report.");
    }
  }

  return (
    <section id="test" className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="font-mono text-xs text-sky-700">Help test v{release.version}</p>
            <h2 className="mt-3 text-3xl font-semibold text-balance sm:text-4xl">Put it through its paces</h2>
            <p className="mt-3 text-pretty text-slate-600">
              Each check takes a minute or two, and none of them need a terminal. Tick the ones that work; your progress is saved in
              this browser. When you're done, copy the report and send it with anything that didn't work.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            <span className="text-3xl font-semibold text-slate-900 tabular-nums">
              <NumberFlow value={passed} />
            </span>
            <span className="tabular-nums"> / {tests.length} passed</span>
          </p>
        </div>

        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden>
          <div
            className="h-full origin-left rounded-full bg-sky-600 transition-transform duration-500 ease-out-strong"
            style={{ transform: `scaleX(${passed / tests.length})` }}
          />
        </div>

        <ul className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 md:grid-cols-2">
          {tests.map((t) => {
            const done = !!results[t.id];
            return (
              <li key={t.id} className="bg-white">
                <label className={cn("flex h-full cursor-pointer gap-3 p-4 transition-colors duration-150 hover:bg-slate-50", done && "bg-sky-50/50")}>
                  <Checkbox.Root
                    checked={done}
                    onCheckedChange={(v) => set(t.id, v)}
                    className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-slate-300 bg-white transition-colors duration-150 data-[checked]:border-sky-600 data-[checked]:bg-sky-600"
                  >
                    <Checkbox.Indicator className="text-white transition-[opacity,transform] duration-150 data-[ending-style]:scale-75 data-[ending-style]:opacity-0 data-[starting-style]:scale-75 data-[starting-style]:opacity-0">
                      <Check className="size-3.5" strokeWidth={3} aria-hidden />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span className="min-w-0">
                    <span className={cn("block font-medium transition-colors", done && "text-slate-500")}>{t.title}</span>
                    <span className="mt-1 block text-sm text-pretty text-slate-600">{t.how}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="dark" onClick={copyReport}>
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
