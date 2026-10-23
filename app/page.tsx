import Link from "next/link";
import { ActionForm, ConfirmSubmitButton, LocalTime, SafeStatus, SubmitButton } from "@/components/client";
import { LogPostForm } from "@/components/log-post-form";
import { requireUser } from "@/lib/auth";
import { accountsWithSafety } from "@/lib/data";
import { db } from "@/lib/db";
import { RULES } from "@/lib/safety";
import { addAccount, deletePost } from "./actions";

export const instant = false;

export default async function HomePage() {
  const user = await requireUser();
  const [accounts, unclassifiedSubreddits, recentPosts] = await Promise.all([
    accountsWithSafety(user.id),
    db.subreddit.findMany({
      where: { userId: user.id, kind: null },
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

      {/* Accounts List or Empty State */}
      {accounts.length === 0 ? (
        <div className="card space-y-6 text-center py-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
            <span className="text-2xl">🛡️</span>
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-semibold">No Reddit accounts added yet</h2>
            <p className="muted text-sm">
              Add your Reddit accounts to track safe posting intervals, monitor cooldowns, and prevent your accounts from being filtered or shadowbanned.
            </p>
          </div>

          <div className="max-w-md mx-auto pt-2">
            <ActionForm action={addAccount} className="flex gap-2">
              <input
                name="username"
                type="text"
                placeholder="Reddit username (e.g. u/my_handle)"
                className="input flex-1"
                required
              />
              <SubmitButton>Add Account</SubmitButton>
            </ActionForm>
          </div>

          {/* Education on Safety Rules */}
          <div className="max-w-2xl mx-auto mt-8 border-t border-zinc-200 pt-6 text-left dark:border-zinc-800">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">How the safe spacer works</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">⏱ Dynamic Spacing</p>
                <p className="mt-1">
                  Starts with a minimum {RULES.baseGapMinutes}-minute gap and expands by +{RULES.gapPerRecentPostMinutes}m for each post logged within 24 hours.
                </p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">🌱 Warmup Protection</p>
                <p className="mt-1">
                  Accounts with under {RULES.warmupPostCount} logged posts have their cooldown gaps doubled to safely build history.
                </p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">🚫 Daily Hard Cap</p>
                <p className="mt-1">
                  Restricts each account to at most {RULES.maxPostsPer24h} posts in any rolling 24-hour window.
                </p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">🎯 Subreddit Cooldowns</p>
                <p className="mt-1">
                  Enforces a {RULES.sameSubredditCooldownHours}-hour cooldown before posting to the same subreddit from the same account again.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Reddit Accounts</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map((account) => {
              const { safety } = account;
              return (
                <div
                  key={account.id}
                  className="card flex flex-col justify-between border-zinc-200 transition hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                >
                  <div>
                    {/* Header: Username & Status */}
                    <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
                      <div>
                        <Link
                          href={`/accounts/${account.id}`}
                          className="font-bold text-base hover:text-orange-600 transition"
                        >
                          u/{account.username}
                        </Link>
                        {account.posts.length < RULES.warmupPostCount && (
                          <span className="ml-2 pill bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
                            Warmup ({account.posts.length}/{RULES.warmupPostCount})
                          </span>
                        )}
                      </div>
                      <SafeStatus iso={safety.nextSafeAt?.toISOString() ?? null} />
                    </div>

                    {/* Key Stats */}
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="muted text-xs">Next safe post</p>
                        <p className="font-medium mt-0.5">
                          {safety.safeNow ? (
                            <span className="text-emerald-600 dark:text-emerald-400">Safe now</span>
                          ) : safety.nextSafeAt ? (
                            <LocalTime iso={safety.nextSafeAt.toISOString()} />
                          ) : (
                            "Anytime"
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="muted text-xs">Cooldown interval</p>
                        <p className="font-medium mt-0.5">{safety.gapMinutes} minutes</p>
                      </div>
                      <div>
                        <p className="muted text-xs">Posts in 24h</p>
                        <p className="font-medium mt-0.5">
                          {safety.postsLast24h} / {RULES.maxPostsPer24h}
                        </p>
                      </div>
                      <div>
                        <p className="muted text-xs">Total posts logged</p>
                        <p className="font-medium mt-0.5">{account.posts.length}</p>
                      </div>
                    </div>

                    {/* Reasons / explanations */}
                    {safety.reasons.length > 0 && (
                      <div className="mt-3 rounded-lg bg-zinc-50 p-2.5 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
                        <ul className="list-disc pl-4 space-y-1">
                          {safety.reasons.map((reason, i) => (
                            <li key={i}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Subreddit cooldowns preview */}
                    {safety.subredditCooldowns.length > 0 && (
                      <div className="mt-3">
                        <p className="muted text-xs mb-1 font-medium">Active community cooldowns (24h):</p>
                        <div className="flex flex-wrap gap-1.5">
                          {safety.subredditCooldowns.map((sc) => (
                            <span
                              key={sc.subreddit}
                              className="pill bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 text-xs"
                              title={`Safe at ${sc.until.toLocaleString()}`}
                            >
                              r/{sc.subreddit}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div className="mt-5 border-t border-zinc-100 pt-3 flex items-center justify-between dark:border-zinc-800/80">
                    <span className="muted text-xs">
                      {account.posts[0] ? (
                        <>
                          Last posted <LocalTime iso={account.posts[0].postedAt.toISOString()} />
                        </>
                      ) : (
                        "Never posted"
                      )}
                    </span>
                    <Link
                      href={`/accounts/${account.id}`}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
                    >
                      History & Details →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add another account form */}
          <div className="card mt-6">
            <h3 className="text-sm font-semibold mb-2">Add Another Reddit Account</h3>
            <ActionForm action={addAccount} className="flex flex-wrap gap-2">
              <input
                name="username"
                type="text"
                placeholder="Reddit username (e.g. u/my_other_account)"
                className="input min-w-64 flex-1"
                required
              />
              <SubmitButton>Add Account</SubmitButton>
            </ActionForm>
          </div>
        </div>
      )}

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
                    <td className="py-2.5 text-right">
                      <form action={deletePost.bind(null, post.id)}>
                        <ConfirmSubmitButton
                          className="btn-danger text-xs"
                          confirmMessage="Are you sure you want to delete this logged post?"
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
        </div>
      )}
    </div>
  );
}
