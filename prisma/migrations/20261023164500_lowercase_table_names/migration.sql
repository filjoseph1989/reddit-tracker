-- AlterTable: Rename tables to lowercase
ALTER TABLE "User" RENAME TO "user";
ALTER TABLE "Session" RENAME TO "session";
ALTER TABLE "RedditAccount" RENAME TO "reddit_account";
ALTER TABLE "Subreddit" RENAME TO "subreddit";
ALTER TABLE "SubredditLink" RENAME TO "subreddit_link";
ALTER TABLE "Post" RENAME TO "post";

-- Rename primary key constraints
ALTER TABLE "user" RENAME CONSTRAINT "User_pkey" TO "user_pkey";
ALTER TABLE "session" RENAME CONSTRAINT "Session_pkey" TO "session_pkey";
ALTER TABLE "reddit_account" RENAME CONSTRAINT "RedditAccount_pkey" TO "reddit_account_pkey";
ALTER TABLE "subreddit" RENAME CONSTRAINT "Subreddit_pkey" TO "subreddit_pkey";
ALTER TABLE "subreddit_link" RENAME CONSTRAINT "SubredditLink_pkey" TO "subreddit_link_pkey";
ALTER TABLE "post" RENAME CONSTRAINT "Post_pkey" TO "post_pkey";

-- Rename foreign key constraints
ALTER TABLE "session" RENAME CONSTRAINT "Session_userId_fkey" TO "session_userId_fkey";
ALTER TABLE "reddit_account" RENAME CONSTRAINT "RedditAccount_userId_fkey" TO "reddit_account_userId_fkey";
ALTER TABLE "subreddit" RENAME CONSTRAINT "Subreddit_userId_fkey" TO "subreddit_userId_fkey";
ALTER TABLE "subreddit_link" RENAME CONSTRAINT "SubredditLink_mainId_fkey" TO "subreddit_link_mainId_fkey";
ALTER TABLE "subreddit_link" RENAME CONSTRAINT "SubredditLink_crosspostId_fkey" TO "subreddit_link_crosspostId_fkey";
ALTER TABLE "post" RENAME CONSTRAINT "Post_accountId_fkey" TO "post_accountId_fkey";
ALTER TABLE "post" RENAME CONSTRAINT "Post_subredditId_fkey" TO "post_subredditId_fkey";

-- Rename indexes
ALTER INDEX "User_email_key" RENAME TO "user_email_key";
ALTER INDEX "Session_userId_idx" RENAME TO "session_userId_idx";
ALTER INDEX "RedditAccount_userId_username_key" RENAME TO "reddit_account_userId_username_key";
ALTER INDEX "Subreddit_userId_name_key" RENAME TO "subreddit_userId_name_key";
ALTER INDEX "Post_accountId_postedAt_idx" RENAME TO "post_accountId_postedAt_idx";
ALTER INDEX "Post_accountId_url_key" RENAME TO "post_accountId_url_key";
