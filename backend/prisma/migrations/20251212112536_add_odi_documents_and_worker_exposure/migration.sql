-- CreateTable
CREATE TABLE "OdiDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OdiDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerExposure" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WorkerExposure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkerExposure_workerId_agentId_key" ON "WorkerExposure"("workerId", "agentId");

-- AddForeignKey
ALTER TABLE "OdiDocument" ADD CONSTRAINT "OdiDocument_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "RiskAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerExposure" ADD CONSTRAINT "WorkerExposure_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerExposure" ADD CONSTRAINT "WorkerExposure_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "RiskAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
