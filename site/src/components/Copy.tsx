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
      className="relative grid size-7 shrink-0 place-items-center rounded-md text-stone-500 transition-[transform,background-color] duration-150 ease-out hover:bg-stone-200 hover:text-stone-900 active:scale-[0.94] dark:hover:bg-stone-800 dark:hover:text-stone-100"
    >
      <Copy className={cn("absolute size-3.5 transition-[opacity,filter,transform] duration-200", copied && "scale-75 opacity-0 blur-[2px]")} aria-hidden />
      <Check className={cn("absolute size-3.5 text-amber-700 transition-[opacity,filter,transform] duration-200 dark:text-amber-500", !copied && "scale-75 opacity-0 blur-[2px]")} aria-hidden />
    </button>
  );
}

export function Code({ children }: { children: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-stone-200 bg-stone-100 py-2 pr-2 pl-3 dark:border-stone-800 dark:bg-stone-900">
      <code className="flex-1 overflow-x-auto py-0.5 font-mono text-[13px] whitespace-pre text-stone-800 dark:text-stone-200">{children}</code>
      <CopyButton value={children} label="Copy command" toastMessage="Command copied" />
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-b-2 border-stone-300 bg-white px-1.5 py-px font-mono text-[12px] text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
      {children}
    </kbd>
  );
}
