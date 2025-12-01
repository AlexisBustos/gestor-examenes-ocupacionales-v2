-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'REALIZADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "ExposureType" AS ENUM ('AGUDA', 'CRONICA', 'INTERMITENTE', 'CONTINUA');

-- CreateEnum
CREATE TYPE "EvaluationType" AS ENUM ('PRE_OCUPACIONAL', 'OCUPACIONAL', 'EXAMEN_SALIDA');

-- CreateEnum
CREATE TYPE "MedicalStatus" AS ENUM ('PENDIENTE', 'APTO', 'NO_APTO', 'APTO_CON_OBSERVACIONES');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN_VITAM', 'ADMIN_EMPRESA', 'USER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('SOLICITADO', 'AGENDADO', 'REALIZADO', 'CERRADO', 'ANULADO');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkCenter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workCenterId" TEXT NOT NULL,
    "costCenterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostCenter" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicalReport" (
    "id" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnicalReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuantitativeReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "technicalReportId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuantitativeReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "folio" TEXT,
    "description" TEXT NOT NULL,
    "measureType" TEXT,
    "isImmediate" BOOLEAN NOT NULL DEFAULT false,
    "implementationDate" TIMESTAMP(3) NOT NULL,
    "observation" TEXT,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'PENDIENTE',
    "technicalReportId" TEXT,
    "quantitativeReportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "menCount" INTEGER NOT NULL,
    "womenCount" INTEGER NOT NULL,
    "tasksDescription" TEXT,
    "machineryUsed" TEXT,
    "controlMeasures" TEXT,
    "subArea" TEXT,
    "validityYears" INTEGER,
    "nextEvaluationDate" TIMESTAMP(3),
    "risksResume" TEXT,
    "prescriptions" TEXT,
    "technicalReportId" TEXT,
    "areaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "protocolUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskProtocol" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "riskAgentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskProtocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskExposure" (
    "id" TEXT NOT NULL,
    "gesId" TEXT NOT NULL,
    "riskAgentId" TEXT NOT NULL,
    "exposureType" "ExposureType",
    "specificAgentDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskExposure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalExam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamBattery" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "evaluationType" "EvaluationType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamBattery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatteryExam" (
    "id" TEXT NOT NULL,
    "examBatteryId" TEXT NOT NULL,
    "medicalExamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatteryExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "position" TEXT,
    "managementArea" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "costCenter" TEXT,
    "currentGesId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderBattery" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "batteryId" TEXT NOT NULL,
    "status" "MedicalStatus" NOT NULL DEFAULT 'PENDIENTE',
    "expirationDate" TIMESTAMP(3),
    "resultUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderBattery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamOrder" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "gesId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'SOLICITADO',
    "scheduledAt" TIMESTAMP(3),
    "providerName" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRule" (
    "id" TEXT NOT NULL,
    "riskAgentName" TEXT NOT NULL,
    "specificDetail" TEXT,
    "batteryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ExamBatteryToRiskExposure" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ExamBatteryToGes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_rut_key" ON "Company"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "CostCenter_code_key" ON "CostCenter"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RiskAgent_name_key" ON "RiskAgent"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalExam_name_key" ON "MedicalExam"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BatteryExam_examBatteryId_medicalExamId_key" ON "BatteryExam"("examBatteryId", "medicalExamId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_rut_key" ON "Worker"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "_ExamBatteryToRiskExposure_AB_unique" ON "_ExamBatteryToRiskExposure"("A", "B");

-- CreateIndex
CREATE INDEX "_ExamBatteryToRiskExposure_B_index" ON "_ExamBatteryToRiskExposure"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ExamBatteryToGes_AB_unique" ON "_ExamBatteryToGes"("A", "B");

-- CreateIndex
CREATE INDEX "_ExamBatteryToGes_B_index" ON "_ExamBatteryToGes"("B");

-- AddForeignKey
ALTER TABLE "WorkCenter" ADD CONSTRAINT "WorkCenter_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "WorkCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostCenter" ADD CONSTRAINT "CostCenter_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicalReport" ADD CONSTRAINT "TechnicalReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuantitativeReport" ADD CONSTRAINT "QuantitativeReport_technicalReportId_fkey" FOREIGN KEY ("technicalReportId") REFERENCES "TechnicalReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_technicalReportId_fkey" FOREIGN KEY ("technicalReportId") REFERENCES "TechnicalReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_quantitativeReportId_fkey" FOREIGN KEY ("quantitativeReportId") REFERENCES "QuantitativeReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ges" ADD CONSTRAINT "Ges_technicalReportId_fkey" FOREIGN KEY ("technicalReportId") REFERENCES "TechnicalReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ges" ADD CONSTRAINT "Ges_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskProtocol" ADD CONSTRAINT "RiskProtocol_riskAgentId_fkey" FOREIGN KEY ("riskAgentId") REFERENCES "RiskAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskExposure" ADD CONSTRAINT "RiskExposure_gesId_fkey" FOREIGN KEY ("gesId") REFERENCES "Ges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskExposure" ADD CONSTRAINT "RiskExposure_riskAgentId_fkey" FOREIGN KEY ("riskAgentId") REFERENCES "RiskAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatteryExam" ADD CONSTRAINT "BatteryExam_examBatteryId_fkey" FOREIGN KEY ("examBatteryId") REFERENCES "ExamBattery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatteryExam" ADD CONSTRAINT "BatteryExam_medicalExamId_fkey" FOREIGN KEY ("medicalExamId") REFERENCES "MedicalExam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_currentGesId_fkey" FOREIGN KEY ("currentGesId") REFERENCES "Ges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderBattery" ADD CONSTRAINT "OrderBattery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ExamOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderBattery" ADD CONSTRAINT "OrderBattery_batteryId_fkey" FOREIGN KEY ("batteryId") REFERENCES "ExamBattery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamOrder" ADD CONSTRAINT "ExamOrder_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamOrder" ADD CONSTRAINT "ExamOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamOrder" ADD CONSTRAINT "ExamOrder_gesId_fkey" FOREIGN KEY ("gesId") REFERENCES "Ges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRule" ADD CONSTRAINT "MedicalRule_batteryId_fkey" FOREIGN KEY ("batteryId") REFERENCES "ExamBattery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExamBatteryToRiskExposure" ADD CONSTRAINT "_ExamBatteryToRiskExposure_A_fkey" FOREIGN KEY ("A") REFERENCES "ExamBattery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExamBatteryToRiskExposure" ADD CONSTRAINT "_ExamBatteryToRiskExposure_B_fkey" FOREIGN KEY ("B") REFERENCES "RiskExposure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExamBatteryToGes" ADD CONSTRAINT "_ExamBatteryToGes_A_fkey" FOREIGN KEY ("A") REFERENCES "ExamBattery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExamBatteryToGes" ADD CONSTRAINT "_ExamBatteryToGes_B_fkey" FOREIGN KEY ("B") REFERENCES "Ges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
