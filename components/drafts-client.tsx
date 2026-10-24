"use client";

import { useActionState, useId, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createDraft, deleteDraft, updateDraft, type FormState } from "@/app/actions";
import { buildRedditSubmitUrl, cleanSubredditName, formatDraftForClipboard } from "@/lib/drafts";
import { LocalTime } from "./client";

export type SerializedDraft = {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  targetSubreddit: string | null;
  accountId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  account: { id: string; username: string } | null;
};

export type AccountOption = {
  id: string;
  username: string;
};

export type SubredditOption = {
  id: string;
  name: string;
  displayName: string;
};

/** Single-click copy button with visual feedback */
export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  className = "btn-secondary text-xs inline-flex items-center gap-1",
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-999999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback alert if clipboard fails
      prompt("Copy to clipboard: Ctrl+C, Enter", text);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${className} transition-colors ${copied ? "!border-emerald-500 !bg-emerald-50 text-emerald-800 dark:!bg-emerald-950/50 dark:text-emerald-300" : ""}`}
      title={label}
    >
      {copied ? (
        <>
          <span className="text-emerald-600 dark:text-emerald-400">✓</span> {copiedLabel}
        </>
      ) : (
        <>
          <span>📋</span> {label}
        </>
      )}
    </button>
  );
}

function FormSubmitButton({
  children,
  pendingLabel = "Saving…",
  className = "btn-primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Form to create or edit a draft post */
export function DraftForm({
  draft,
  accounts,
  subreddits,
  onCancel,
  onSuccess,
  isCollapsedDefault = false,
}: {
  draft?: SerializedDraft;
  accounts: AccountOption[];
  subreddits?: SubredditOption[];
  onCancel?: () => void;
  onSuccess?: () => void;
  isCollapsedDefault?: boolean;
}) {
  const isEditing = Boolean(draft);
  const [open, setOpen] = useState(!isCollapsedDefault || isEditing);
  const [title, setTitle] = useState(draft?.title ?? "");
  const [body, setBody] = useState(draft?.body ?? "");
  const [linkUrl, setLinkUrl] = useState(draft?.linkUrl ?? "");
  const [targetSubreddit, setTargetSubreddit] = useState(draft?.targetSubreddit ?? "");
  const [accountId, setAccountId] = useState(draft?.accountId ?? "");
  const [notes, setNotes] = useState(draft?.notes ?? "");

  const datalistId = useId();

  const [state, formAction] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const res = isEditing ? await updateDraft(prev, formData) : await createDraft(prev, formData);
      if (!res?.error) {
        if (!isEditing) {
          setTitle("");
          setBody("");
          setLinkUrl("");
          setTargetSubreddit("");
          setAccountId("");
          setNotes("");
          if (isCollapsedDefault) setOpen(false);
        }
        onSuccess?.();
      }
      return res;
    },
    undefined
  );

  if (!open && !isEditing) {
    return (
      <div className="card flex items-center justify-between border-dashed">
        <div>
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Got a post idea?</h2>
          <p className="muted text-xs">Save it now as a draft so you can easily copy and post it later.</p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="btn-primary text-sm">
          + New Draft
        </button>
      </div>
    );
  }

  return (
    <div className={`card ${isEditing ? "border-orange-300 dark:border-orange-800" : ""}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {isEditing ? "Edit Draft Post" : "Create New Draft"}
        </h2>
        {(!isEditing && isCollapsedDefault) || isEditing ? (
          <button
            type="button"
            onClick={() => {
              if (onCancel) onCancel();
              else setOpen(false);
            }}
            className="text-xs text-zinc-500 hover:underline dark:text-zinc-400"
          >
            Cancel
          </button>
        ) : null}
      </div>

      <form action={formAction} className="space-y-4">
        {draft && <input type="hidden" name="id" value={draft.id} />}

        {state?.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-400">
            {state.error}
          </div>
        )}

        {/* Title */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Title <span className="text-red-500">*</span>
            </label>
            <span
              className={`text-xs ${
                title.length > 300
                  ? "text-red-500 font-bold"
                  : title.length > 250
                  ? "text-amber-500"
                  : "text-zinc-400"
              }`}
            >
              {title.length}/300
            </span>
          </div>
          <input
            name="title"
            type="text"
            placeholder="Reddit post title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={300}
            className="input mt-1 w-full"
            required
          />
        </div>

        {/* Subreddit and Account selection */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Target Subreddit</label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-zinc-400">
                r/
              </span>
              <input
                name="targetSubreddit"
                type="text"
                list={datalistId}
                placeholder="e.g. AskReddit, technology"
                value={targetSubreddit}
                onChange={(e) => setTargetSubreddit(e.target.value.replace(/^\/?r\//i, ""))}
                className="input w-full pl-8"
              />
              {subreddits && subreddits.length > 0 && (
                <datalist id={datalistId}>
                  {subreddits.map((s) => (
                    <option key={s.id} value={s.displayName} />
                  ))}
                </datalist>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Target Account</label>
            <select
              name="accountId"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="input mt-1 w-full"
            >
              <option value="">(Any / Unassigned)</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  u/{a.username}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Post Body (Text) */}
        <div>
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Post Body / Content <span className="font-normal text-zinc-400">(optional markdown / text)</span>
          </label>
          <textarea
            name="body"
            rows={4}
            placeholder="Write your post body text, discussion, or copy here…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="input mt-1 w-full font-mono text-xs leading-relaxed"
          />
        </div>

        {/* Link URL (optional for link posts) */}
        <div>
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Link URL <span className="font-normal text-zinc-400">(optional, for link posts)</span>
          </label>
          <input
            name="linkUrl"
            type="url"
            placeholder="https://…"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="input mt-1 w-full"
          />
        </div>

        {/* Personal Notes / Reminders */}
        <div>
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Internal Notes <span className="font-normal text-zinc-400">(personal reminders, optimal posting times, etc.)</span>
          </label>
          <input
            name="notes"
            type="text"
            placeholder="e.g. Wait until Thursday 9am EST, tag OP in comments"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input mt-1 w-full text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          {(!isEditing && isCollapsedDefault) || isEditing ? (
            <button
              type="button"
              onClick={() => {
                if (onCancel) onCancel();
                else setOpen(false);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          ) : null}
          <FormSubmitButton>{isEditing ? "Save Changes" : "Save Draft"}</FormSubmitButton>
        </div>
      </form>
    </div>
  );
}

/** Individual Draft Card displaying details and quick copy actions */
export function DraftCard({
  draft,
  accounts,
  subreddits,
}: {
  draft: SerializedDraft;
  accounts: AccountOption[];
  subreddits?: SubredditOption[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const cleanSubreddit = cleanSubredditName(draft.targetSubreddit);
  const redditSubmitUrl = buildRedditSubmitUrl({
    title: draft.title,
    body: draft.body,
    linkUrl: draft.linkUrl,
    targetSubreddit: cleanSubreddit,
  });

  // Formatted copy of everything together
  const fullCopyText = useMemo(() => {
    return formatDraftForClipboard({
      title: draft.title,
      body: draft.body,
      linkUrl: draft.linkUrl,
    });
  }, [draft.title, draft.linkUrl, draft.body]);

  async function handleDelete() {
    if (!window.confirm(`Delete draft "${draft.title}"?`)) return;
    setIsDeleting(true);
    try {
      await deleteDraft(draft.id);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isEditing) {
    return (
      <DraftForm
        draft={draft}
        accounts={accounts}
        subreddits={subreddits}
        onCancel={() => setIsEditing(false)}
        onSuccess={() => setIsEditing(false)}
      />
    );
  }

  const isLongBody = (draft.body?.length ?? 0) > 280 || (draft.body?.split("\n").length ?? 0) > 4;

  return (
    <div className="card flex flex-col justify-between transition-shadow hover:shadow-sm">
      <div className="space-y-3">
        {/* Top badges: Subreddit, Account, and Timestamp */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {cleanSubreddit ? (
              <span className="pill bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-300">
                r/{cleanSubreddit}
              </span>
            ) : (
              <span className="pill bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                No subreddit
              </span>
            )}
            {draft.account ? (
              <span className="pill bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300">
                u/{draft.account.username}
              </span>
            ) : (
              <span className="pill bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                Any account
              </span>
            )}
          </div>
          <span className="muted text-xs">
            Updated <LocalTime iso={draft.updatedAt} />
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 leading-snug">
          {draft.title}
        </h3>

        {/* Link URL preview */}
        {draft.linkUrl && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-400">🔗 Link:</span>
            <a
              href={draft.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link truncate max-w-md"
            >
              {draft.linkUrl}
            </a>
          </div>
        )}

        {/* Body content preview */}
        {draft.body && (
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80">
            <div
              className={`text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed ${
                isLongBody && !expanded ? "line-clamp-4" : ""
              }`}
            >
              {draft.body}
            </div>
            {isLongBody && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="mt-2 text-xs font-medium text-orange-600 hover:underline dark:text-orange-400"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* Internal notes */}
        {draft.notes && (
          <div className="rounded border border-amber-200 bg-amber-50/70 px-2.5 py-1.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <span className="font-semibold">💡 Note:</span> {draft.notes}
          </div>
        )}
      </div>

      {/* Copy Toolbar and Actions */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <CopyButton text={draft.title} label="Title" copiedLabel="Title Copied!" />
          {draft.body && <CopyButton text={draft.body} label="Body" copiedLabel="Body Copied!" />}
          {draft.linkUrl && <CopyButton text={draft.linkUrl} label="Link" copiedLabel="Link Copied!" />}
          <CopyButton text={fullCopyText} label="All" copiedLabel="All Copied!" />

          <a
            href={redditSubmitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs inline-flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400"
            title="Open Reddit Submit page prefilled with this draft"
          >
            <span>↗</span> Open Reddit
          </a>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-zinc-600 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Edit
          </button>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Full Interactive Drafts List with search and filtering */
export function DraftsManager({
  initialDrafts,
  accounts,
  subreddits,
}: {
  initialDrafts: SerializedDraft[];
  accounts: AccountOption[];
  subreddits: SubredditOption[];
}) {
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("ALL");
  const [subredditFilter, setSubredditFilter] = useState("ALL");

  // Distinct subreddits present in drafts
  const draftSubreddits = useMemo(() => {
    const set = new Set<string>();
    for (const d of initialDrafts) {
      if (d.targetSubreddit) set.add(d.targetSubreddit);
    }
    return Array.from(set).sort();
  }, [initialDrafts]);

  const filteredDrafts = useMemo(() => {
    return initialDrafts.filter((draft) => {
      if (accountFilter !== "ALL") {
        if (accountFilter === "UNASSIGNED" && draft.accountId !== null) return false;
        if (accountFilter !== "UNASSIGNED" && draft.accountId !== accountFilter) return false;
      }
      if (subredditFilter !== "ALL") {
        if (subredditFilter === "UNASSIGNED" && draft.targetSubreddit !== null) return false;
        if (subredditFilter !== "UNASSIGNED" && draft.targetSubreddit?.toLowerCase() !== subredditFilter.toLowerCase()) {
          return false;
        }
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = draft.title.toLowerCase().includes(q);
        const matchesBody = draft.body?.toLowerCase().includes(q) ?? false;
        const matchesSubreddit = draft.targetSubreddit?.toLowerCase().includes(q) ?? false;
        const matchesNotes = draft.notes?.toLowerCase().includes(q) ?? false;
        const matchesAccount = draft.account?.username.toLowerCase().includes(q) ?? false;
        if (!matchesTitle && !matchesBody && !matchesSubreddit && !matchesNotes && !matchesAccount) {
          return false;
        }
      }
      return true;
    });
  }, [initialDrafts, search, accountFilter, subredditFilter]);

  return (
    <div className="space-y-6">
      {/* Create Draft Form */}
      <DraftForm
        accounts={accounts}
        subreddits={subreddits}
        isCollapsedDefault={initialDrafts.length > 0}
      />

      {/* Filter and Search Bar */}
      {initialDrafts.length > 0 && (
        <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-zinc-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search drafts by title, body, subreddit, notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-8"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="input text-xs"
              aria-label="Filter by account"
            >
              <option value="ALL">All accounts</option>
              <option value="UNASSIGNED">Unassigned</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  u/{a.username}
                </option>
              ))}
            </select>

            <select
              value={subredditFilter}
              onChange={(e) => setSubredditFilter(e.target.value)}
              className="input text-xs"
              aria-label="Filter by subreddit"
            >
              <option value="ALL">All subreddits</option>
              <option value="UNASSIGNED">No subreddit</option>
              {draftSubreddits.map((sub) => (
                <option key={sub} value={sub}>
                  r/{sub}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Drafts List */}
      {initialDrafts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No draft posts yet.</p>
          <p className="muted mt-1 text-xs">
            Save draft titles and bodies above so you can easily copy and paste them into Reddit when you are ready to post.
          </p>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No matching drafts found.</p>
          <p className="muted mt-1 text-xs">Try clearing your search query or filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setAccountFilter("ALL");
              setSubredditFilter("ALL");
            }}
            className="btn-secondary mt-3 text-xs"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="muted text-xs">
              Showing {filteredDrafts.length} of {initialDrafts.length} draft{initialDrafts.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredDrafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                accounts={accounts}
                subreddits={subreddits}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Compact Widget for Dashboard or Account Detail Page */
export function RecentDraftsWidget({
  drafts,
  accounts,
  subreddits,
  title = "Saved Drafts",
  viewAllHref = "/drafts",
}: {
  drafts: SerializedDraft[];
  accounts: AccountOption[];
  subreddits?: SubredditOption[];
  title?: string;
  viewAllHref?: string;
}) {
  if (drafts.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
          <Link href="/drafts" className="text-xs link">
            + Create Draft
          </Link>
        </div>
        <p className="muted mt-2 text-xs">
          No drafts saved yet. Save your post titles and text in advance so they are ready to copy when safe to post.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
          <span className="pill bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {drafts.length}
          </span>
        </div>
        <Link href={viewAllHref} className="text-xs link">
          Manage all drafts →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {drafts.slice(0, 3).map((draft) => (
          <DraftCard
            key={draft.id}
            draft={draft}
            accounts={accounts}
            subreddits={subreddits}
          />
        ))}
      </div>
    </div>
  );
}
