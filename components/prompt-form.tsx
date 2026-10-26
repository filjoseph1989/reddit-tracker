"use client";

import Link from "next/link";
import { useTransition } from "react";
import { createPrompt, deletePrompt, updatePrompt } from "@/app/actions";
import { ActionForm, SubmitButton } from "./client";

/** Create a prompt, or edit one when `prompt` is given. */
export function PromptForm({ prompt }: { prompt?: { id: string; title: string; content: string } }) {
  return (
    <ActionForm action={prompt ? updatePrompt : createPrompt} className="card space-y-4">
      {prompt && <input type="hidden" name="id" value={prompt.id} />}
      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={prompt?.title}
          placeholder="e.g. Rewrite post title for r/AskScience"
          maxLength={200}
          className="input w-full"
          required
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="content" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Prompt
        </label>
        <textarea
          id="content"
          name="content"
          defaultValue={prompt?.content}
          rows={14}
          className="input w-full font-mono text-sm"
          required
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        <Link href={prompt ? `/prompts/${prompt.id}` : "/prompts"} className="btn-secondary">
          Cancel
        </Link>
        <SubmitButton>{prompt ? "Save changes" : "Save prompt"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function DeletePromptButton({ id, title, className = "btn-danger" }: { id: string; title: string; className?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={() => {
        if (window.confirm(`Delete prompt "${title}"?`)) startTransition(() => deletePrompt(id));
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
