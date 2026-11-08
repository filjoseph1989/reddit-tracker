import Link from "next/link";
import { deleteComment } from "@/app/actions";
import { ConfirmSubmitButton, CopyIconButton, LocalTime, TrashIcon } from "@/components/client";
import type { Prisma } from "@/lib/generated/prisma/client";

type RecentComment = Prisma.CommentGetPayload<{ include: { account: true; subreddit: true } }>;

/**
 * Table of the latest logged comments, with copy and delete actions.
 * Renders nothing when empty.
 */
export function RecentComments({ comments }: { comments: RecentComment[] }) {
  if (comments.length === 0) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold">Recent Comments Activity</h2>
          <p className="muted text-xs">Latest comments logged across your accounts.</p>
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
              <th className="py-2.5 pr-4 font-medium">Comment</th>
              <th className="py-2.5 pr-4 font-medium">Subreddit</th>
              <th className="py-2.5 pr-4 font-medium">Commented At</th>
              <th className="py-2.5 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {comments.map((comment) => (
              <tr key={comment.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30">
                <td className="py-2.5 pr-4 font-medium">
                  <Link href={`/accounts/${comment.account.id}`} className="hover:underline">
                    u/{comment.account.username}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 max-w-xs">
                  <div className="flex items-center gap-1">
                    <CopyIconButton text={comment.url} title="Copy comment link" />
                    <a
                      href={comment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link truncate block min-w-0 text-xs">
                      {comment.url}
                    </a>
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-medium">r/{comment.subreddit.displayName}</span>
                    {comment.subreddit.kind && (
                      <span
                        className={`pill text-[10px] ${
                          comment.subreddit.kind === "MAIN"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                        }`}>
                        {comment.subreddit.kind === "MAIN" ? "Main" : "Crosspost"}
                      </span>
                    )}
                  </span>
                </td>
                <td className="py-2.5 pr-4 muted text-xs whitespace-nowrap">
                  <LocalTime iso={comment.commentedAt.toISOString()} />
                </td>
                <td className="py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <form action={deleteComment.bind(null, comment.id)}>
                      <ConfirmSubmitButton
                        className="btn-icon hover:!text-red-600 dark:hover:!text-red-400"
                        confirmMessage="Are you sure you want to delete this logged comment?"
                        title="Delete comment">
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
