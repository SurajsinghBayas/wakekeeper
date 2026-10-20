import { ArrowDown, Download } from "lucide-react";
import { LinkButton } from "../components/Button";
import { CupIcon } from "../components/CupIcon";
import { TrayDemo } from "../components/TrayDemo";
import { release } from "../lib/release";

const nav = [
  { href: "#features", label: "Features" },
  { href: "#install", label: "Install" },
  { href: "#test", label: "Help test" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-stone-50/90 pt-[env(safe-area-inset-top)] backdrop-blur-sm dark:border-stone-800/80 dark:bg-stone-950/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2 font-semibold">
          <CupIcon active className="size-5" />
          WakeKeeper
        </a>
        <nav className="hidden flex-1 gap-1 sm:flex" aria-label="Sections">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-md px-2.5 py-1.5 text-sm text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <LinkButton href="#download" size="sm" className="ml-auto sm:ml-0">
          <Download aria-hidden />
          Download
        </LinkButton>
      </div>
    </header>
  );
}

export function Hero() {
  const main = release.builds[0];
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:pt-24 lg:pb-28">
      <div>
        <p className="rise font-mono text-xs text-stone-500 [--i:0]">For Windows 10 and 11 · v{release.version}</p>
        <h1 className="rise mt-4 text-4xl font-semibold text-balance [--i:1] sm:text-5xl">
          Keep your PC awake. Exactly as long as you need.
        </h1>
        <p className="rise mt-5 max-w-lg text-lg text-pretty text-stone-600 [--i:2] dark:text-stone-400">
          WakeKeeper lives in the system tray and stops Windows from sleeping for an hour, until 6 pm, while a download
          finishes, or whenever your own rules say so. When the session ends, your power settings are exactly as you left
          them.
        </p>
        <div className="rise mt-8 flex flex-wrap items-center gap-3 [--i:3]">
          <LinkButton href={main.href} download size="lg" variant="accent">
            <Download aria-hidden />
            Download for Windows
          </LinkButton>
          <LinkButton href="#install" size="lg" variant="secondary">
            How to use it
            <ArrowDown aria-hidden />
          </LinkButton>
        </div>
        <p className="rise mt-4 text-sm text-stone-500 [--i:4]">
          {main.size} zip · x64 · free · works offline, sends no data
        </p>
      </div>
      <div className="rise [--i:3]">
        <TrayDemo />
      </div>
    </section>
  );
}
