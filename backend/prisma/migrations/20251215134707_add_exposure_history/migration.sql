-- CreateTable
CREATE TABLE "ExposureHistory" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "workerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "gesId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExposureHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExposureHistory" ADD CONSTRAINT "ExposureHistory_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExposureHistory" ADD CONSTRAINT "ExposureHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExposureHistory" ADD CONSTRAINT "ExposureHistory_gesId_fkey" FOREIGN KEY ("gesId") REFERENCES "Ges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
