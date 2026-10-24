import { describe, expect, it } from "vitest";
import { COMMENT_RULES, computeCommentActivity } from "./comments";

const now = new Date("2026-10-23T12:00:00Z");
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);
// `count` comments spaced `every` minutes apart, the newest `start` minutes ago.
const spaced = (count: number, every: number, start = 0) =>
  Array.from({ length: count }, (_, i) => minutesAgo(start + i * every));

describe("computeCommentActivity", () => {
  it("is normal with no comments", () => {
    const a = computeCommentActivity([], now);
    expect(a).toMatchObject({ level: "normal", lastHour: 0, last24h: 0, lastCommentAt: null, calmAt: null });
  });

  it("is normal for a few spread-out comments", () => {
    const a = computeCommentActivity(spaced(4, 15), now);
    expect(a.level).toBe("normal");
    expect(a.lastHour).toBe(4);
    expect(a.reasons).toEqual([]);
  });

  it("is busy at the hourly busy threshold", () => {
    const a = computeCommentActivity(spaced(COMMENT_RULES.busyPerHour, 10), now);
    expect(a.level).toBe("busy");
    // Calms down once the oldest of those comments is an hour old.
    expect(a.calmAt).toEqual(minutesAgo(40 - 60));
  });

  it("is spammy at the hourly spammy threshold", () => {
    const a = computeCommentActivity(spaced(COMMENT_RULES.spammyPerHour, 5), now);
    expect(a.level).toBe("spammy");
  });

  it("is busy for a heavy day even when the last hour is quiet", () => {
    const a = computeCommentActivity(spaced(COMMENT_RULES.busyPer24h, 30, 70), now);
    expect(a.lastHour).toBe(0);
    expect(a.level).toBe("busy");
    expect(a.reasons[0]).toMatch(/24 hours/);
  });

  it("is spammy for a rapid-fire burst", () => {
    const a = computeCommentActivity(spaced(COMMENT_RULES.burstCount, 0.5, 5), now);
    expect(a.level).toBe("spammy");
    expect(a.reasons.some((r) => r.includes("automated"))).toBe(true);
    expect(a.calmAt).toEqual(minutesAgo(5 - 60));
  });

  it("ignores bursts older than an hour and future timestamps", () => {
    const a = computeCommentActivity([...spaced(3, 0.5, 90), minutesAgo(-10)], now);
    expect(a.level).toBe("normal");
    expect(a.lastHour).toBe(0);
    expect(a.last24h).toBe(3);
  });
});
