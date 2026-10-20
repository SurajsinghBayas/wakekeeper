import { Download as DownloadIcon, FolderArchive, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { LinkButton } from "../components/Button";
import { AppTile } from "../components/CupIcon";
import { CopyButton } from "../components/Copy";
import { release } from "../lib/release";

const included = [
  "Setup wizard, no administrator rights needed",
  "Start menu entry and optional start with Windows",
  "Uninstall any time from Settings › Apps",
  "Everything bundled, nothing else to install",
];

export function Download() {
  const started = () => toast("Download started", { description: "Open WakeKeeper-Setup.exe when it finishes." });

  return (
    <section id="download" className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="silver rounded-3xl border border-slate-200 p-6 shadow-sm sm:p-10">
            <div className="flex items-center gap-4">
              <AppTile className="size-14 rounded-2xl shadow-md shadow-sky-900/20" />
              <div>
                <h2 className="text-2xl font-semibold">Download WakeKeeper</h2>
                <p className="text-sm text-slate-500">
                  Version {release.version} · Windows 10 and 11 (64-bit) · {release.setup.size}
                </p>
              </div>
            </div>

            <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
              {included.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-pretty text-slate-700">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sky-600" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton href={release.setup.href} size="lg" onClick={started}>
                <DownloadIcon aria-hidden />
                Download for Windows
              </LinkButton>
              <LinkButton href={release.portable.href} size="lg" variant="secondary">
                <FolderArchive aria-hidden />
                Portable .zip
              </LinkButton>
            </div>
            <p className="mt-4 text-sm text-pretty text-slate-500">
              Portable: unzip anywhere and run WakeKeeper.exe. Nothing is installed, and it's handy for USB sticks and work PCs.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium">Windows may show a blue warning</h3>
              <p className="mt-1.5 text-pretty text-slate-600">
                New apps that aren't widely downloaded yet get a SmartScreen prompt saying “Windows protected your PC”. Click{" "}
                <b className="font-medium text-slate-900">More info</b>, then <b className="font-medium text-slate-900">Run anyway</b>.
                It appears only once.
              </p>
            </div>
            <div>
              <h3 className="font-medium">What it changes on your PC</h3>
              <p className="mt-1.5 text-pretty text-slate-600">
                It installs to your user folder, adds a Start menu entry and, if you choose, a startup entry. It never changes
                system files, and uninstalling removes everything.
              </p>
            </div>
            <details className="group rounded-xl border border-slate-200 bg-slate-50 p-4 open:bg-white">
              <summary className="cursor-pointer list-none text-sm font-medium text-slate-700 marker:hidden">
                <span className="inline-block transition-transform duration-200 group-open:rotate-90">›</span> Verify the download
                (optional)
              </summary>
              <p className="mt-3 text-sm text-pretty text-slate-500">
                SHA-256 fingerprints, for anyone who wants to confirm the files weren't changed in transit.
              </p>
              {[release.setup, release.portable].map((b) => (
                <div key={b.file} className="mt-3">
                  <p className="text-xs text-slate-500">{b.file}</p>
                  <div className="mt-1 flex items-center gap-2 rounded-lg bg-slate-100 py-1 pr-1 pl-3">
                    <code className="min-w-0 flex-1 truncate font-mono text-xs text-slate-700" title={b.sha256}>
                      {b.sha256}
                    </code>
                    <CopyButton value={b.sha256} label={`Copy SHA-256 for ${b.file}`} toastMessage="Fingerprint copied" />
                  </div>
                </div>
              ))}
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}
