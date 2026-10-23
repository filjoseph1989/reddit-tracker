import Link from "next/link";
import { ActionForm, ConfirmSubmitButton, SubmitButton } from "@/components/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteSubreddit, linkSubreddits, unlinkSubreddits } from "../actions";

export const instant = false;

export default async function SubredditsPage() {
  const user = await requireUser();

  const subreddits = await db.subreddit.findMany({
    where: { userId: user.id },
    include: {
      crosspostLinks: {
        include: { crosspost: true },
        orderBy: { createdAt: "desc" },
      },
      mainLinks: {
        include: { main: true },
        orderBy: { createdAt: "desc" },
      },
      posts: true,
    },
    orderBy: { name: "asc" },
  });

  const unclassified = subreddits.filter((s) => !s.kind);
  const mainSubreddits = subreddits.filter((s) => s.kind === "MAIN");
  const crosspostSubreddits = subreddits.filter((s) => s.kind === "CROSSPOST");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Subreddit Relationships & Distribution
        </h1>
        <p className="muted text-sm mt-1">
          Manage your main original content subreddits, see where posts get crossposted, and keep communities organized.
        </p>
      </div>

      {/* Unclassified Notice */}
      {unclassified.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800/60 dark:bg-amber-950/40">
          <h2 className="text-base font-semibold text-amber-900 dark:text-amber-200">
            ⚠️ Action Needed: {unclassified.length} {unclassified.length === 1 ? "subreddit needs" : "subreddits need"} classification
          </h2>
          <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
            Specify whether each subreddit is a <strong>Main</strong> community for original content or a <strong>Crosspost</strong> community.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {unclassified.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm border border-amber-200 dark:bg-zinc-900 dark:border-amber-800"
              >
                <span className="font-semibold text-xs">r/{sub.displayName}</span>
                <Link
                  href={`/subreddits/${sub.id}/classify`}
                  className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200"
                >
                  Classify →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Subreddits & Their Crosspost Links */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Main Subreddits (Original Posts)</h2>
            <p className="muted text-xs">
              Communities where you publish original posts, with the crosspost subreddits they feed into.
            </p>
          </div>
          <span className="pill bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            {mainSubreddits.length} Main
          </span>
        </div>

        {mainSubreddits.length === 0 ? (
          <div className="card text-center py-8 text-sm text-zinc-500">
            No main subreddits classified yet. Subreddits are automatically added when you log posts.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {mainSubreddits.map((main) => {
              const linkedIds = new Set(main.crosspostLinks.map((l) => l.crosspostId));
              const availableToLink = crosspostSubreddits.filter((cp) => !linkedIds.has(cp.id));

              return (
                <div key={main.id} className="card flex flex-col justify-between border-zinc-200 dark:border-zinc-800">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
                      <div>
                        <a
                          href={`https://www.reddit.com/r/${main.displayName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-base hover:text-orange-600 transition"
                        >
                          r/{main.displayName}
                        </a>
                        <p className="muted text-xs mt-0.5">
                          {main.posts.length} {main.posts.length === 1 ? "post" : "posts"} logged
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/subreddits/${main.id}/classify`}
                          className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline"
                        >
                          Change type
                        </Link>
                        <form action={deleteSubreddit.bind(null, main.id)}>
                          <ConfirmSubmitButton
                            className="btn-danger text-xs"
                            confirmMessage={`Delete r/${main.displayName} from tracker?`}
                          >
                            Delete
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </div>

                    {/* Linked Crosspost Subreddits */}
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                        Linked Crosspost Channels ({main.crosspostLinks.length}):
                      </p>

                      {main.crosspostLinks.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic">
                          No crosspost subreddits linked yet. When you crosspost within 24h of an original post, it links automatically.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {main.crosspostLinks.map((link) => (
                            <span
                              key={link.crosspostId}
                              className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs text-purple-900 dark:border-purple-900 dark:bg-purple-950/60 dark:text-purple-300"
                            >
                              <span>r/{link.crosspost.displayName}</span>
                              <form action={unlinkSubreddits.bind(null, main.id, link.crosspostId)}>
                                <button
                                  type="submit"
                                  className="text-purple-500 hover:text-red-600 dark:hover:text-red-400 text-xs font-bold leading-none cursor-pointer"
                                  title="Unlink crosspost subreddit"
                                >
                                  ×
                                </button>
                              </form>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline Link Form */}
                  {availableToLink.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                      <ActionForm action={linkSubreddits} className="flex items-center gap-2">
                        <input type="hidden" name="mainId" value={main.id} />
                        <select
                          name="crosspostId"
                          className="input py-1 text-xs flex-1"
                          required
                          aria-label={`Link crosspost to r/${main.displayName}`}
                        >
                          <option value="">+ Link a crosspost subreddit...</option>
                          {availableToLink.map((cp) => (
                            <option key={cp.id} value={cp.id}>
                              r/{cp.displayName}
                            </option>
                          ))}
                        </select>
                        <SubmitButton className="btn-secondary text-xs py-1">Link</SubmitButton>
                      </ActionForm>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Crosspost Subreddits */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Crosspost Subreddits</h2>
            <p className="muted text-xs">
              Communities used exclusively for amplifying content originally posted in main subreddits.
            </p>
          </div>
          <span className="pill bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            {crosspostSubreddits.length} Crosspost
          </span>
        </div>

        {crosspostSubreddits.length === 0 ? (
          <div className="card text-center py-8 text-sm text-zinc-500">
            No crosspost subreddits classified yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {crosspostSubreddits.map((cp) => (
              <div key={cp.id} className="card flex flex-col justify-between border-zinc-200 dark:border-zinc-800">
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
                    <div>
                      <a
                        href={`https://www.reddit.com/r/${cp.displayName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-base hover:text-orange-600 transition"
                      >
                        r/{cp.displayName}
                      </a>
                      <p className="muted text-xs mt-0.5">
                        {cp.posts.length} {cp.posts.length === 1 ? "post" : "posts"} logged
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/subreddits/${cp.id}/classify`}
                        className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline"
                      >
                        Change type
                      </Link>
                      <form action={deleteSubreddit.bind(null, cp.id)}>
                        <ConfirmSubmitButton
                          className="btn-danger text-xs"
                          confirmMessage={`Delete r/${cp.displayName} from tracker?`}
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>

                  {/* Connected Main Subreddits */}
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                      Receives Crossposts From ({cp.mainLinks.length}):
                    </p>

                    {cp.mainLinks.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic">
                        Not linked to any main subreddit yet.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {cp.mainLinks.map((link) => (
                          <span
                            key={link.mainId}
                            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
                          >
                            <span>r/{link.main.displayName}</span>
                            <form action={unlinkSubreddits.bind(null, link.mainId, cp.id)}>
                              <button
                                type="submit"
                                className="text-blue-500 hover:text-red-600 dark:hover:text-red-400 text-xs font-bold leading-none cursor-pointer"
                                title="Unlink"
                              >
                                ×
                              </button>
                            </form>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Linker Card */}
      {mainSubreddits.length > 0 && crosspostSubreddits.length > 0 && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-base font-semibold">Link Main & Crosspost Subreddits</h2>
            <p className="muted text-xs">
              Connect a main original content subreddit to a crosspost target community.
            </p>
          </div>

          <ActionForm action={linkSubreddits} className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium muted mb-1">Main Subreddit (Source)</label>
              <select name="mainId" className="input w-full" required>
                <option value="">Select main subreddit...</option>
                {mainSubreddits.map((m) => (
                  <option key={m.id} value={m.id}>
                    r/{m.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium muted mb-1">Crosspost Subreddit (Target)</label>
              <select name="crosspostId" className="input w-full" required>
                <option value="">Select crosspost subreddit...</option>
                {crosspostSubreddits.map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    r/{cp.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="self-end">
              <SubmitButton className="btn-primary">Connect Subreddits</SubmitButton>
            </div>
          </ActionForm>
        </div>
      )}
    </div>
  );
}
