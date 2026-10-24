import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassifyForm } from "@/components/classify-form";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const instant = false;

type ClassifyPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ post?: string; next?: string }>;
};

export default async function ClassifySubredditPage({ params, searchParams }: ClassifyPageProps) {
  const { id } = await params;
  const { post: postId, next } = await searchParams;
  const user = await requireUser();

  const [subreddit, post] = await Promise.all([
    db.subreddit.findFirst({
      where: { id, userId: user.id },
    }),
    postId
      ? db.post.findFirst({
          where: { id: postId, account: { userId: user.id } },
          include: { account: true },
        })
      : null,
  ]);

  if (!subreddit) {
    notFound();
  }

  // For a post just logged here: the logged posts it could have been crossposted from.
  const [candidates, accounts] = post
    ? await Promise.all([
        db.post.findMany({
          where: { account: { userId: user.id }, id: { not: post.id }, subredditId: { not: subreddit.id } },
          orderBy: { postedAt: "desc" },
          take: 50,
          include: { account: true, subreddit: true },
        }),
        db.redditAccount.findMany({
          where: { userId: user.id },
          orderBy: { username: "asc" },
          select: { id: true, username: true },
        }),
      ])
    : [[], []];

  // Preselect the saved original, else the latest main-subreddit post from the 24 hours before.
  const defaultOriginal =
    candidates.find((c) => c.id === post?.originalPostId) ??
    candidates.find(
      (c) =>
        post &&
        c.subreddit.kind === "MAIN" &&
        c.postedAt <= post.postedAt &&
        c.postedAt.getTime() >= post.postedAt.getTime() - 86_400_000,
    );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Back link */}
      <div>
        <Link href={next || "/subreddits"} className="text-sm font-medium link">
          ← Cancel and return
        </Link>
      </div>

      <div className="card space-y-6">
        <div>
          <span className="pill bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
            Subreddit Classification
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            What kind of subreddit is r/{subreddit.displayName}?
          </h1>
          <p className="muted text-sm mt-1">
            Reddit anti-spam patterns distinguish original content hubs from crosspost targets. The tracker links them together to monitor your distribution strategy.
          </p>
        </div>

        {post && (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-300">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">Post just logged:</p>
            <p className="mt-0.5">Account: <span className="font-medium">u/{post.account.username}</span></p>
            <p className="mt-0.5 truncate">
              URL: <a href={post.url} target="_blank" rel="noopener noreferrer" className="link underline">{post.url}</a>
            </p>
          </div>
        )}

        <ClassifyForm
          subredditId={subreddit.id}
          initialKind={subreddit.kind}
          postId={post?.id}
          next={next}
          candidates={candidates.map((c) => ({
            id: c.id,
            url: c.url,
            username: c.account.username,
            subreddit: c.subreddit.displayName,
            postedAt: c.postedAt.toISOString(),
          }))}
          defaultOriginalId={defaultOriginal?.id}
          accounts={accounts}
        />
      </div>
    </div>
  );
}
