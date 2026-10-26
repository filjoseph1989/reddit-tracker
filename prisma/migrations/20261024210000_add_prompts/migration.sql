-- CreateTable
CREATE TABLE "prompts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prompts_userId_updatedAt_idx" ON "prompts"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

