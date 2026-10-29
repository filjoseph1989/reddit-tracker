import Link from "next/link";
import { addAccount } from "@/app/actions";
import { ActionForm, LocalTime, SafeCard, SafeStatus, SubmitButton } from "@/components/client";
import { CommentActivityBadge } from "@/components/comment-activity";
import type { accountsWithSafety } from "@/lib/data";
import { RULES } from "@/lib/safety";

type Account = Awaited<ReturnType<typeof accountsWithSafety>>[number];

/** The user's account cards, or an onboarding empty state when there are none. */
export function AccountsSection({ accounts }: { accounts: Account[] }) {
  if (accounts.length === 0) {
    return (
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
    );
  }

  // Safe accounts first, then those cooling down, soonest-ready first.
  const sorted = accounts.toSorted((a, b) => {
    if (a.safety.safeNow !== b.safety.safeNow) return a.safety.safeNow ? -1 : 1;
    return (a.safety.nextSafeAt?.getTime() ?? 0) - (b.safety.nextSafeAt?.getTime() ?? 0);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Reddit Accounts</h2>
      </div>

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

      <div className="grid gap-4 md:grid-cols-2">
        {sorted.map((account) => {
          const { safety, commentActivity } = account;
          return (
            <SafeCard
              key={account.id}
              iso={safety.nextSafeAt?.toISOString() ?? null}
              className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800/80">
                  <div>
                    <Link
                      href={`/accounts/${account.id}`}
                      className="font-bold text-base hover:text-orange-600 transition">
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

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-800/40">
                  <span>
                    <span className="muted">Comments:</span>{" "}
                    <span className="font-medium">{commentActivity.lastHour}</span> in 1h ·{" "}
                    <span className="font-medium">{commentActivity.last24h}</span> in 24h
                  </span>
                  <CommentActivityBadge level={commentActivity.level} />
                </div>

                {safety.reasons.length > 0 && (
                  <div className="mt-3 rounded-lg bg-zinc-50 p-2.5 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
                    <ul className="list-disc pl-4 space-y-1">
                      {safety.reasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {safety.subredditCooldowns.length > 0 && (
                  <div className="mt-3">
                    <p className="muted text-xs mb-1 font-medium">Active community cooldowns (24h):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {safety.subredditCooldowns.map((sc) => (
                        <span
                          key={sc.subreddit}
                          className="pill bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 text-xs"
                          title={`Safe at ${sc.until.toLocaleString()}`}>
                          r/{sc.subreddit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400">
                  History & Details →
                </Link>
              </div>
            </SafeCard>
          );
        })}
      </div>
    </div>
  );
}
