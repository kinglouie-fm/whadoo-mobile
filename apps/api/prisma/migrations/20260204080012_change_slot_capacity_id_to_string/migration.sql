/*
  Warnings:

  - The primary key for the `slot_capacity` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "slot_capacity" DROP CONSTRAINT "slot_capacity_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "slot_capacity_pkey" PRIMARY KEY ("id");
