import { describe, expect, it } from "vitest";
import { buildRedditSubmitUrl, cleanSubredditName, formatDraftForClipboard } from "./drafts";

describe("cleanSubredditName", () => {
  it("cleans empty or null", () => {
    expect(cleanSubredditName(null)).toBe("");
    expect(cleanSubredditName(undefined)).toBe("");
    expect(cleanSubredditName("")).toBe("");
  });

  it("strips r/ and leading slashes", () => {
    expect(cleanSubredditName("r/AskReddit")).toBe("AskReddit");
    expect(cleanSubredditName("/r/technology")).toBe("technology");
    expect(cleanSubredditName("R/ProgrammerHumor")).toBe("ProgrammerHumor");
    expect(cleanSubredditName("nextjs")).toBe("nextjs");
  });
});

describe("buildRedditSubmitUrl", () => {
  it("builds submit url with subreddit and text", () => {
    const url = buildRedditSubmitUrl({
      title: "My Great Post",
      body: "Here is the post body",
      targetSubreddit: "r/reactjs",
    });
    expect(url).toContain("https://www.reddit.com/r/reactjs/submit");
    expect(url).toContain("title=My+Great+Post");
    expect(url).toContain("text=Here+is+the+post+body");
  });

  it("builds submit url with link", () => {
    const url = buildRedditSubmitUrl({
      title: "Check this out",
      linkUrl: "https://example.com/article",
      targetSubreddit: "technology",
    });
    expect(url).toContain("https://www.reddit.com/r/technology/submit");
    expect(url).toContain("title=Check+this+out");
    expect(url).toContain("url=https%3A%2F%2Fexample.com%2Farticle");
  });

  it("defaults to generic reddit submit when no subreddit provided", () => {
    const url = buildRedditSubmitUrl({
      title: "General Post",
    });
    expect(url).toContain("https://www.reddit.com/submit?title=General+Post");
  });
});

describe("formatDraftForClipboard", () => {
  it("formats title only", () => {
    expect(formatDraftForClipboard({ title: "Hello World" })).toBe("Hello World");
  });

  it("formats title and body", () => {
    const formatted = formatDraftForClipboard({
      title: "Hello World",
      body: "Line 1\nLine 2",
    });
    expect(formatted).toBe("Hello World\n\n\nLine 1\nLine 2");
  });

  it("formats title, link, and body", () => {
    const formatted = formatDraftForClipboard({
      title: "Show Hacker News",
      linkUrl: "https://news.ycombinator.com",
      body: "Thought this was interesting",
    });
    expect(formatted).toBe(
      "Show Hacker News\n\nLink: https://news.ycombinator.com\n\n\nThought this was interesting"
    );
  });
});
