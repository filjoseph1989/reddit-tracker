/**
 * Works out when a Reddit account can post again without looking like a spammer.
 *
 * Reddit's spam filters react to bursts: many posts in a short window, a new or
 * quiet account suddenly posting a lot, and the same subreddit hit repeatedly.
 * The rules below space posts out based on the account's own history.
 */
export const RULES = {
  /** Minimum gap after any post. */
  baseGapMinutes: 60,
  /** Extra gap added for every post already made in the last 24 hours. */
  gapPerRecentPostMinutes: 30,
  /** The gap never grows beyond this. */
  maxGapMinutes: 6 * 60,
  /** Accounts with fewer logged posts than this get double gaps while they build history. */
  warmupPostCount: 10,
  /** Hard cap on posts in any rolling 24-hour window. */
  maxPostsPer24h: 6,
  /** Wait this long before posting in the same subreddit again from the same account. */
  sameSubredditCooldownHours: 24,
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export type PostLike = { postedAt: Date; subreddit: string };

export type Safety = {
  /** When the account is next safe to post. Null if it has never posted. */
  nextSafeAt: Date | null;
  safeNow: boolean;
  gapMinutes: number;
  postsLast24h: number;
  lastPostAt: Date | null;
  /** Human-readable explanations of what's driving the wait. */
  reasons: string[];
  /** Subreddits this account should avoid until the given time. */
  subredditCooldowns: { subreddit: string; until: Date }[];
};

export function computeSafety(posts: PostLike[], now: Date = new Date(), rules = RULES): Safety {
  const sorted = posts
    .filter((p) => p.postedAt.getTime() <= now.getTime())
    .sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
  const last = sorted[0];
  const recent = sorted.filter((p) => now.getTime() - p.postedAt.getTime() < DAY);

  const subredditCooldowns = cooldowns(sorted, now, rules);

  if (!last) {
    return {
      nextSafeAt: null,
      safeNow: true,
      gapMinutes: 0,
      postsLast24h: 0,
      lastPostAt: null,
      reasons: ["No posts logged yet."],
      subredditCooldowns,
    };
  }

  // Posts made in the 24h before the last post decide how much it should be spaced from the next one.
  const burst = sorted.filter((p) => last.postedAt.getTime() - p.postedAt.getTime() < DAY).length;
  const reasons: string[] = [];
  let gapMinutes = Math.min(
    rules.baseGapMinutes + (burst - 1) * rules.gapPerRecentPostMinutes,
    rules.maxGapMinutes,
  );
  if (burst > 1) reasons.push(`${burst} posts within 24h of the last one widen the gap.`);

  if (sorted.length < rules.warmupPostCount) {
    gapMinutes = Math.min(gapMinutes * 2, rules.maxGapMinutes);
    reasons.push(`Account is still warming up (${sorted.length}/${rules.warmupPostCount} posts logged), so gaps are doubled.`);
  }

  let nextSafe = last.postedAt.getTime() + gapMinutes * MINUTE;

  if (recent.length >= rules.maxPostsPer24h) {
    // Wait until enough posts age out of the rolling window to get back under the cap.
    const blocking = recent[rules.maxPostsPer24h - 1];
    const capClears = blocking.postedAt.getTime() + DAY;
    if (capClears > nextSafe) {
      nextSafe = capClears;
      reasons.push(`Hit the limit of ${rules.maxPostsPer24h} posts in 24h.`);
    }
  }

  return {
    nextSafeAt: new Date(nextSafe),
    safeNow: nextSafe <= now.getTime(),
    gapMinutes,
    postsLast24h: recent.length,
    lastPostAt: last.postedAt,
    reasons,
    subredditCooldowns,
  };
}

function cooldowns(sortedNewestFirst: PostLike[], now: Date, rules: typeof RULES) {
  const seen = new Set<string>();
  const result: { subreddit: string; until: Date }[] = [];
  for (const p of sortedNewestFirst) {
    const key = p.subreddit.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const until = p.postedAt.getTime() + rules.sameSubredditCooldownHours * HOUR;
    if (until > now.getTime()) result.push({ subreddit: p.subreddit, until: new Date(until) });
  }
  return result.sort((a, b) => a.until.getTime() - b.until.getTime());
}
