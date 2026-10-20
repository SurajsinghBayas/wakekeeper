import { Toaster } from "sonner";
import { Download as DownloadIcon } from "lucide-react";
import { LinkButton } from "./components/Button";
import { AppTile } from "./components/CupIcon";
import { Download } from "./sections/Download";
import { Faq } from "./sections/Faq";
import { Features } from "./sections/Features";
import { Guide } from "./sections/Guide";
import { Hero, Nav } from "./sections/Hero";
import { LidClosed } from "./sections/LidClosed";
import { TestPlan } from "./sections/TestPlan";
import { Triggers } from "./sections/Triggers";
import { UseCases } from "./sections/UseCases";
import { release } from "./lib/release";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <UseCases />
        <LidClosed />
        <Features />
        <Triggers />
        <Download />
        <Guide />
        <TestPlan />
        <Faq />
        <section className="bg-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-balance sm:text-3xl">Start the run. Close the lid. Come back to results.</h2>
              <p className="mt-2 text-slate-600">Free for Windows 10 and 11. Set up in under a minute.</p>
            </div>
            <LinkButton href={release.setup.href} size="lg">
              <DownloadIcon aria-hidden />
              Download WakeKeeper
            </LinkButton>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200 bg-slate-50 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-2">
            <AppTile className="size-5" />
            WakeKeeper {release.version}
          </p>
          <nav className="flex gap-4" aria-label="Footer">
            <a className="hover:text-slate-900" href={release.repo} target="_blank" rel="noreferrer">
              Source
            </a>
            <a className="hover:text-slate-900" href={`${release.repo}/releases`} target="_blank" rel="noreferrer">
              Releases
            </a>
            {release.issuesUrl && (
              <a className="hover:text-slate-900" href={release.issuesUrl} target="_blank" rel="noreferrer">
                Report an issue
              </a>
            )}
          </nav>
        </div>
      </footer>
      <Toaster position="bottom-center" theme="light" toastOptions={{ className: "font-sans" }} />
    </>
  );
}
