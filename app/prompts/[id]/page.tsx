import Link from "next/link";
import { notFound } from "next/navigation";
import { LocalTime } from "@/components/client";
import { CopyButton } from "@/components/drafts-client";
import { DeletePromptButton } from "@/components/prompt-form";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const instant = false;

export default async function PromptPage({ params }: PageProps<"/prompts/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const prompt = await db.prompt.findFirst({ where: { id, userId: user.id } });
  if (!prompt) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link href="/prompts" className="text-xs link">
            ← Prompts
          </Link>
          <h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {prompt.title}
          </h1>
          <p className="muted mt-1 text-xs">
            Created <LocalTime iso={prompt.createdAt.toISOString()} /> · Updated{" "}
            <LocalTime iso={prompt.updatedAt.toISOString()} />
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <CopyButton text={prompt.content} />
          <Link href={`/prompts/${prompt.id}/edit`} className="btn-secondary text-xs">
            Edit
          </Link>
          <DeletePromptButton id={prompt.id} title={prompt.title} className="btn-danger text-xs" />
        </div>
      </div>

      <pre className="card overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm text-zinc-800 dark:text-zinc-200">
        {prompt.content}
      </pre>
    </div>
  );
}
