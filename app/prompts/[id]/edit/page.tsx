import Link from "next/link";
import { notFound } from "next/navigation";
import { PromptForm } from "@/components/prompt-form";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const instant = false;

export default async function EditPromptPage({ params }: PageProps<"/prompts/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser();
  const prompt = await db.prompt.findFirst({ where: { id, userId: user.id } });
  if (!prompt) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/prompts/${prompt.id}`} className="text-xs link">
          ← {prompt.title}
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Edit prompt</h1>
      </div>
      <PromptForm prompt={{ id: prompt.id, title: prompt.title, content: prompt.content }} />
    </div>
  );
}
