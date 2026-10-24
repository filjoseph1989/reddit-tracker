"use server";

import bcrypt from "bcryptjs";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { endSession, requireUser, startSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { parsePostUrl } from "@/lib/reddit";

export type FormState = { error?: string } | undefined;

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

// ---- Auth ----

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").toLowerCase();
  const password = text(form, "password");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (await db.user.findUnique({ where: { email } })) return { error: "That email is already registered." };

  const user = await db.user.create({ data: { email, passwordHash: await bcrypt.hash(password, 12) } });
  await startSession(user.id);
  redirect("/");
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(text(form, "password"), user.passwordHash))) {
    return { error: "Wrong email or password." };
  }
  await startSession(user.id);
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

// ---- Reddit accounts ----

export async function addAccount(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const username = text(form, "username").replace(/^\/?u\//i, "");
  if (!/^[A-Za-z0-9_-]{3,20}$/.test(username)) return { error: "Enter a Reddit username (3–20 letters, numbers, _ or -)." };
  try {
    await db.redditAccount.create({ data: { userId: user.id, username } });
  } catch (e) {
    if (isUniqueViolation(e)) return { error: `u/${username} is already added.` };
    throw e;
  }
  refresh();
}

export async function deleteAccount(accountId: string) {
  const user = await requireUser();
  await db.redditAccount.deleteMany({ where: { id: accountId, userId: user.id } });
  redirect("/");
}

// ---- Posts ----

export async function addPost(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const account = await db.redditAccount.findFirst({ where: { id: text(form, "accountId"), userId: user.id } });
  if (!account) return { error: "Pick one of your accounts." };

  let parsed;
  try {
    parsed = parsePostUrl(text(form, "url"));
  } catch (e) {
    return { error: (e as Error).message };
  }

  const postedAt = new Date(text(form, "postedAt"));
  if (Number.isNaN(postedAt.getTime())) return { error: "Enter when it was posted." };
  if (postedAt.getTime() > Date.now() + 5 * 60_000) return { error: "Posted time can't be in the future." };

  const subreddit = await db.subreddit.upsert({
    where: { userId_name: { userId: user.id, name: parsed.subreddit.toLowerCase() } },
    create: { userId: user.id, name: parsed.subreddit.toLowerCase(), displayName: parsed.subreddit },
    update: {},
  });

  let post;
  try {
    post = await db.post.create({
      data: { accountId: account.id, subredditId: subreddit.id, url: parsed.url, postedAt },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { error: "That post is already logged for this account." };
    throw e;
  }

  // A subreddit we haven't seen before: ask what kind it is.
  if (!subreddit.kind) redirect(`/subreddits/${subreddit.id}/classify?post=${post.id}`);

  await autoLink(post.id);
  refresh();
}

export async function deletePost(postId: string) {
  const user = await requireUser();
  await db.post.deleteMany({ where: { id: postId, account: { userId: user.id } } });
  refresh();
}

// ---- Subreddits ----

export async function classifySubreddit(form: FormData) {
  const user = await requireUser();
  const kind = text(form, "kind");
  if (kind !== "MAIN" && kind !== "CROSSPOST") return;
  const subreddit = await db.subreddit.findFirst({ where: { id: text(form, "subredditId"), userId: user.id } });
  if (!subreddit) return;
  await db.subreddit.update({ where: { id: subreddit.id }, data: { kind } });
  if (kind === "MAIN") await db.subredditLink.deleteMany({ where: { crosspostId: subreddit.id } });
  else await db.subredditLink.deleteMany({ where: { mainId: subreddit.id } });

  const postId = text(form, "postId");
  if (postId) {
    await autoLink(postId);
    const post = await db.post.findFirst({ where: { id: postId, account: { userId: user.id } } });
    if (post) redirect(`/accounts/${post.accountId}`);
  }
  const next = text(form, "next");
  redirect(next.startsWith("/") ? next : "/subreddits");
}

export async function linkSubreddits(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const [main, crosspost] = await Promise.all([
    db.subreddit.findFirst({ where: { id: text(form, "mainId"), userId: user.id, kind: "MAIN" } }),
    db.subreddit.findFirst({ where: { id: text(form, "crosspostId"), userId: user.id, kind: "CROSSPOST" } }),
  ]);
  if (!main || !crosspost) return { error: "Pick a main and a crosspost subreddit." };
  await db.subredditLink.upsert({
    where: { mainId_crosspostId: { mainId: main.id, crosspostId: crosspost.id } },
    create: { mainId: main.id, crosspostId: crosspost.id },
    update: {},
  });
  refresh();
}

export async function unlinkSubreddits(mainId: string, crosspostId: string) {
  const user = await requireUser();
  await db.subredditLink.deleteMany({ where: { mainId, crosspostId, main: { userId: user.id } } });
  refresh();
}

export async function deleteSubreddit(subredditId: string) {
  const user = await requireUser();
  await db.subreddit.deleteMany({ where: { id: subredditId, userId: user.id } });
  refresh();
}

// ---- Drafts ----

export async function createDraft(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const title = text(form, "title");
  if (!title) return { error: "Enter a title for the draft." };
  if (title.length > 300) return { error: "Reddit titles cannot exceed 300 characters." };

  const body = text(form, "body") || null;
  const linkUrl = text(form, "linkUrl") || null;
  if (linkUrl) {
    try {
      new URL(linkUrl);
    } catch {
      return { error: "Enter a valid URL for the link (e.g. https://example.com)." };
    }
  }

  const targetSubreddit = text(form, "targetSubreddit").replace(/^\/?r\//i, "").trim() || null;
  const rawAccountId = text(form, "accountId");
  let accountId: string | null = null;
  if (rawAccountId) {
    const acc = await db.redditAccount.findFirst({ where: { id: rawAccountId, userId: user.id } });
    if (acc) accountId = acc.id;
  }
  const notes = text(form, "notes") || null;

  await db.draft.create({
    data: {
      userId: user.id,
      title,
      body,
      linkUrl,
      targetSubreddit,
      accountId,
      notes,
    },
  });

  const next = text(form, "next");
  if (next && next.startsWith("/")) {
    redirect(next);
  }
  refresh();
}

export async function updateDraft(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = text(form, "id");
  const draft = await db.draft.findFirst({ where: { id, userId: user.id } });
  if (!draft) return { error: "Draft not found." };

  const title = text(form, "title");
  if (!title) return { error: "Enter a title for the draft." };
  if (title.length > 300) return { error: "Reddit titles cannot exceed 300 characters." };

  const body = text(form, "body") || null;
  const linkUrl = text(form, "linkUrl") || null;
  if (linkUrl) {
    try {
      new URL(linkUrl);
    } catch {
      return { error: "Enter a valid URL for the link (e.g. https://example.com)." };
    }
  }

  const targetSubreddit = text(form, "targetSubreddit").replace(/^\/?r\//i, "").trim() || null;
  const rawAccountId = text(form, "accountId");
  let accountId: string | null = null;
  if (rawAccountId) {
    const acc = await db.redditAccount.findFirst({ where: { id: rawAccountId, userId: user.id } });
    if (acc) accountId = acc.id;
  }
  const notes = text(form, "notes") || null;

  await db.draft.update({
    where: { id: draft.id },
    data: {
      title,
      body,
      linkUrl,
      targetSubreddit,
      accountId,
      notes,
    },
  });

  const next = text(form, "next");
  if (next && next.startsWith("/")) {
    redirect(next);
  }
  refresh();
}

export async function deleteDraft(draftId: string) {
  const user = await requireUser();
  await db.draft.deleteMany({ where: { id: draftId, userId: user.id } });
  refresh();
}

/**
 * When a crosspost is logged, link its subreddit to the main subreddit of the
 * same account's most recent original post (within the previous 24 hours).
 */
async function autoLink(postId: string) {
  const post = await db.post.findUnique({ where: { id: postId }, include: { subreddit: true } });
  if (post?.subreddit.kind !== "CROSSPOST") return;
  const original = await db.post.findFirst({
    where: {
      accountId: post.accountId,
      subreddit: { kind: "MAIN" },
      postedAt: { lte: post.postedAt, gte: new Date(post.postedAt.getTime() - 86_400_000) },
    },
    orderBy: { postedAt: "desc" },
  });
  if (!original) return;
  await db.subredditLink.upsert({
    where: { mainId_crosspostId: { mainId: original.subredditId, crosspostId: post.subredditId } },
    create: { mainId: original.subredditId, crosspostId: post.subredditId },
    update: {},
  });
}

function isUniqueViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}
