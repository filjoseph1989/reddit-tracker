import Link from "next/link";
import { LogPostForm } from "@/components/log-post-form";
import { RecentPosts } from "@/components/recent-posts";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const instant = false;

export default async function PostsPage() {
  const user = await requireUser();
  const [accounts, posts] = await Promise.all([
    db.redditAccount.findMany({
      where: { userId: user.id },
      orderBy: { username: "asc" },
      select: { id: true, username: true },
    }),
    db.post.findMany({
      where: { account: { userId: user.id } },
      orderBy: { postedAt: "desc" },
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
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Posts Activity</h1>
        <p className="muted mt-1 text-sm">Latest posts logged across your accounts.</p>
      </div>

      {/* Log Post Card */}
      <div className="card shadow-sm border-zinc-200 dark:border-zinc-800">
        <div className="mb-3">
          <h2 className="text-base font-semibold">Log a Post</h2>
          <p className="muted text-xs">
            Paste the Reddit post URL. The subreddit is automatically detected and the account’s safe interval updates immediately.
          </p>
        </div>
        <LogPostForm accounts={accounts} />
      </div>

      {/* Posts Table */}
      {posts.length === 0 ? (
        <div className="card text-center py-8 text-sm text-zinc-500 border-dashed">
          No posts logged yet. Log your first post above.
        </div>
      ) : (
        <RecentPosts posts={posts} />
      )}
    </div>
  );
}
