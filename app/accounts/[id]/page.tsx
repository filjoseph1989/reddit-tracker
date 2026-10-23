import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmitButton, LocalTime, SafeStatus } from "@/components/client";
import { LogPostForm } from "@/components/log-post-form";
import { requireUser } from "@/lib/auth";
import { accountsWithSafety } from "@/lib/data";
import { RULES } from "@/lib/safety";
import { deleteAccount, deletePost } from "../../actions";

export const instant = false;

type AccountPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AccountDetailPage({ params }: AccountPageProps) {
  const { id } = await params;
  const user = await requireUser();
  const accounts = await accountsWithSafety(user.id, id);
  const account = accounts[0];

  if (!account) {
    notFound();
  }

  const { safety } = account;

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Navigation */}
      <div>
        <Link href="/" className="text-sm font-medium link inline-flex items-center gap-1">
          ← Back to all accounts
        </Link>
      </div>

      {/* Account Header */}
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              u/{account.username}
            </h1>
            {account.posts.length < RULES.warmupPostCount ? (
              <span className="pill bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Warming up ({account.posts.length}/{RULES.warmupPostCount} posts)
              </span>
            ) : (
              <span className="pill bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Established Account
              </span>
            )}
          </div>
          <p className="muted text-xs mt-1">
            Added <LocalTime iso={account.createdAt.toISOString()} /> · {account.posts.length} total posts recorded
          </p>
        </div>

        <form action={deleteAccount.bind(null, account.id)}>
          <ConfirmSubmitButton
            className="btn-danger text-sm"
            confirmMessage={`Are you sure you want to delete u/${account.username} and all its logged posts? This cannot be undone.`}
          >
            Delete Account
          </ConfirmSubmitButton>
        </form>
      </div>

      {/* Safety Status & Health Calculation (Hero Card) */}
      <div className="card space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-5 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold">Account Health & Safe Post Window</h2>
            <p className="muted text-xs">
              Based on posting history and Reddit anti-spam patterns.
            </p>
          </div>
          <SafeStatus iso={safety.nextSafeAt?.toISOString() ?? null} size="lg" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-zinc-50 p-3.5 dark:bg-zinc-800/40">
            <p className="muted text-xs">Next Safe Time</p>
            <p className="mt-1 font-semibold text-sm">
              {safety.safeNow ? (
                <span className="text-emerald-600 dark:text-emerald-400">Safe now</span>
              ) : safety.nextSafeAt ? (
                <LocalTime iso={safety.nextSafeAt.toISOString()} />
              ) : (
                "Ready now"
              )}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3.5 dark:bg-zinc-800/40">
            <p className="muted text-xs">Calculated Interval Gap</p>
            <p className="mt-1 font-semibold text-sm">{safety.gapMinutes} minutes</p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3.5 dark:bg-zinc-800/40">
            <p className="muted text-xs">Posts in 24h Window</p>
            <p className="mt-1 font-semibold text-sm">
              {safety.postsLast24h} of {RULES.maxPostsPer24h} max
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3.5 dark:bg-zinc-800/40">
            <p className="muted text-xs">Warmup Progress</p>
            <p className="mt-1 font-semibold text-sm">
              {Math.min(account.posts.length, RULES.warmupPostCount)} / {RULES.warmupPostCount} posts
            </p>
          </div>
        </div>

        {/* Factors driving the interval calculation */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            Safety Calculation Factors
          </h3>
          <ul className="space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
            {safety.reasons.length > 0 ? (
              safety.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span>{reason}</span>
                </li>
              ))
            ) : (
              <li className="flex items-start gap-2 text-zinc-500">
                <span>•</span>
                <span>Standard safe spacing rules apply. Base cooldown is {RULES.baseGapMinutes} minutes.</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Subreddit Cooldowns */}
      <div className="card space-y-4">
        <div>
          <h2 className="text-base font-semibold">Subreddit 24-Hour Cooldowns</h2>
          <p className="muted text-xs">
            Posting to the same subreddit repeatedly within 24 hours triggers Reddit spam filters.
          </p>
        </div>

        {safety.subredditCooldowns.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            ✅ No active subreddit cooldowns for u/{account.username}. All communities are open for posting.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {safety.subredditCooldowns.map((sc) => (
              <div
                key={sc.subreddit}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-800/40"
              >
                <div className="font-medium">r/{sc.subreddit}</div>
                <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Cooldown until <LocalTime iso={sc.until.toISOString()} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Post Form pre-selected for this account */}
      <div className="card space-y-3">
        <div>
          <h2 className="text-base font-semibold">Log a Post for u/{account.username}</h2>
          <p className="muted text-xs">
            Record a newly published Reddit link to update safety intervals.
          </p>
        </div>
        <LogPostForm accounts={[{ id: account.id, username: account.username }]} />
      </div>

      {/* Post History */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Post History ({account.posts.length})</h2>
            <p className="muted text-xs">All recorded posts for this account.</p>
          </div>
        </div>

        {account.posts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
            No posts logged yet for u/{account.username}. Log your first post above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 pr-4 font-medium">Subreddit</th>
                  <th className="py-2.5 pr-4 font-medium">Reddit Post URL</th>
                  <th className="py-2.5 pr-4 font-medium">Posted At</th>
                  <th className="py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {account.posts.map((post) => (
                  <tr key={post.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">r/{post.subreddit.displayName}</span>
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
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 max-w-sm truncate">
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
                    <td className="py-2.5 text-right">
                      <form action={deletePost.bind(null, post.id)}>
                        <ConfirmSubmitButton
                          className="btn-danger text-xs"
                          confirmMessage="Delete this logged post record?"
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
