-- CreateTable
CREATE TABLE "GESDocument" (
    "id" TEXT NOT NULL,
    "gesId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GESDocument_pkey" PRIMARY KEY ("id")
);
