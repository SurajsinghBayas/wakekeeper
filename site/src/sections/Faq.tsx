import { Accordion } from "@base-ui/react/accordion";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "Why does Windows warn me when I open it?",
    a: "The build isn't code-signed yet, and SmartScreen warns about any new unsigned app that few people have downloaded. Click More info, then Run anyway. To make sure the file wasn't tampered with, compare its SHA-256 hash with the one on this page.",
  },
  {
    q: "Does it need administrator rights?",
    a: "No. The only exception is lid closed mode, which changes your power plan's lid action. On some managed or locked-down PCs that's blocked, and if so WakeKeeper shows a notification.",
  },
  {
    q: "Does it collect any data or go online?",
    a: "No. It has no network code, no telemetry and no update checks. Its settings are a single JSON file in %APPDATA%\\WakeKeeper.",
  },
  {
    q: "Can it stop sleep when I press the power button or choose Sleep?",
    a: "No, and that's deliberate. It prevents idle sleep only, so sleeping your PC on purpose always works. Closing the lid is the one exception, and only while lid closed mode is on.",
  },
  {
    q: "Which download should I pick?",
    a: "Standalone works on any 64-bit Windows 10 or 11 PC. Lite is about 100 KB but needs Microsoft's .NET 8 Desktop Runtime installed. If you're not sure, choose Standalone.",
  },
  {
    q: "Why does the screen saver setting also let the display turn off?",
    a: "On Windows, the screen saver and display sleep are controlled by the same power request, so when one is allowed, so is the other.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-t border-stone-200 dark:border-stone-800">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_2fr] lg:py-28">
        <h2 className="text-3xl font-semibold text-balance">Questions</h2>
        <Accordion.Root className="min-w-0 border-t border-stone-200 dark:border-stone-800">
          {faqs.map((f) => (
            <Accordion.Item key={f.q} className="border-b border-stone-200 dark:border-stone-800">
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-4 text-left font-medium">
                  <span className="text-pretty">{f.q}</span>
                  <Plus
                    className="size-4 shrink-0 text-stone-400 transition-transform duration-200 ease-out-strong group-data-[panel-open]:rotate-45"
                    aria-hidden
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-out-strong data-[ending-style]:h-0 data-[starting-style]:h-0">
                <p className="pb-5 text-pretty text-stone-600 dark:text-stone-400">{f.a}</p>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
