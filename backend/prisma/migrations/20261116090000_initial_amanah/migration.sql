-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'MAHALL_ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "EligibilityStatus" AS ENUM ('PENDING', 'MORE_INFORMATION_REQUIRED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "googleId" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "mahallId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mahall" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mahall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityCase" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "reviewingMahallId" TEXT,
    "status" "EligibilityStatus" NOT NULL DEFAULT 'PENDING',
    "locality" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "householdSize" INTEGER NOT NULL,
    "monthlyIncomePaise" INTEGER NOT NULL,
    "monthlyExpensesPaise" INTEGER NOT NULL,
    "additionalInformation" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EligibilityCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_mahallId_idx" ON "User"("mahallId");

-- CreateIndex
CREATE UNIQUE INDEX "EligibilityCase_applicantId_key" ON "EligibilityCase"("applicantId");

-- CreateIndex
CREATE INDEX "EligibilityCase_reviewingMahallId_status_idx" ON "EligibilityCase"("reviewingMahallId", "status");

-- CreateIndex
CREATE INDEX "EligibilityCase_postalCode_status_idx" ON "EligibilityCase"("postalCode", "status");

-- CreateIndex
CREATE INDEX "EligibilityCase_reviewedById_idx" ON "EligibilityCase"("reviewedById");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_mahallId_fkey" FOREIGN KEY ("mahallId") REFERENCES "Mahall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityCase" ADD CONSTRAINT "EligibilityCase_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityCase" ADD CONSTRAINT "EligibilityCase_reviewingMahallId_fkey" FOREIGN KEY ("reviewingMahallId") REFERENCES "Mahall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityCase" ADD CONSTRAINT "EligibilityCase_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Protect backend-managed tables from public Data API access.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Mahall" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EligibilityCase" ENABLE ROW LEVEL SECURITY;
