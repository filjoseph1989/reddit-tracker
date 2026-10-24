import Link from "next/link";
import { DraftsManager, type SerializedDraft } from "@/components/drafts-client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const instant = false;

export default async function DraftsPage() {
  const user = await requireUser();

  const [drafts, accounts, subreddits] = await Promise.all([
    db.draft.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { account: { select: { id: true, username: true } } },
    }),
    db.redditAccount.findMany({
      where: { userId: user.id },
      orderBy: { username: "asc" },
      select: { id: true, username: true },
    }),
    db.subreddit.findMany({
      where: { userId: user.id },
      orderBy: { displayName: "asc" },
      select: { id: true, name: true, displayName: true },
    }),
  ]);

  const serializedDrafts: SerializedDraft[] = drafts.map((d) => ({
    id: d.id,
    userId: d.userId,
    title: d.title,
    body: d.body,
    linkUrl: d.linkUrl,
    targetSubreddit: d.targetSubreddit,
    accountId: d.accountId,
    notes: d.notes,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    account: d.account,
  }));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xs link">
              ← Dashboard
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Draft Posts
          </h1>
          <p className="muted mt-1 text-sm">
            Save post titles, bodies, and links in advance. Copy them with one click whenever you&apos;re ready to post to Reddit.
          </p>
        </div>
      </div>

      <DraftsManager
        initialDrafts={serializedDrafts}
        accounts={accounts}
        subreddits={subreddits}
      />
    </div>
  );
}
