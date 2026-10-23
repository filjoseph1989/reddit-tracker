import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/client";
import { login } from "../actions";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm card">
      <h1 className="mb-4 text-xl font-semibold">Log in</h1>
      <ActionForm action={login} className="flex flex-col gap-3">
        <input name="email" type="email" placeholder="Email" className="input" required autoFocus />
        <input name="password" type="password" placeholder="Password" className="input" required />
        <SubmitButton>Log in</SubmitButton>
      </ActionForm>
      <p className="muted mt-4">
        No account yet? <Link href="/register" className="link">Create one</Link>
      </p>
    </div>
  );
}
