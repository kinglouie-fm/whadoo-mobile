/*
  Warnings:

  - You are about to drop the column `availability_template_id` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the `availability_exceptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `availability_templates` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_availability_template_id_fkey";

-- DropForeignKey
ALTER TABLE "availability_exceptions" DROP CONSTRAINT "availability_exceptions_template_id_fkey";

-- DropForeignKey
ALTER TABLE "availability_templates" DROP CONSTRAINT "availability_templates_business_id_fkey";

-- DropIndex
DROP INDEX "activities_availability_template_id_idx";

-- AlterTable
ALTER TABLE "activities" DROP COLUMN "availability_template_id";

-- DropTable
DROP TABLE "availability_exceptions";

-- DropTable
DROP TABLE "availability_templates";

-- DropEnum
DROP TYPE "AvailabilityTemplateStatus";
