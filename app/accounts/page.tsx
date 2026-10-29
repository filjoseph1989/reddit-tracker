import Link from "next/link";
import { AccountsSection } from "@/components/accounts-section";
import { requireUser } from "@/lib/auth";
import { accountsWithSafety } from "@/lib/data";

export const instant = false;

export default async function AccountsPage() {
  const user = await requireUser();
  const accounts = await accountsWithSafety(user.id);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <Link href="/" className="text-xs link">
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Accounts</h1>
        <p className="muted mt-1 text-sm">Each account&apos;s cooldown, recent posts and comment activity.</p>
      </div>

      <AccountsSection accounts={accounts} />
    </div>
  );
}
