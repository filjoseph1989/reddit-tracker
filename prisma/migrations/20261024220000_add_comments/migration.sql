-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "subredditId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "commentedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comments_accountId_commentedAt_idx" ON "comments"("accountId", "commentedAt");

-- CreateIndex
CREATE UNIQUE INDEX "comments_accountId_url_key" ON "comments"("accountId", "url");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "reddit_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_subredditId_fkey" FOREIGN KEY ("subredditId") REFERENCES "subreddits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

