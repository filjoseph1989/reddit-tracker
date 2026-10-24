"use client";

import Link from "next/link";
import { useState } from "react";
import { classifySubreddit } from "@/app/actions";
import { ActionForm, LocalTime, SubmitButton } from "./client";

export type CandidatePost = {
  id: string;
  url: string;
  username: string;
  subreddit: string;
  postedAt: string;
};

type Kind = "MAIN" | "CROSSPOST";
type Source = "tracked" | "url";

const cardClass =
  "flex items-start gap-3 rounded-xl border border-zinc-200 p-4 cursor-pointer hover:border-orange-500 hover:bg-orange-50/20 transition dark:border-zinc-800 dark:hover:border-orange-500/50";

/**
 * "Main or crosspost?" for a subreddit. When classifying the subreddit of a post
 * just logged as a crosspost, also asks which post it was crossposted from.
 */
export function ClassifyForm({
  subredditId,
  initialKind,
  postId,
  next,
  candidates,
  defaultOriginalId,
  accounts,
}: {
  subredditId: string;
  initialKind: Kind | null;
  postId?: string;
  next?: string;
  candidates: CandidatePost[];
  defaultOriginalId?: string;
  accounts: { id: string; username: string }[];
}) {
  const [kind, setKind] = useState<Kind>(initialKind ?? "MAIN");
  const [source, setSource] = useState<Source>(candidates.length > 0 ? "tracked" : "url");
  const cancelHref = next || "/subreddits";

  return (
    <ActionForm action={classifySubreddit} className="space-y-4">
      <input type="hidden" name="subredditId" value={subredditId} />
      <input type="hidden" name="postId" value={postId ?? ""} />
      <input type="hidden" name="next" value={next ?? ""} />

      <div className="space-y-3">
        {/* Option 1: Main */}
        <label className={cardClass}>
          <input
            type="radio"
            name="kind"
            value="MAIN"
            checked={kind === "MAIN"}
            onChange={() => setKind("MAIN")}
            className="mt-1 h-4 w-4 text-orange-600 accent-orange-600"
            required
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Main Subreddit</span>
              <span className="pill bg-blue-100 text-blue-800 text-[10px] dark:bg-blue-950 dark:text-blue-300">
                Original Posts
              </span>
            </div>
            <p className="muted text-xs mt-1">
              Where you regularly make original posts. This serves as your primary content source. Subsequent crossposts within 24 hours will automatically link back to this subreddit.
            </p>
          </div>
        </label>

        {/* Option 2: Crosspost */}
        <label className={cardClass}>
          <input
            type="radio"
            name="kind"
            value="CROSSPOST"
            checked={kind === "CROSSPOST"}
            onChange={() => setKind("CROSSPOST")}
            className="mt-1 h-4 w-4 text-orange-600 accent-orange-600"
            required
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Crosspost Subreddit</span>
              <span className="pill bg-purple-100 text-purple-800 text-[10px] dark:bg-purple-950 dark:text-purple-300">
                Crossposts Only
              </span>
            </div>
            <p className="muted text-xs mt-1">
              Where you only crosspost existing submissions. The tracker connects this community to the main subreddit from which the post was originally shared.
            </p>
          </div>
        </label>
      </div>

      {kind === "CROSSPOST" && postId && (
        <fieldset className="space-y-3 rounded-xl border border-purple-200 bg-purple-50/40 p-4 dark:border-purple-900/60 dark:bg-purple-950/20">
          <legend className="px-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Which post was this crossposted from?
          </legend>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="originalSource"
                value="tracked"
                checked={source === "tracked"}
                onChange={() => setSource("tracked")}
                disabled={candidates.length === 0}
                className="h-4 w-4 accent-orange-600"
              />
              <span className={candidates.length === 0 ? "text-zinc-400 dark:text-zinc-600" : ""}>
                It&apos;s one of my logged posts
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="originalSource"
                value="url"
                checked={source === "url"}
                onChange={() => setSource("url")}
                className="h-4 w-4 accent-orange-600"
              />
              <span>It isn&apos;t in the tracker</span>
            </label>
          </div>

          {source === "tracked" ? (
            <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {candidates.map((c) => (
                <label
                  key={c.id}
                  className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-2.5 text-xs cursor-pointer hover:border-orange-500 has-[:checked]:border-orange-500 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <input
                    type="radio"
                    name="originalPostId"
                    value={c.id}
                    defaultChecked={c.id === defaultOriginalId}
                    className="mt-0.5 h-3.5 w-3.5 accent-orange-600"
                    required
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-zinc-900 dark:text-zinc-100">
                      <span className="font-semibold">r/{c.subreddit}</span>
                      <span className="muted"> · u/{c.username} · <LocalTime iso={c.postedAt} /></span>
                    </p>
                    <p className="muted mt-0.5 truncate">{c.url}</p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="originalUrl" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Original post URL
                </label>
                <input
                  id="originalUrl"
                  name="originalUrl"
                  type="url"
                  placeholder="https://www.reddit.com/r/.../comments/..."
                  className="input w-full"
                  required
                />
              </div>
              {accounts.length > 0 && (
                <div className="space-y-1">
                  <label htmlFor="originalAccountId" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Posted by
                  </label>
                  <select id="originalAccountId" name="originalAccountId" className="input w-full" defaultValue="">
                    <option value="">Someone else (not one of my accounts)</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>u/{a.username}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </fieldset>
      )}

      <div className="pt-2 flex items-center justify-end gap-3">
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
        <SubmitButton className="btn-primary">Save Classification</SubmitButton>
      </div>
    </ActionForm>
  );
}
