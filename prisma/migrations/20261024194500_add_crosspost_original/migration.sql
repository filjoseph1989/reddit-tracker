-- AlterTable: link a crosspost to its original post (tracked) or its URL/author (untracked)
ALTER TABLE "posts" ADD COLUMN "originalPostId" TEXT,
ADD COLUMN "originalUrl" TEXT,
ADD COLUMN "originalAccountId" TEXT;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_originalPostId_fkey" FOREIGN KEY ("originalPostId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_originalAccountId_fkey" FOREIGN KEY ("originalAccountId") REFERENCES "reddit_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
