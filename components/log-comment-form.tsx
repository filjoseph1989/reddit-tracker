import { addComment } from "@/app/actions";
import { ActionForm, SubmitButton } from "./client";

/** 
 * Log a comment. 
 * 
 * Pass several accounts to show a picker, or one to log for that account. 
 */
export function LogCommentForm({ accounts }: { accounts: { id: string; username: string }[] }) {
  if (accounts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Add a Reddit account first to start logging comments.
      </div>
    );
  }

  return (
    <ActionForm action={addComment} className="flex flex-wrap items-center gap-2">
      <input
        name="url"
        type="url"
        placeholder="https://www.reddit.com/r/.../comments/.../comment/..."
        className="input min-w-64 flex-1"
        required
      />
      {accounts.length === 1 ? (
        <input type="hidden" name="accountId" value={accounts[0].id} />
      ) : (
        <select name="accountId" className="input" required aria-label="Account">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>u/{a.username}</option>
          ))}
        </select>
      )}
      <SubmitButton className="btn-primary w-32">Log</SubmitButton>
    </ActionForm>
  );
}
