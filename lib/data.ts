import "server-only";
import { db } from "./db";
import { computeSafety } from "./safety";

export async function accountsWithSafety(userId: string, accountId?: string) {
  const accounts = await db.redditAccount.findMany({
    where: { userId, ...(accountId && { id: accountId }) },
    orderBy: { createdAt: "asc" },
    include: { posts: { orderBy: { postedAt: "desc" }, include: { subreddit: true } } },
  });

  const now = new Date();
  return accounts.map((account) => ({
    ...account,
    safety: computeSafety(
      account.posts.map((p) => ({ postedAt: p.postedAt, subreddit: p.subreddit.displayName })),
      now,
    ),
  }));
}
