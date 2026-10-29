import Link from "next/link";
import { deletePost } from "@/app/actions";
import { ConfirmSubmitButton, CopyIconButton, LocalTime, TrashIcon } from "@/components/client";
import type { Prisma } from "@/lib/generated/prisma/client";

type RecentPost = Prisma.PostGetPayload<{ include: { account: true; subreddit: true } }>;

/** 
 * Table of the latest logged posts, with copy and delete actions. 
 * Renders nothing when empty. 
 */
export function RecentPosts({ posts }: { posts: RecentPost[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold">Recent Posts Activity</h2>
          <p className="muted text-xs">Latest posts logged across your accounts.</p>
        </div>
        <Link href="/subreddits" className="text-xs font-medium link">
          Manage Subreddits →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="py-2.5 pr-4 font-medium">Account</th>
              <th className="py-2.5 pr-4 font-medium">Post</th>
              <th className="py-2.5 pr-4 font-medium">Subreddit</th>
              <th className="py-2.5 pr-4 font-medium">Posted At</th>
              <th className="py-2.5 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30">
                <td className="py-2.5 pr-4 font-medium">
                  <Link href={`/accounts/${post.account.id}`} className="hover:underline">
                    u/{post.account.username}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 max-w-xs">
                  <div className="flex items-center gap-1">
                    <CopyIconButton text={post.url} />
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link truncate block min-w-0 text-xs">
                      {post.url}
                    </a>
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-medium">r/{post.subreddit.displayName}</span>
                    {post.subreddit.kind ? (
                      <span
                        className={`pill text-[10px] ${
                          post.subreddit.kind === "MAIN"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                        }`}>
                        {post.subreddit.kind === "MAIN" ? "Main" : "Crosspost"}
                      </span>
                    ) : (
                      <Link
                        href={`/subreddits/${post.subreddit.id}/classify`}
                        className="pill bg-amber-100 text-amber-800 text-[10px] hover:underline">
                        Classify
                      </Link>
                    )}
                  </span>
                </td>
                <td className="py-2.5 pr-4 muted text-xs whitespace-nowrap">
                  <LocalTime iso={post.postedAt.toISOString()} />
                </td>
                <td className="py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <form action={deletePost.bind(null, post.id)}>
                      <ConfirmSubmitButton
                        className="btn-icon hover:!text-red-600 dark:hover:!text-red-400"
                        confirmMessage="Are you sure you want to delete this logged post?"
                        title="Delete post">
                        <TrashIcon />
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
