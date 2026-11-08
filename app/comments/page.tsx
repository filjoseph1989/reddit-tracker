import Link from "next/link";
import { LogCommentForm } from "@/components/log-comment-form";
import { RecentComments } from "@/components/recent-comments";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const instant = false;

export default async function CommentsPage() {
  const user = await requireUser();
  const [accounts, comments] = await Promise.all([
    db.redditAccount.findMany({
      where: { userId: user.id },
      orderBy: { username: "asc" },
      select: { id: true, username: true },
    }),
    db.comment.findMany({
      where: { account: { userId: user.id } },
      orderBy: { commentedAt: "desc" },
      include: { account: true, subreddit: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <Link href="/" className="text-xs link">
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Comments Activity</h1>
        <p className="muted mt-1 text-sm">Latest comments logged across your accounts.</p>
      </div>

      {/* Log Comment Card */}
      <div className="card shadow-sm border-zinc-200 dark:border-zinc-800">
        <div className="mb-3">
          <h2 className="text-base font-semibold">Log a Comment</h2>
          <p className="muted text-xs">
            Paste the link to your comment. Comments don’t affect post timing, but a bot-like commenting pace is flagged.
          </p>
        </div>
        <LogCommentForm accounts={accounts} />
      </div>

      {/* Comments Table */}
      {comments.length === 0 ? (
        <div className="card text-center py-8 text-sm text-zinc-500 border-dashed">
          No comments logged yet. Log your first comment above.
        </div>
      ) : (
        <RecentComments comments={comments} />
      )}
    </div>
  );
}
