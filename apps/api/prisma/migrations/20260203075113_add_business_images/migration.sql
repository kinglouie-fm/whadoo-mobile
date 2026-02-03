-- AlterTable
ALTER TABLE "activities" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "activity_images" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "availability_exceptions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "availability_templates" ALTER COLUMN "id" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "availability_exceptions_template_id_idx" RENAME TO "availability_exceptions_template_id_start_date_end_date_idx";
