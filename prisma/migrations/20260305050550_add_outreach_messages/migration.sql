-- CreateTable
CREATE TABLE "OutreachMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "hiringManager" TEXT,
    "jobUrl" TEXT,
    "jobDescription" TEXT,
    "userProjects" TEXT NOT NULL,
    "userUSP" TEXT NOT NULL,
    "extraContext" TEXT,
    "generatedText" TEXT NOT NULL,
    "subject" TEXT,
    "charCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutreachMessage_userId_createdAt_idx" ON "OutreachMessage"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
