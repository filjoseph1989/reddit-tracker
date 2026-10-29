"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions";

/** A form bound to a server action that shows the action's error message. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && <p className="basis-full text-sm text-red-600 dark:text-red-400">{state.error}</p>}
    </form>
  );
}

export function SubmitButton({ children, className = "btn-primary" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "Saving…" : children}
    </button>
  );
}

export function ConfirmSubmitButton({
  children,
  className = "btn-danger",
  confirmMessage,
  title,
}: {
  children: ReactNode;
  className?: string;
  confirmMessage: string;
  title?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      title={title}
      aria-label={title}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {pending ? "Processing…" : children}
    </button>
  );
}

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function CopyIcon() {
  return (
    <svg {...iconProps}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
    </svg>
  );
}

/** 
 * Icon button that copies `text` to the clipboard and briefly shows a check. 
 */
export function CopyIconButton({ text, title = "Copy link" }: { text: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      prompt("Copy to clipboard: Ctrl+C, Enter", text);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : title}
      aria-label={title}
      className={`btn-icon ${copied ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

/** 
 * Current time, ticking every 30s. Null until mounted so server and client markup match. 
 */
function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start the clock on mount
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

/** 
 * A timestamp in the viewer's own timezone. 
 */
export function LocalTime({ iso }: { iso: string }) {
  const now = useNow();
  return <time dateTime={iso}>{now ? dateFormat.format(new Date(iso)) : "…"}</time>;
}

export function formatDuration(ms: number) {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}

/** 
 * "Safe now" or a live countdown to the given time. 
 */
export function SafeStatus({ iso, size = "sm" }: { iso: string | null; size?: "sm" | "lg" }) {
  const now = useNow();
  const textClass = size === "lg" ? "px-3.5 py-1 text-sm font-medium" : "px-2.5 py-0.5 text-xs font-medium";
  if (!now) return <span className={`pill bg-zinc-100 text-zinc-500 dark:bg-zinc-800 ${textClass}`}>…</span>;
  const wait = iso ? new Date(iso).getTime() - now.getTime() : 0;
  if (wait <= 0) {
    return (
      <span className={`pill bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ${textClass}`}>
        ● Safe to post
      </span>
    );
  }
  return (
    <span className={`pill bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 ${textClass}`}>
      ⏳ Wait {formatDuration(wait)}
    </span>
  );
}

/** 
 * Card that turns green while the account is safe to post from, flipping live as cooldowns end. 
 */
export function SafeCard({ iso, className = "", children }: { iso: string | null; className?: string; children: ReactNode }) {
  const now = useNow();
  const safe = now !== null && (!iso || new Date(iso).getTime() <= now.getTime());
  const tone = safe
    ? "border-emerald-300 bg-emerald-50/70 hover:border-emerald-400 dark:border-emerald-800/70 dark:bg-emerald-950/30 dark:hover:border-emerald-700"
    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700";
  return <div className={`card transition ${tone} ${className}`}>{children}</div>;
}

/** 
 * datetime-local input that submits an ISO timestamp, so the server gets the viewer's timezone right. 
 */
export function PostedAtInput() {
  const now = useNow();
  const [value, setValue] = useState("");
  const shown = value || (now ? toLocalInput(now) : "");
  return (
    <>
      <input
        type="datetime-local"
        className="input"
        value={shown}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Posted at"
        required
      />
      <input type="hidden" name="postedAt" value={shown ? new Date(shown).toISOString() : ""} />
    </>
  );
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
