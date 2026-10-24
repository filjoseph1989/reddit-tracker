import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { currentUser } from "@/lib/auth";
import { logout } from "./actions";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reddit Account Health Tracker",
  description: "Space out Reddit posts across accounts so they don't get filtered or flagged.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-semibold">
              <span className="text-orange-600">●</span> Post Spacer
            </Link>
            <Link href="/" className="text-sm hover:underline">Accounts</Link>
            <Link href="/subreddits" className="text-sm hover:underline">Subreddits</Link>
            <Link href="/drafts" className="text-sm hover:underline">Drafts</Link>
            <Suspense>
              <UserMenu />
            </Suspense>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

async function UserMenu() {
  const user = await currentUser();
  if (!user) return null;
  return (
    <form action={logout} className="ml-auto flex items-center gap-3">
      <span className="muted hidden sm:inline">{user.email}</span>
      <button className="btn-secondary">Log out</button>
    </form>
  );
}
