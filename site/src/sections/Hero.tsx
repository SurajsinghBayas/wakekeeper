import { ArrowDown, Download } from "lucide-react";
import { LinkButton } from "../components/Button";
import { AppTile } from "../components/CupIcon";
import { TrayDemo } from "../components/TrayDemo";
import { release } from "../lib/release";

const nav = [
  { href: "#use-cases", label: "Use cases" },
  { href: "#features", label: "Features" },
  { href: "#install", label: "Install" },
  { href: "#test", label: "Help test" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2 font-semibold">
          <AppTile className="size-6" />
          WakeKeeper
        </a>
        <nav className="hidden flex-1 gap-1 md:flex" aria-label="Sections">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="rounded-md px-2.5 py-1.5 text-sm text-slate-600 transition-colors hover:text-slate-900">
              {n.label}
            </a>
          ))}
        </nav>
        <LinkButton href="#download" size="sm" className="ml-auto md:ml-0">
          <Download aria-hidden />
          Download
        </LinkButton>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white">
      {/* Silver backdrop with a faint sky horizon. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-0 bg-[radial-gradient(70%_60%_at_80%_0%,var(--color-sky-100),transparent_70%),linear-gradient(180deg,white,var(--color-slate-50))]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:pt-24 lg:pb-28">
        <div>
          <p className="rise inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-xs [--i:0]">
            <span className="size-1.5 rounded-full bg-sky-500" />
            For Windows 10 and 11 · v{release.version}
          </p>
          <h1 className="rise mt-5 text-4xl font-semibold text-balance [--i:1] sm:text-5xl">
            Close the lid. Your agents keep working.
          </h1>
          <p className="rise mt-5 max-w-lg text-lg text-pretty text-slate-600 [--i:2]">
            WakeKeeper stops Windows from sleeping while your AI agents, builds, downloads and backups run, even with the laptop
            shut. One click in the taskbar, and your power settings go back to normal when the job is done.
          </p>
          <div className="rise mt-8 flex flex-wrap items-center gap-3 [--i:3]">
            <LinkButton href={release.setup.href} size="lg">
              <Download aria-hidden />
              Download for Windows
            </LinkButton>
            <LinkButton href="#use-cases" size="lg" variant="secondary">
              See when to use it
              <ArrowDown aria-hidden />
            </LinkButton>
          </div>
          <p className="rise mt-4 text-sm text-slate-500 [--i:4]">
            Free · {release.setup.size} setup wizard · no admin rights · works offline, sends no data
          </p>
        </div>
        <div className="rise [--i:3]">
          <TrayDemo />
        </div>
      </div>
    </section>
  );
}
