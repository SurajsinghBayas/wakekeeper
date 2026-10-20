import { Toaster } from "sonner";
import { CupIcon } from "./components/CupIcon";
import { Download } from "./sections/Download";
import { Faq } from "./sections/Faq";
import { Features } from "./sections/Features";
import { Guide } from "./sections/Guide";
import { Hero, Nav } from "./sections/Hero";
import { TestPlan } from "./sections/TestPlan";
import { Triggers } from "./sections/Triggers";
import { release } from "./lib/release";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Features />
        <Triggers />
        <Download />
        <Guide />
        <TestPlan />
        <Faq />
      </main>
      <footer className="border-t border-stone-200 pb-[env(safe-area-inset-bottom)] dark:border-stone-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-2">
            <CupIcon active={false} className="size-4" />
            WakeKeeper {release.version}
          </p>
        </div>
      </footer>
      <Toaster position="bottom-left" theme="system" toastOptions={{ className: "font-sans" }} />
    </>
  );
}
