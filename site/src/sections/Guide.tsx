import { Tabs } from "@base-ui/react/tabs";
import { Kbd } from "../components/Copy";
import { CupIcon } from "../components/CupIcon";
import { InstallerDemo } from "../components/InstallerDemo";

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="space-y-6 [counter-reset:step]">{children}</ol>;
}

function Step({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[2rem_1fr] gap-x-3 [counter-increment:step]">
      <span className="grid size-7 place-items-center rounded-full bg-white font-mono text-xs text-sky-700 ring-1 ring-slate-300 tabular-nums before:content-[counter(step)]" />
      <div className="min-w-0 pt-0.5">
        <p className="font-medium text-pretty">{title}</p>
        {children && <div className="mt-1.5 space-y-3 text-pretty text-slate-600">{children}</div>}
      </div>
    </li>
  );
}

const B = ({ children }: { children: React.ReactNode }) => <b className="font-medium text-slate-900">{children}</b>;

const tabs = [
  { value: "install", label: "Install" },
  { value: "use", label: "Everyday use" },
  { value: "agents", label: "Agents & lid closed" },
  { value: "triggers", label: "Triggers" },
  { value: "remove", label: "Uninstall" },
];

export function Guide() {
  return (
    <section id="install" className="border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold text-balance sm:text-4xl">Up and running in under a minute</h2>
          <p className="mt-4 text-pretty text-slate-600">
            A standard Windows setup wizard: no terminal, no commands, no administrator password. Everything else happens from
            the cup icon next to your clock.
          </p>
        </div>

        <Tabs.Root defaultValue="install" className="mt-10 min-w-0">
          <Tabs.List className="relative flex gap-1 overflow-x-auto border-b border-slate-200">
            {tabs.map((t) => (
              <Tabs.Tab
                key={t.value}
                value={t.value}
                className="h-10 shrink-0 px-3 text-sm whitespace-nowrap text-slate-500 transition-colors duration-150 hover:text-slate-900 data-[active]:text-slate-900"
              >
                {t.label}
              </Tabs.Tab>
            ))}
            <Tabs.Indicator className="absolute bottom-0 left-0 h-0.5 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] rounded-full bg-sky-600 transition-[translate,width] duration-200 ease-in-out-strong" />
          </Tabs.List>

          <Tabs.Panel value="install" className="grid gap-10 pt-10 lg:grid-cols-[1fr_1.1fr]">
            <Steps>
              <Step title="Download WakeKeeper-Setup.exe">
                <p>It lands in your Downloads folder. Open it from the browser's download bar.</p>
              </Step>
              <Step title="If Windows shows a blue warning">
                <p>
                  Click <B>More info</B>, then <B>Run anyway</B>. Windows does this for new apps that aren't widely downloaded yet.
                </p>
              </Step>
              <Step title="Follow the wizard">
                <p>
                  Click <B>Next</B>, keep <B>Start when I sign in</B> ticked if you want it ready every day, then <B>Install</B>{" "}
                  and <B>Finish</B>.
                </p>
              </Step>
              <Step title="Find the cup next to the clock">
                <p>
                  New tray icons sometimes start hidden behind the <Kbd>^</Kbd> arrow. Drag the cup onto the taskbar so it's always
                  in view. A welcome notification tells you it's ready.
                </p>
              </Step>
            </Steps>
            <div>
              <InstallerDemo />
              <p className="mt-3 text-sm text-slate-500">Try it: click through the same steps you'll see in the real wizard.</p>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="use" className="max-w-2xl pt-10">
            <Steps>
              <Step title="Click the cup to start or stop">
                <p>
                  The icon fills in <CupIcon active className="inline size-4 align-text-bottom" /> while your PC is being kept
                  awake, and goes back to an outline <CupIcon active={false} className="inline size-4 align-text-bottom" /> when
                  it can sleep. Hover over it to see how long is left.
                </p>
              </Step>
              <Step title="Right-click for timers and options">
                <p>
                  Pick minutes or hours, <i>Other time/until</i> for a clock time, <i>While app is running</i>, or{" "}
                  <i>While file is downloading</i>. Running sessions can be extended from the same menu.
                </p>
              </Step>
              <Step title="Or use the keyboard">
                <p>
                  <Kbd>Ctrl</Kbd> + <Kbd>Alt</Kbd> + <Kbd>A</Kbd> starts or stops a session from anywhere. You can change it in
                  Settings › Hot keys.
                </p>
              </Step>
              <Step title="Fine-tune in Settings">
                <p>
                  Right-click the cup › <B>Settings</B> for default duration, battery rules, notifications, cursor nudging and
                  Drive Alive.
                </p>
              </Step>
            </Steps>
          </Tabs.Panel>

          <Tabs.Panel value="agents" className="max-w-2xl pt-10">
            <Steps>
              <Step title="Start your agent as usual">
                <p>Claude Code, Codex, Aider or a Cursor background agent in Windows Terminal, VS Code or any other app.</p>
              </Step>
              <Step title="Right-click the cup › While app is running › pick that app">
                <p>WakeKeeper keeps the PC awake until you close that window, then lets it sleep again on its own.</p>
              </Step>
              <Step title="Tick “Keep running with lid closed”">
                <p>
                  It's at the top of the menu on laptops. Now you can close the lid, put the laptop on the shelf and check on the
                  run from your phone.
                </p>
              </Step>
              <Step title="Keep it cool">
                <p>
                  A closed laptop still runs at full speed. Leave it on a hard surface rather than in a bag, and plug it in for
                  long runs.
                </p>
              </Step>
            </Steps>
          </Tabs.Panel>

          <Tabs.Panel value="triggers" className="max-w-2xl pt-10">
            <Steps>
              <Step title="Right-click the cup › Settings › Triggers › Add">
                <p>Give the Trigger a name, for example “Overnight agent runs”.</p>
              </Step>
              <Step title="Add conditions">
                <p>
                  Combine app running, power adapter connected, battery level, Wi-Fi network, a schedule, idle time, CPU load or a
                  connected drive. Every condition must be true for the Trigger to start a session.
                </p>
              </Step>
              <Step title="Close Settings">
                <p>
                  WakeKeeper checks your Triggers every few seconds. If you stop a Trigger session by hand, it offers to pause
                  Triggers for an hour.
                </p>
              </Step>
            </Steps>
          </Tabs.Panel>

          <Tabs.Panel value="remove" className="max-w-2xl pt-10">
            <Steps>
              <Step title="Open Settings › Apps › Installed apps">
                <p>Or search the Start menu for “Add or remove programs”.</p>
              </Step>
              <Step title="Find WakeKeeper › ⋯ › Uninstall">
                <p>
                  The uninstaller closes WakeKeeper, puts your lid setting back, and removes the app, its shortcuts and its
                  startup entry.
                </p>
              </Step>
              <Step title="Choose whether to keep your settings">
                <p>Keep them if you might reinstall later. Otherwise WakeKeeper removes them too.</p>
              </Step>
            </Steps>
          </Tabs.Panel>
        </Tabs.Root>
      </div>
    </section>
  );
}
