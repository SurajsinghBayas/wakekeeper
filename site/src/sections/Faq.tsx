import { Accordion } from "@base-ui/react/accordion";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "Does it work with Claude Code, Codex, Cursor and other agents?",
    a: "Yes. WakeKeeper doesn't need to know what the agent is. It keeps Windows awake, so anything running on the PC keeps running. The neatest setup is While app is running with the terminal or editor the agent lives in.",
  },
  {
    q: "Is it really safe to close the lid?",
    a: "Yes. WakeKeeper changes the lid action to “Do nothing” only during a session and restores your setting afterwards, even after a crash or restart. One caution: a closed laptop still produces heat, so don't zip it into a bag while it's working.",
  },
  {
    q: "Why does Windows show a warning when I open the installer?",
    a: "SmartScreen warns about new apps until enough people have downloaded them. Click More info, then Run anyway. You'll see it once, not every time you use the app.",
  },
  {
    q: "Does it need administrator rights?",
    a: "No. It installs into your own user folder. On some company-managed PCs, IT policy blocks changing the lid setting; if so, WakeKeeper tells you, and everything else still works.",
  },
  {
    q: "Does it collect data or connect to the internet?",
    a: "No. There's no account, telemetry or network code. Your settings are a small file in your user profile.",
  },
  {
    q: "Will it drain my battery?",
    a: "WakeKeeper itself uses almost nothing. Keeping a PC awake does use power, so you can end sessions automatically below a charge level or when the charger is unplugged.",
  },
  {
    q: "Can I still put my PC to sleep myself?",
    a: "Yes. WakeKeeper only stops automatic idle sleep. Start › Power › Sleep and the power button work as normal.",
  },
  {
    q: "Installer or portable?",
    a: "The installer is the easiest choice: Start menu entry, start with Windows, and a normal uninstall. The portable zip runs from any folder or USB stick without installing anything.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-b border-slate-200">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_2fr] lg:py-28">
        <h2 className="text-3xl font-semibold text-balance sm:text-4xl">Questions</h2>
        <Accordion.Root className="min-w-0 border-t border-slate-200">
          {faqs.map((f) => (
            <Accordion.Item key={f.q} className="border-b border-slate-200">
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-4 text-left font-medium">
                  <span className="text-pretty">{f.q}</span>
                  <Plus
                    className="size-4 shrink-0 text-slate-400 transition-transform duration-200 ease-out-strong group-data-[panel-open]:rotate-45 group-data-[panel-open]:text-sky-600"
                    aria-hidden
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-out-strong data-[ending-style]:h-0 data-[starting-style]:h-0">
                <p className="pb-5 text-pretty text-slate-600">{f.a}</p>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
