import Link from "next/link";
import { PromptForm } from "@/components/prompt-form";
import { requireUser } from "@/lib/auth";

export const instant = false;

export default async function NewPromptPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/prompts" className="text-xs link">
          ← Prompts
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">New prompt</h1>
      </div>
      <PromptForm />
    </div>
  );
}
