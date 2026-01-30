-- CreateEnum
CREATE TYPE "AvailabilityTemplateStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('draft', 'published', 'inactive');

-- CreateTable: availability_templates
CREATE TABLE "availability_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "days_of_week" SMALLINT[] NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "slot_duration_minutes" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "image_url" TEXT,
    "status" "AvailabilityTemplateStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: availability_exceptions
CREATE TABLE "availability_exceptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activities
CREATE TABLE "activities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'draft',
    "type_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "address" TEXT,
    "city" TEXT,
    "lat" DECIMAL(10,8),
    "lng" DECIMAL(11,8),
    "price_from" DECIMAL(10,2),
    "config" JSONB NOT NULL DEFAULT '{}',
    "pricing" JSONB NOT NULL DEFAULT '{}',
    "availability_template_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activity_images
CREATE TABLE "activity_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "activity_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "is_thumbnail" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: availability_templates
CREATE INDEX "availability_templates_business_id_updated_at_idx" ON "availability_templates"("business_id", "updated_at" DESC);
CREATE INDEX "availability_templates_status_idx" ON "availability_templates"("status");

-- CreateIndex: availability_exceptions
CREATE INDEX "availability_exceptions_template_id_idx" ON "availability_exceptions"("template_id", "start_date", "end_date");

-- CreateIndex: activities
CREATE INDEX "activities_business_id_updated_at_idx" ON "activities"("business_id", "updated_at" DESC);
CREATE INDEX "activities_status_city_updated_at_idx" ON "activities"("status", "city", "updated_at" DESC);
CREATE INDEX "activities_availability_template_id_idx" ON "activities"("availability_template_id");

-- CreateIndex: activity_images
CREATE INDEX "activity_images_activity_id_idx" ON "activity_images"("activity_id");

-- AddForeignKey
ALTER TABLE "availability_templates" ADD CONSTRAINT "availability_templates_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_exceptions" ADD CONSTRAINT "availability_exceptions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "availability_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_availability_template_id_fkey" FOREIGN KEY ("availability_template_id") REFERENCES "availability_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_images" ADD CONSTRAINT "activity_images_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
