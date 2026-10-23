import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { classifySubreddit } from "../../../actions";

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

        <form action={classifySubreddit} className="space-y-4">
          <input type="hidden" name="subredditId" value={subreddit.id} />
          <input type="hidden" name="postId" value={postId ?? ""} />
          <input type="hidden" name="next" value={next ?? ""} />

          <div className="space-y-3">
            {/* Option 1: Main */}
            <label className="flex items-start gap-3 rounded-xl border border-zinc-200 p-4 cursor-pointer hover:border-orange-500 hover:bg-orange-50/20 transition dark:border-zinc-800 dark:hover:border-orange-500/50">
              <input
                type="radio"
                name="kind"
                value="MAIN"
                defaultChecked={subreddit.kind === "MAIN" || !subreddit.kind}
                className="mt-1 h-4 w-4 text-orange-600 accent-orange-600"
                required
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    Main Subreddit
                  </span>
                  <span className="pill bg-blue-100 text-blue-800 text-[10px] dark:bg-blue-950 dark:text-blue-300">
                    Original Posts
                  </span>
                </div>
                <p className="muted text-xs mt-1">
                  Where you regularly make original posts. This serves as your primary content source. Subsequent crossposts within 24 hours will automatically link back to this subreddit.
                </p>
              </div>
            </label>

            {/* Option 2: Crosspost */}
            <label className="flex items-start gap-3 rounded-xl border border-zinc-200 p-4 cursor-pointer hover:border-orange-500 hover:bg-orange-50/20 transition dark:border-zinc-800 dark:hover:border-orange-500/50">
              <input
                type="radio"
                name="kind"
                value="CROSSPOST"
                defaultChecked={subreddit.kind === "CROSSPOST"}
                className="mt-1 h-4 w-4 text-orange-600 accent-orange-600"
                required
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    Crosspost Subreddit
                  </span>
                  <span className="pill bg-purple-100 text-purple-800 text-[10px] dark:bg-purple-950 dark:text-purple-300">
                    Crossposts Only
                  </span>
                </div>
                <p className="muted text-xs mt-1">
                  Where you only crosspost existing submissions. The tracker connects this community to the main subreddit from which the post was originally shared.
                </p>
              </div>
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link href={next || "/subreddits"} className="btn-secondary">
              Cancel
            </Link>
            <SubmitButton className="btn-primary">
              Save Classification
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
