import Link from "next/link";
import { LogCommentForm } from "@/components/log-comment-form";
import { LogPostForm } from "@/components/log-post-form";
import { RecentPosts } from "@/components/recent-posts";
import { requireUser } from "@/lib/auth";
import { accountsWithSafety } from "@/lib/data";
import { db } from "@/lib/db";

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

      {/* Accounts Link */}
      <Link
        href="/accounts"
        className="card flex items-center justify-between gap-4 transition hover:border-zinc-300 dark:hover:border-zinc-700"
      >
        <div>
          <h2 className="text-base font-semibold">Your Reddit Accounts</h2>
          <p className="muted text-xs">
            {accounts.length > 0
              ? `${readyCount} of ${accounts.length} safe to post. See each account's cooldown and activity.`
              : "Add your Reddit accounts to start tracking safe posting intervals."}
          </p>
        </div>
        <span className="text-sm font-medium link whitespace-nowrap">
          {accounts.length > 0 ? "View accounts →" : "Add Account →"}
        </span>
      </Link>

      <RecentPosts posts={recentPosts} />
    </div>
  );
}
