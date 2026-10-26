import Link from "next/link";
import { AccountsSection } from "@/components/accounts-section";
import { ConfirmSubmitButton, CopyIconButton, LocalTime, TrashIcon } from "@/components/client";
import { LogCommentForm } from "@/components/log-comment-form";
import { LogPostForm } from "@/components/log-post-form";
import { requireUser } from "@/lib/auth";
import { accountsWithSafety } from "@/lib/data";
import { db } from "@/lib/db";
import { deletePost } from "./actions";

export const instant = false;

export default async function HomePage() {
  const user = await requireUser();
  const [accounts, unclassifiedSubreddits, recentPosts] = await Promise.all([
    accountsWithSafety(user.id),
    db.subreddit.findMany({
      // Only subreddits with posts need classifying; comment-only ones don't.
      where: { userId: user.id, kind: null, posts: { some: {} } },
      orderBy: { createdAt: "desc" },
    }),
    db.post.findMany({
      where: { account: { userId: user.id } },
      orderBy: { postedAt: "desc" },
      take: 10,
      include: { account: true, subreddit: true },
    }),
  ]);

  const readyCount = accounts.filter((a) => a.safety.safeNow).length;
  const cooldownCount = accounts.length - readyCount;
  const totalPosts24h = accounts.reduce((acc, a) => acc + a.safety.postsLast24h, 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Reddit Account Health Tracker
          </h1>
          <p className="muted mt-1">
            Space out posts across accounts to avoid spam detection, shadowbans, and removals.
          </p>
        </div>
      </div>

      {/* Unclassified Subreddits Alert Banner */}
      {unclassifiedSubreddits.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">
                ⚠️ {unclassifiedSubreddits.length} new {unclassifiedSubreddits.length === 1 ? "subreddit needs" : "subreddits need"} classification
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Categorizing subreddits as <strong>Main</strong> or <strong>Crosspost</strong> enables automatic crosspost linking.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {unclassifiedSubreddits.slice(0, 3).map((sub) => (
                <Link
                  key={sub.id}
                  href={`/subreddits/${sub.id}/classify`}
                  className="rounded-lg bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700"
                >
                  Classify r/{sub.displayName} →
                </Link>
              ))}
              {unclassifiedSubreddits.length > 3 && (
                <Link href="/subreddits" className="text-xs font-semibold underline self-center">
                  View all ({unclassifiedSubreddits.length})
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Metrics */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="card py-4">
            <p className="muted text-xs uppercase tracking-wider">Total Accounts</p>
            <p className="mt-1 text-2xl font-bold">{accounts.length}</p>
          </div>
          <div className="card py-4">
            <p className="muted text-xs uppercase tracking-wider">Ready to Post</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{readyCount}</p>
          </div>
          <div className="card py-4">
            <p className="muted text-xs uppercase tracking-wider">In Cooldown</p>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{cooldownCount}</p>
          </div>
          <div className="card py-4">
            <p className="muted text-xs uppercase tracking-wider">24h Total Posts</p>
            <p className="mt-1 text-2xl font-bold">{totalPosts24h}</p>
          </div>
        </div>
      )}

      {/* Log Post Card (when accounts exist) */}
      {accounts.length > 0 && (
        <div className="card shadow-sm border-zinc-200 dark:border-zinc-800">
          <div className="mb-3">
            <h2 className="text-base font-semibold">Log a Post</h2>
            <p className="muted text-xs">
              Paste the Reddit post URL. The subreddit is automatically detected and the account’s safe interval updates immediately.
            </p>
          </div>
          <LogPostForm accounts={accounts.map((a) => ({ id: a.id, username: a.username }))} />

          <div className="mt-5 mb-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <h2 className="text-base font-semibold">Log a Comment</h2>
            <p className="muted text-xs">
              Paste the link to your comment. Comments don’t affect post timing, but a bot-like commenting pace is flagged.
            </p>
          </div>
          <LogCommentForm accounts={accounts.map((a) => ({ id: a.id, username: a.username }))} />
        </div>
      )}

      <AccountsSection accounts={accounts} />

      {/* Recent Activity Feed */}
      {recentPosts.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">Recent Posts Activity</h2>
              <p className="muted text-xs">Latest posts logged across your accounts.</p>
            </div>
            <Link href="/subreddits" className="text-xs font-medium link">
              Manage Subreddits →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 pr-4 font-medium">Account</th>
                  <th className="py-2.5 pr-4 font-medium">Subreddit</th>
                  <th className="py-2.5 pr-4 font-medium">Link</th>
                  <th className="py-2.5 pr-4 font-medium">Posted At</th>
                  <th className="py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {recentPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30">
                    <td className="py-2.5 pr-4 font-medium">
                      <Link href={`/accounts/${post.account.id}`} className="hover:underline">
                        u/{post.account.username}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-medium">r/{post.subreddit.displayName}</span>
                        {post.subreddit.kind ? (
                          <span
                            className={`pill text-[10px] ${
                              post.subreddit.kind === "MAIN"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                            }`}
                          >
                            {post.subreddit.kind === "MAIN" ? "Main" : "Crosspost"}
                          </span>
                        ) : (
                          <Link
                            href={`/subreddits/${post.subreddit.id}/classify`}
                            className="pill bg-amber-100 text-amber-800 text-[10px] hover:underline"
                          >
                            Classify
                          </Link>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 max-w-xs truncate">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link truncate block text-xs"
                      >
                        {post.url}
                      </a>
                    </td>
                    <td className="py-2.5 pr-4 muted text-xs whitespace-nowrap">
                      <LocalTime iso={post.postedAt.toISOString()} />
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <CopyIconButton text={post.url} />
                        <form action={deletePost.bind(null, post.id)}>
                          <ConfirmSubmitButton
                            className="btn-icon hover:!text-red-600 dark:hover:!text-red-400"
                            confirmMessage="Are you sure you want to delete this logged post?"
                            title="Delete post"
                          >
                            <TrashIcon />
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
