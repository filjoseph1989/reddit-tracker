const REDDIT_HOST = /(^|\.)reddit\.com$/i;
const SUBREDDIT_NAME = /^[A-Za-z0-9][A-Za-z0-9_]{1,20}$/;

export type ParsedPostUrl = { url: string; subreddit: string };

/**
 * Pulls the subreddit out of a Reddit post link, e.g.
 * https://www.reddit.com/r/SideProject/comments/abc123/my_post/ -> "SideProject".
 * Short links (redd.it) don't contain the subreddit, so they're rejected.
 */
export function parsePostUrl(input: string): ParsedPostUrl {
  const raw = input.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new Error("That doesn't look like a link.");
  }

  if (!REDDIT_HOST.test(url.hostname)) {
    throw new Error("Use the full reddit.com link to the post (short redd.it links don't include the subreddit).");
  }

  const [prefix, name] = url.pathname.split("/").filter(Boolean);
  if (prefix?.toLowerCase() !== "r" || !name || !SUBREDDIT_NAME.test(name)) {
    throw new Error("Couldn't find a subreddit in that link. It should look like reddit.com/r/<subreddit>/comments/...");
  }

  // Normalize so the same post logged from old./new./www. links is treated as one.
  url.protocol = "https:";
  url.hostname = "www.reddit.com";
  url.search = "";
  url.hash = "";
  return { url: url.toString().replace(/\/+$/, ""), subreddit: name };
}
