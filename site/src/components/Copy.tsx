import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export function CopyButton({ value, label, toastMessage }: { value: string; label: string; toastMessage?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      if (toastMessage) toast(toastMessage);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="relative grid size-7 shrink-0 place-items-center rounded-md text-slate-500 transition-[transform,background-color] duration-150 ease-out hover:bg-slate-200 hover:text-slate-900 active:scale-[0.94]"
    >
      <Copy className={cn("absolute size-3.5 transition-[opacity,filter,transform] duration-200", copied && "scale-75 opacity-0 blur-[2px]")} aria-hidden />
      <Check className={cn("absolute size-3.5 text-sky-600 transition-[opacity,filter,transform] duration-200", !copied && "scale-75 opacity-0 blur-[2px]")} aria-hidden />
    </button>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-b-2 border-slate-300 bg-white px-1.5 py-px font-mono text-[12px] text-slate-700">{children}</kbd>
  );
}
