-- CreateTable
CREATE TABLE "GesRisk" (
    "id" TEXT NOT NULL,
    "gesId" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GesRisk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GesRisk_gesId_riskId_key" ON "GesRisk"("gesId", "riskId");

-- AddForeignKey
ALTER TABLE "GesRisk" ADD CONSTRAINT "GesRisk_gesId_fkey" FOREIGN KEY ("gesId") REFERENCES "Ges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GesRisk" ADD CONSTRAINT "GesRisk_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "RiskAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
