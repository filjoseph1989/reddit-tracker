import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/client";
import { login } from "../actions";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm card">
      <h1 className="mb-4 text-xl font-semibold">Log in</h1>

      <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50/60 p-3 text-xs dark:border-orange-900/50 dark:bg-orange-950/30">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">Test Account Credentials:</p>
        <p className="mt-1 font-mono text-zinc-600 dark:text-zinc-400">
          Email: <span className="font-semibold text-zinc-900 dark:text-zinc-100 select-all">user@example.com</span>
        </p>
        <p className="font-mono text-zinc-600 dark:text-zinc-400">
          Password: <span className="font-semibold text-zinc-900 dark:text-zinc-100 select-all">password123</span>
        </p>
      </div>

      <ActionForm action={login} className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          placeholder="Email"
          defaultValue="user@example.com"
          className="input"
          required
          autoFocus
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          defaultValue="password123"
          className="input"
          required
        />
        <SubmitButton>Log in</SubmitButton>
      </ActionForm>
      <p className="muted mt-4">
        No account yet? <Link href="/register" className="link">Create one</Link>
      </p>
    </div>
  );
}
