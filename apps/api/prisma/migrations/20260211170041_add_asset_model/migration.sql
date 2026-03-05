/*
  Warnings:

  - A unique constraint covering the columns `[logo_asset_id]` on the table `Business` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[photo_asset_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "logo_asset_id" UUID;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "photo_asset_id" UUID;

-- AlterTable
ALTER TABLE "activity_images" ADD COLUMN     "asset_id" UUID;

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'firebase',
    "storage_key" TEXT NOT NULL,
    "download_token" TEXT,
    "content_type" TEXT,
    "size_bytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "variants" JSONB,
    "user_id" UUID,
    "business_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assets_user_id_idx" ON "assets"("user_id");

-- CreateIndex
CREATE INDEX "assets_business_id_idx" ON "assets"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "Business_logo_asset_id_key" ON "Business"("logo_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_photo_asset_id_key" ON "User"("photo_asset_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_photo_asset_id_fkey" FOREIGN KEY ("photo_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_logo_asset_id_fkey" FOREIGN KEY ("logo_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_images" ADD CONSTRAINT "activity_images_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
