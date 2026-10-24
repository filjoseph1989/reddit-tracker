/** Helper functions for Reddit draft posts */

export function cleanSubredditName(raw?: string | null): string {
  if (!raw) return "";
  return raw.replace(/^\/?r\//i, "").trim();
}

export function buildRedditSubmitUrl({
  title,
  body,
  linkUrl,
  targetSubreddit,
}: {
  title: string;
  body?: string | null;
  linkUrl?: string | null;
  targetSubreddit?: string | null;
}): string {
  const cleanSub = cleanSubredditName(targetSubreddit);
  const base = cleanSub
    ? `https://www.reddit.com/r/${encodeURIComponent(cleanSub)}/submit`
    : `https://www.reddit.com/submit`;
  const params = new URLSearchParams();
  params.set("title", title);
  if (linkUrl?.trim()) {
    params.set("url", linkUrl.trim());
  } else if (body?.trim()) {
    params.set("text", body.trim());
  }
  return `${base}?${params.toString()}`;
}

export function formatDraftForClipboard({
  title,
  body,
  linkUrl,
}: {
  title: string;
  body?: string | null;
  linkUrl?: string | null;
}): string {
  const parts = [title.trim()];
  if (linkUrl?.trim()) parts.push(`Link: ${linkUrl.trim()}`);
  if (body?.trim()) parts.push(`\n${body.trim()}`);
  return parts.join("\n\n");
}
