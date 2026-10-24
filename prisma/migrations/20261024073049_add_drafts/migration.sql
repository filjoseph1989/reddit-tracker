-- CreateTable
CREATE TABLE "draft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "linkUrl" TEXT,
    "targetSubreddit" TEXT,
    "accountId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "draft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "draft_userId_createdAt_idx" ON "draft"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "draft" ADD CONSTRAINT "draft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft" ADD CONSTRAINT "draft_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "reddit_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
