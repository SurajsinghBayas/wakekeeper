import { Download as DownloadIcon } from "lucide-react";
import { toast } from "sonner";
import { LinkButton } from "../components/Button";
import { CopyButton } from "../components/Copy";
import { release } from "../lib/release";
import { cn } from "../lib/utils";

export function Download() {
  return (
    <section id="download" className="border-t border-stone-200 dark:border-stone-800">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-xl">
          <h2 className="text-3xl font-semibold text-balance">Download</h2>
          <p className="mt-3 text-pretty text-stone-600 dark:text-stone-400">
            Version {release.version}, released{" "}
            {new Date(release.date).toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })}. Windows 10
            (1809 or later) or Windows 11, on 64-bit Intel or AMD. No installer: unzip it and run it.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {release.builds.map((b) => (
            <article
              key={b.id}
              className={cn(
                "flex min-w-0 flex-col rounded-2xl border bg-white p-5 sm:p-6 dark:bg-stone-900",
                b.recommended ? "border-stone-900 dark:border-stone-300" : "border-stone-200 dark:border-stone-800",
              )}
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-lg font-semibold">{b.name}</h3>
                {b.recommended && <span className="text-xs font-medium text-amber-700 dark:text-amber-500">Recommended</span>}
              </div>
              <p className="mt-1 text-pretty text-stone-600 dark:text-stone-400">
                {b.note}
                {b.id === "lite" && (
                  <>
                    {" "}
                    <a
                      className="underline decoration-stone-300 underline-offset-2 hover:decoration-stone-600"
                      href="https://dotnet.microsoft.com/download/dotnet/8.0"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Get the runtime
                    </a>
                    .
                  </>
                )}
              </p>

              <div className="mt-6 flex items-center gap-2 rounded-lg bg-stone-100 py-1.5 pr-1.5 pl-3 dark:bg-stone-950">
                <span className="text-xs text-stone-500">SHA-256</span>
                <code className="min-w-0 flex-1 truncate font-mono text-xs text-stone-700 dark:text-stone-300" title={b.sha256}>
                  {b.sha256}
                </code>
                <CopyButton value={b.sha256} label={`Copy SHA-256 for ${b.name}`} toastMessage="Checksum copied" />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-2 md:mt-auto">
                <span className="min-w-0 truncate font-mono text-sm text-stone-500 tabular-nums">
                  {b.file.replace(".zip", "")} · {b.size}
                </span>
                <LinkButton
                  href={b.href}
                  download
                  variant={b.recommended ? "accent" : "secondary"}
                  onClick={() => toast("Download started", { description: "Next: unzip it and run WakeKeeper.exe." })}
                >
                  <DownloadIcon aria-hidden />
                  Download
                </LinkButton>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
