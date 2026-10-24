import Link from "next/link";
import { LocalTime } from "@/components/client";
import { CopyButton } from "@/components/drafts-client";
import { DeletePromptButton } from "@/components/prompt-form";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const instant = false;

export default async function PromptsPage() {
  const user = await requireUser();
  const prompts = await db.prompt.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/" className="text-xs link">
            ← Dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Prompts</h1>
          <p className="muted mt-1 text-sm">Save prompts you use often and copy them with one click.</p>
        </div>
        <Link href="/prompts/new" className="btn-primary self-start sm:self-auto">
          + New prompt
        </Link>
      </div>

      {prompts.length === 0 ? (
        <div className="card border-dashed text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">No prompts saved yet.</p>
          <Link href="/prompts/new" className="link mt-2 inline-block text-sm font-medium">
            Save your first prompt →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {prompts.map((p) => (
            <div key={p.id} className="card flex flex-col justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <Link
                  href={`/prompts/${p.id}`}
                  className="block truncate font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                >
                  {p.title}
                </Link>
                <p className="line-clamp-4 whitespace-pre-wrap break-words font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  {p.content}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CopyButton text={p.content} />
                <Link href={`/prompts/${p.id}`} className="btn-secondary text-xs">
                  View
                </Link>
                <Link href={`/prompts/${p.id}/edit`} className="btn-secondary text-xs">
                  Edit
                </Link>
                <DeletePromptButton id={p.id} title={p.title} className="btn-danger text-xs" />
                <span className="muted ml-auto text-xs">
                  Updated <LocalTime iso={p.updatedAt.toISOString()} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
