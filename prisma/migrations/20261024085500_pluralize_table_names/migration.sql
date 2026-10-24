-- AlterTable: Rename tables to plural (Laravel-style)
ALTER TABLE "user" RENAME TO "users";
ALTER TABLE "session" RENAME TO "sessions";
ALTER TABLE "reddit_account" RENAME TO "reddit_accounts";
ALTER TABLE "subreddit" RENAME TO "subreddits";
ALTER TABLE "subreddit_link" RENAME TO "subreddit_links";
ALTER TABLE "post" RENAME TO "posts";
ALTER TABLE "draft" RENAME TO "drafts";

-- Rename primary key constraints
ALTER TABLE "users" RENAME CONSTRAINT "user_pkey" TO "users_pkey";
ALTER TABLE "sessions" RENAME CONSTRAINT "session_pkey" TO "sessions_pkey";
ALTER TABLE "reddit_accounts" RENAME CONSTRAINT "reddit_account_pkey" TO "reddit_accounts_pkey";
ALTER TABLE "subreddits" RENAME CONSTRAINT "subreddit_pkey" TO "subreddits_pkey";
ALTER TABLE "subreddit_links" RENAME CONSTRAINT "subreddit_link_pkey" TO "subreddit_links_pkey";
ALTER TABLE "posts" RENAME CONSTRAINT "post_pkey" TO "posts_pkey";
ALTER TABLE "drafts" RENAME CONSTRAINT "draft_pkey" TO "drafts_pkey";

-- Rename foreign key constraints
ALTER TABLE "sessions" RENAME CONSTRAINT "session_userId_fkey" TO "sessions_userId_fkey";
ALTER TABLE "reddit_accounts" RENAME CONSTRAINT "reddit_account_userId_fkey" TO "reddit_accounts_userId_fkey";
ALTER TABLE "subreddits" RENAME CONSTRAINT "subreddit_userId_fkey" TO "subreddits_userId_fkey";
ALTER TABLE "subreddit_links" RENAME CONSTRAINT "subreddit_link_mainId_fkey" TO "subreddit_links_mainId_fkey";
ALTER TABLE "subreddit_links" RENAME CONSTRAINT "subreddit_link_crosspostId_fkey" TO "subreddit_links_crosspostId_fkey";
ALTER TABLE "posts" RENAME CONSTRAINT "post_accountId_fkey" TO "posts_accountId_fkey";
ALTER TABLE "posts" RENAME CONSTRAINT "post_subredditId_fkey" TO "posts_subredditId_fkey";
ALTER TABLE "drafts" RENAME CONSTRAINT "draft_userId_fkey" TO "drafts_userId_fkey";
ALTER TABLE "drafts" RENAME CONSTRAINT "draft_accountId_fkey" TO "drafts_accountId_fkey";

-- Rename indexes & unique constraints
ALTER INDEX "user_email_key" RENAME TO "users_email_key";
ALTER INDEX "session_userId_idx" RENAME TO "sessions_userId_idx";
ALTER INDEX "reddit_account_userId_username_key" RENAME TO "reddit_accounts_userId_username_key";
ALTER INDEX "subreddit_userId_name_key" RENAME TO "subreddits_userId_name_key";
ALTER INDEX "post_accountId_url_key" RENAME TO "posts_accountId_url_key";
ALTER INDEX "post_accountId_postedAt_idx" RENAME TO "posts_accountId_postedAt_idx";
ALTER INDEX "draft_userId_createdAt_idx" RENAME TO "drafts_userId_createdAt_idx";
