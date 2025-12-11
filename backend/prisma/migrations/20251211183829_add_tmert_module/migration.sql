-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "tmertReportId" TEXT;

-- CreateTable
CREATE TABLE "TmertReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gesId" TEXT NOT NULL,

    CONSTRAINT "TmertReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TmertReport" ADD CONSTRAINT "TmertReport_gesId_fkey" FOREIGN KEY ("gesId") REFERENCES "Ges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_tmertReportId_fkey" FOREIGN KEY ("tmertReportId") REFERENCES "TmertReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
