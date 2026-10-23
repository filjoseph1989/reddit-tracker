import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/client";
import { register } from "../actions";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-sm card">
      <h1 className="mb-4 text-xl font-semibold">Create your tracker</h1>
      <ActionForm action={register} className="flex flex-col gap-3">
        <input name="email" type="email" placeholder="Email" className="input" required autoFocus />
        <input name="password" type="password" placeholder="Password (8+ characters)" className="input" minLength={8} required />
        <SubmitButton>Create account</SubmitButton>
      </ActionForm>
      <p className="muted mt-4">
        Already have one? <Link href="/login" className="link">Log in</Link>
      </p>
    </div>
  );
}
