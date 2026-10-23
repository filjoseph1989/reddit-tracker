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
}: {
  children: ReactNode;
  className?: string;
  confirmMessage: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
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

/** Current time, ticking every 30s. Null until mounted so server and client markup match. */
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

/** A timestamp in the viewer's own timezone. */
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

/** "Safe now" or a live countdown to the given time. */
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

/** datetime-local input that submits an ISO timestamp, so the server gets the viewer's timezone right. */
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
