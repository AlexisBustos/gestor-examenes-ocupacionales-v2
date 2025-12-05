-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('TRANSITO', 'NOMINA');

-- AlterTable
ALTER TABLE "Worker" ADD COLUMN     "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'NOMINA';
