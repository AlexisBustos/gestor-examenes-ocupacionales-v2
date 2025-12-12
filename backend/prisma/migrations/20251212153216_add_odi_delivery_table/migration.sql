-- CreateTable
CREATE TABLE "OdiDelivery" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OdiDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OdiDelivery_token_key" ON "OdiDelivery"("token");

-- AddForeignKey
ALTER TABLE "OdiDelivery" ADD CONSTRAINT "OdiDelivery_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdiDelivery" ADD CONSTRAINT "OdiDelivery_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "OdiDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
