import "server-only";
import { connection } from "next/server";
import { db } from "./db";
import { computeCommentActivity } from "./comments";
import { computeSafety } from "./safety";

export async function accountsWithSafety(userId: string, accountId?: string) {
  await connection();
  const accounts = await db.redditAccount.findMany({
    where: { userId, ...(accountId && { id: accountId }) },
    orderBy: { createdAt: "asc" },
    include: {
      posts: { orderBy: { postedAt: "desc" }, include: { subreddit: true } },
      comments: { orderBy: { commentedAt: "desc" }, include: { subreddit: true } },
    },
  });

  const now = new Date();
  return accounts.map((account) => ({
    ...account,
    safety: computeSafety(
      account.posts.map((p) => ({ postedAt: p.postedAt, subreddit: p.subreddit.displayName })),
      now,
    ),
    commentActivity: computeCommentActivity(
      account.comments.map((c) => c.commentedAt),
      now,
    ),
  }));
}
