import { describe, expect, it } from "vitest";
import { computeSafety, RULES, type PostLike } from "./safety";
import { parsePostUrl } from "./reddit";

const now = new Date("2026-10-23T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
const post = (h: number, subreddit = "test"): PostLike => ({ postedAt: hoursAgo(h), subreddit });
// Enough old history that warm-up doubling doesn't apply.
const history = Array.from({ length: RULES.warmupPostCount }, (_, i) => post(100 + i * 24, `old${i}`));

describe("computeSafety", () => {
  it("is safe with no posts", () => {
    const s = computeSafety([], now);
    expect(s.safeNow).toBe(true);
    expect(s.nextSafeAt).toBeNull();
  });

  it("uses the base gap after a single post on an established account", () => {
    const s = computeSafety([...history, post(0.5)], now);
    expect(s.gapMinutes).toBe(60);
    expect(s.nextSafeAt).toEqual(hoursAgo(-0.5));
    expect(s.safeNow).toBe(false);
  });

  it("doubles gaps for warming-up accounts", () => {
    const s = computeSafety([post(0.5)], now);
    expect(s.gapMinutes).toBe(120);
  });

  it("widens the gap as posts pile up in 24h", () => {
    const s = computeSafety([...history, post(1), post(3), post(5)], now);
    expect(s.gapMinutes).toBe(60 + 2 * 30);
    expect(s.nextSafeAt).toEqual(hoursAgo(-1));
  });

  it("blocks until the rolling 24h cap clears", () => {
    const recent = [20, 16, 12, 8, 6, 4].map((h) => post(h, `s${h}`));
    const s = computeSafety([...history, ...recent], now);
    // The 6th newest post (20h ago) must age out: 4h from now.
    expect(s.nextSafeAt).toEqual(hoursAgo(-4));
    expect(s.reasons.some((r) => r.includes("limit"))).toBe(true);
  });

  it("tracks per-subreddit cooldowns", () => {
    const s = computeSafety([...history, post(2, "Foo"), post(30, "Bar")], now);
    expect(s.subredditCooldowns).toEqual([{ subreddit: "Foo", until: hoursAgo(-22) }]);
  });

  it("caps gap at maxGapMinutes", () => {
    // 20 posts in last 24h
    const manyPosts = Array.from({ length: 20 }, (_, i) => post(i * 0.5, `sub${i}`));
    const s = computeSafety([...history, ...manyPosts], now);
    expect(s.gapMinutes).toBe(RULES.maxGapMinutes);
  });

  it("keeps newest cooldown when same subreddit posted multiple times", () => {
    const s = computeSafety([...history, post(2, "Foo"), post(5, "Foo")], now);
    expect(s.subredditCooldowns).toEqual([{ subreddit: "Foo", until: hoursAgo(-22) }]);
  });
});

describe("parsePostUrl", () => {
  it("extracts and normalizes", () => {
    expect(parsePostUrl("https://old.reddit.com/r/SideProject/comments/abc/title/?utm=x")).toEqual({
      url: "https://www.reddit.com/r/SideProject/comments/abc/title",
      subreddit: "SideProject",
    });
    expect(parsePostUrl("reddit.com/r/foo/s/xyz").subreddit).toBe("foo");
  });

  it("handles uppercase and extra slashes", () => {
    expect(parsePostUrl("HTTPS://WWW.REDDIT.COM/r/WebDev/comments/123/hello///")).toEqual({
      url: "https://www.reddit.com/r/WebDev/comments/123/hello",
      subreddit: "WebDev",
    });
  });

  it("rejects non-post links", () => {
    expect(() => parsePostUrl("https://redd.it/abc")).toThrow();
    expect(() => parsePostUrl("https://www.reddit.com/user/me")).toThrow();
    expect(() => parsePostUrl("https://example.com/r/foo")).toThrow();
  });
});
