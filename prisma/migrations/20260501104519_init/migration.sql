-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('FR', 'EN');

-- CreateEnum
CREATE TYPE "SportType" AS ENUM ('BASEBALL', 'SOCCER', 'FOOTBALL', 'TENNIS', 'BASKETBALL', 'PATINOIRE', 'PATINOIRE_DEK_HOCKEY', 'PATINOIRE_BASKETBALL', 'PETANQUE', 'PISCINE', 'SKATE_PARC', 'BADMINTON', 'STATIONNEMENT', 'JEUX_ENFANTS', 'GLISSADE', 'ECLAIRAGE_SERVICE', 'AUTRE');

-- CreateEnum
CREATE TYPE "IesClass" AS ENUM ('CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IV', 'NA');

-- CreateEnum
CREATE TYPE "PoleType" AS ENUM ('BOIS', 'ACIER', 'BETON', 'ALUMINIUM', 'MURAL', 'AUTRE');

-- CreateEnum
CREATE TYPE "MountType" AS ENUM ('TRAVERSE', 'FUT');

-- CreateEnum
CREATE TYPE "Voltage" AS ENUM ('V120', 'V220', 'V347', 'V480', 'V277');

-- CreateEnum
CREATE TYPE "Module" AS ENUM ('SIMPLE', 'DOUBLE', 'QUADRUPLE');

-- CreateEnum
CREATE TYPE "Power" AS ENUM ('M200', 'M300', 'M400', 'M600', 'M800', 'M1200');

-- CreateEnum
CREATE TYPE "Optic" AS ENUM ('D15', 'D30', 'D60', 'D90');

-- CreateEnum
CREATE TYPE "Cct" AS ENUM ('K3000', 'K4000', 'K5700');

-- CreateEnum
CREATE TYPE "Cri" AS ENUM ('CRI70', 'CRI80');

-- CreateEnum
CREATE TYPE "Visor" AS ENUM ('VN', 'VSS', 'VLS', 'VN_VN', 'VSS_VSS', 'VSS_VN', 'VLS_VSS', 'VLS_VN');

-- CreateEnum
CREATE TYPE "Bracket" AS ENUM ('BTU', 'BTUE', 'BTR', 'BTE');

-- CreateEnum
CREATE TYPE "ControlArchitecture" AS ENUM ('BASE', 'SMART_POLE', 'SMART_POWERBOX', 'SMART_ZONE');

-- CreateEnum
CREATE TYPE "GoNoGo" AS ENUM ('GO', 'NOGO');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'FR',
    "name" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "hqOseEligible" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Field" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sportType" "SportType" NOT NULL,
    "iesClass" "IesClass" NOT NULL,
    "surfaceM2" DOUBLE PRECISION NOT NULL,
    "perimeterGeoJson" JSONB,
    "infieldGeoJson" JSONB,
    "outfieldGeoJson" JSONB,
    "screenshotS3Key" TEXT,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pole" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "type" "PoleType" NOT NULL,
    "heightM" DOUBLE PRECISION NOT NULL,
    "mountType" "MountType" NOT NULL,
    "nbCrossarms" INTEGER NOT NULL DEFAULT 0,
    "nbExistingFixtures" INTEGER NOT NULL DEFAULT 0,
    "existingPowerW" INTEGER NOT NULL,
    "voltage" "Voltage" NOT NULL,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,

    CONSTRAINT "Pole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuration" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "module" "Module" NOT NULL,
    "power" "Power" NOT NULL,
    "optic" "Optic" NOT NULL DEFAULT 'D30',
    "cct" "Cct" NOT NULL DEFAULT 'K4000',
    "cri" "Cri" NOT NULL DEFAULT 'CRI70',
    "voltage" "Voltage" NOT NULL DEFAULT 'V480',
    "visor" "Visor" NOT NULL DEFAULT 'VN',
    "bracket" "Bracket" NOT NULL DEFAULT 'BTU',
    "withRegulation" BOOLEAN NOT NULL DEFAULT true,
    "control" "ControlArchitecture" NOT NULL DEFAULT 'BASE',
    "accessories" JSONB,

    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scenarioATotalQty" INTEGER NOT NULL,
    "scenarioATotalPowerW" INTEGER NOT NULL,
    "scenarioATotalPriceCad" DOUBLE PRECISION NOT NULL,
    "scenarioBTotalQty" INTEGER,
    "scenarioBTotalPowerW" INTEGER,
    "scenarioBTotalPriceCad" DOUBLE PRECISION,
    "verdictGoNoGo" "GoNoGo" NOT NULL,
    "engineeringHours" DOUBLE PRECISION NOT NULL,
    "supervisionHours" DOUBLE PRECISION NOT NULL,
    "engineeringCostCad" DOUBLE PRECISION NOT NULL,
    "hqOseRebateCad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCostBeforeRebateCad" DOUBLE PRECISION NOT NULL,
    "totalCostAfterRebateCad" DOUBLE PRECISION NOT NULL,
    "energySavingsKwhYear" DOUBLE PRECISION NOT NULL,
    "ghgReductionKgYear" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "org" TEXT,
    "message" TEXT,
    "source" TEXT NOT NULL DEFAULT 'landing',

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_contactEmail_idx" ON "Project"("contactEmail");

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");

-- CreateIndex
CREATE INDEX "Field_projectId_idx" ON "Field"("projectId");

-- CreateIndex
CREATE INDEX "Pole_fieldId_idx" ON "Pole"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "Configuration_fieldId_key" ON "Configuration"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "Result_projectId_key" ON "Result"("projectId");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pole" ADD CONSTRAINT "Pole_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuration" ADD CONSTRAINT "Configuration_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
