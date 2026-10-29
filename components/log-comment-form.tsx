import { addComment } from "@/app/actions";
import { ActionForm, PostedAtInput, SubmitButton } from "./client";

/** 
 * Log a comment. 
 * 
 * Pass several accounts to show a picker, or one to log for that account. 
 */
export function LogCommentForm({ accounts }: { accounts: { id: string; username: string }[] }) {
  if (accounts.length === 0) return null;

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
      <PostedAtInput />
      <SubmitButton className="btn-primary w-32">Log</SubmitButton>
    </ActionForm>
  );
}
