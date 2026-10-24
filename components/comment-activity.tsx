import type { CommentLevel } from "@/lib/comments";

const STYLES: Record<CommentLevel, { label: string; className: string }> = {
  normal: {
    label: "● Normal pace",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  busy: {
    label: "▲ Busy pace",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  spammy: {
    label: "⚠ Bot-like pace",
    className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  },
};

/** How human an account's commenting pace looks. */
export function CommentActivityBadge({ level, size = "sm" }: { level: CommentLevel; size?: "sm" | "lg" }) {
  const { label, className } = STYLES[level];
  const textClass = size === "lg" ? "px-3.5 py-1 text-sm font-medium" : "px-2.5 py-0.5 text-xs font-medium";
  return <span className={`pill ${className} ${textClass}`}>{label}</span>;
}
