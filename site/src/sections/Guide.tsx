import { Tabs } from "@base-ui/react/tabs";
import { Code, Kbd } from "../components/Copy";
import { release } from "../lib/release";

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="space-y-6 [counter-reset:step]">{children}</ol>;
}

function Step({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <li className="relative grid grid-cols-[2rem_1fr] gap-x-3 [counter-increment:step]">
      <span className="grid size-7 place-items-center rounded-full border border-stone-300 font-mono text-xs text-stone-600 tabular-nums before:content-[counter(step)] dark:border-stone-700 dark:text-stone-400" />
      <div className="min-w-0 pt-0.5">
        <p className="font-medium text-pretty">{title}</p>
        {children && <div className="mt-2 space-y-3 text-pretty text-stone-600 dark:text-stone-400">{children}</div>}
      </div>
    </li>
  );
}

const tabs = [
  { value: "install", label: "Install" },
  { value: "use", label: "Everyday use" },
  { value: "triggers", label: "Triggers" },
  { value: "remove", label: "Uninstall" },
];

export function Guide() {
  const file = release.builds[0].file;
  return (
    <section id="install" className="border-t border-stone-200 dark:border-stone-800">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_2fr] lg:py-28">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-3xl font-semibold text-balance">How to use it</h2>
          <p className="mt-4 text-pretty text-stone-600 dark:text-stone-400">
            Two minutes from download to your first session. Everything happens from the cup icon in your taskbar.
          </p>
        </div>

        <Tabs.Root defaultValue="install" className="min-w-0">
          <Tabs.List className="relative flex gap-1 overflow-x-auto border-b border-stone-200 dark:border-stone-800">
            {tabs.map((t) => (
              <Tabs.Tab
                key={t.value}
                value={t.value}
                className="h-10 shrink-0 px-3 text-sm whitespace-nowrap text-stone-500 transition-colors duration-150 hover:text-stone-900 data-[active]:text-stone-900 dark:hover:text-stone-100 dark:data-[active]:text-stone-100"
              >
                {t.label}
              </Tabs.Tab>
            ))}
            <Tabs.Indicator className="absolute bottom-0 left-0 h-0.5 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] bg-stone-900 transition-[translate,width] duration-200 ease-in-out-strong dark:bg-stone-100" />
          </Tabs.List>

          <Tabs.Panel value="install" className="pt-8">
            <Steps>
              <Step title={`Download ${file}`}>
                <p>Use the Standalone build unless you already have the .NET 8 Desktop Runtime installed.</p>
              </Step>
              <Step title="Unzip it">
                <p>
                  Right-click the zip, choose <b className="font-medium text-stone-800 dark:text-stone-200">Extract All</b>, and
                  put <span className="font-mono text-sm">WakeKeeper.exe</span> somewhere permanent, such as a folder in
                  Documents. Launch at login points to wherever the file is.
                </p>
              </Step>
              <Step title="Run WakeKeeper.exe">
                <p>
                  This build isn't code-signed yet, so Windows SmartScreen may say "Windows protected your PC". Click{" "}
                  <b className="font-medium text-stone-800 dark:text-stone-200">More info</b>, then{" "}
                  <b className="font-medium text-stone-800 dark:text-stone-200">Run anyway</b>. If you'd like to check the file
                  first, compare its hash with the one in the Download section:
                </p>
                <Code>{`Get-FileHash .\\${file}`}</Code>
              </Step>
              <Step title="Find the cup in your taskbar">
                <p>
                  New tray icons usually start out hidden behind the <Kbd>^</Kbd> arrow. Drag the cup onto the taskbar so it's
                  always visible. It's outlined when idle and filled while your PC is being kept awake.
                </p>
              </Step>
            </Steps>
          </Tabs.Panel>

          <Tabs.Panel value="use" className="pt-8">
            <Steps>
              <Step title="Left-click the cup to start or end a session">
                <p>This uses your default duration, which is indefinite unless you change it in Settings → Session Defaults.</p>
              </Step>
              <Step title="Right-click for everything else">
                <p>
                  Choose minutes or hours, <i>Other Time/Until…</i> for a clock time, <i>While App is Running</i>, or{" "}
                  <i>While File is Downloading</i>. Quick Settings lets you allow display sleep, keep awake with the lid closed,
                  and more.
                </p>
              </Step>
              <Step title="Or press a hot key">
                <p>
                  <Kbd>Ctrl</Kbd> + <Kbd>Alt</Kbd> + <Kbd>A</Kbd> starts or ends a session from anywhere. You can change it in
                  Settings → Hot Keys.
                </p>
              </Step>
              <Step title="Check that it's working">
                <p>Open PowerShell during a session and run:</p>
                <Code>powercfg /requests</Code>
                <p>
                  WakeKeeper.exe should appear under <span className="font-mono text-sm">SYSTEM</span>, and under{" "}
                  <span className="font-mono text-sm">DISPLAY</span> too unless you've allowed display sleep.
                </p>
              </Step>
            </Steps>
          </Tabs.Panel>

          <Tabs.Panel value="triggers" className="pt-8">
            <Steps>
              <Step title="Open Settings → Triggers → Add">
                <p>Give it a name. Optionally allow the display to sleep while this Trigger is active.</p>
              </Step>
              <Step title="Add one or more criteria">
                <p>
                  Pick a type, fill in the text or number it needs, and click <i>Add criterion</i>. For example: App running{" "}
                  <span className="font-mono text-sm">obs64</span>, Power adapter, or Wi-Fi{" "}
                  <span className="font-mono text-sm">Office-5G</span>.
                </p>
              </Step>
              <Step title="Close Settings">
                <p>
                  Triggers are checked every 5 seconds. If you end a Trigger session by hand, WakeKeeper offers to pause all
                  Triggers for an hour so it doesn't start again straight away.
                </p>
              </Step>
            </Steps>
          </Tabs.Panel>

          <Tabs.Panel value="remove" className="pt-8">
            <Steps>
              <Step title="Turn off Launch at login">
                <p>Settings → General. This removes WakeKeeper's entry from your startup apps.</p>
              </Step>
              <Step title="Quit from the tray menu">
                <p>Quitting ends any session and restores your lid-close setting.</p>
              </Step>
              <Step title="Delete the files">
                <p>Delete WakeKeeper.exe, then its settings folder:</p>
                <Code>Remove-Item -Recurse "$env:APPDATA\WakeKeeper"</Code>
              </Step>
            </Steps>
          </Tabs.Panel>
        </Tabs.Root>
      </div>
    </section>
  );
}
