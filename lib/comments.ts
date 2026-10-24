/**
 * Flags commenting that starts to look automated. Comments never block posting;
 * this is an advisory indicator so an account's pace stays human.
 *
 * Reddit's filters treat accounts that leave many comments in a short window, or
 * several within seconds of each other, as bots or spammers.
 */
export const COMMENT_RULES = {
  /** Comments in the last hour that count as a busy pace. */
  busyPerHour: 5,
  /** Comments in the last hour that look bot-like. */
  spammyPerHour: 10,
  /** Comments in the last 24 hours that count as a busy pace. */
  busyPer24h: 30,
  /** Comments in the last 24 hours that look bot-like. */
  spammyPer24h: 60,
  /** This many comments within `burstWindowMinutes` of each other look bot-like. */
  burstCount: 3,
  burstWindowMinutes: 2,
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export type CommentLevel = "normal" | "busy" | "spammy";

export type CommentActivity = {
  level: CommentLevel;
  lastHour: number;
  last24h: number;
  lastCommentAt: Date | null;
  /** When the pace drops back to normal if no more comments are made. Null when already normal. */
  calmAt: Date | null;
  /** Human-readable explanations of what's driving the level. */
  reasons: string[];
};

export function computeCommentActivity(
  commentedAt: Date[],
  now: Date = new Date(),
  rules = COMMENT_RULES,
): CommentActivity {
  const sorted = commentedAt
    .filter((d) => d.getTime() <= now.getTime())
    .sort((a, b) => b.getTime() - a.getTime());
  const age = (d: Date) => now.getTime() - d.getTime();
  const hour = sorted.filter((d) => age(d) < HOUR);
  const day = sorted.filter((d) => age(d) < DAY);

  let level: CommentLevel = "normal";
  const raise = (to: CommentLevel) => {
    if (to === "spammy" || level === "normal") level = to;
  };
  const reasons: string[] = [];
  let calmAt = 0;

  // A window stops counting as busy once enough comments age out to get back under the busy threshold.
  const windowCheck = (inWindow: Date[], windowMs: number, busy: number, spammy: number, label: string) => {
    if (inWindow.length >= spammy) {
      raise("spammy");
      reasons.push(`${inWindow.length} comments in the last ${label} is bot-like (${spammy}+).`);
    } else if (inWindow.length >= busy) {
      raise("busy");
      reasons.push(`${inWindow.length} comments in the last ${label} is a busy pace (${busy}+).`);
    } else return;
    calmAt = Math.max(calmAt, inWindow[busy - 1].getTime() + windowMs);
  };
  windowCheck(hour, HOUR, rules.busyPerHour, rules.spammyPerHour, "hour");
  windowCheck(day, DAY, rules.busyPer24h, rules.spammyPer24h, "24 hours");

  // Rapid-fire bursts within the last hour.
  const burstMs = rules.burstWindowMinutes * MINUTE;
  for (let i = 0; i + rules.burstCount - 1 < hour.length; i++) {
    if (hour[i].getTime() - hour[i + rules.burstCount - 1].getTime() <= burstMs) {
      raise("spammy");
      reasons.push(
        `${rules.burstCount} comments within ${rules.burstWindowMinutes} minutes looks automated.`,
      );
      calmAt = Math.max(calmAt, hour[i].getTime() + HOUR);
      break;
    }
  }

  return {
    level,
    lastHour: hour.length,
    last24h: day.length,
    lastCommentAt: sorted[0] ?? null,
    calmAt: level === "normal" ? null : new Date(calmAt),
    reasons,
  };
}
