/*
  Warnings:

  - You are about to drop the column `logo_url` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Business" DROP COLUMN "logo_url";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "photoUrl";
