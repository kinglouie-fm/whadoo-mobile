-- Add catalog grouping fields to activities
ALTER TABLE "activities" ADD COLUMN "catalog_group_id" TEXT;
ALTER TABLE "activities" ADD COLUMN "catalog_group_title" TEXT;
ALTER TABLE "activities" ADD COLUMN "catalog_group_kind" TEXT;

-- Create indexes for catalog grouping
CREATE INDEX "activities_business_catalog_group_idx" ON "activities"("business_id", "catalog_group_id", "updated_at" DESC);
CREATE INDEX "activities_status_catalog_group_idx" ON "activities"("status", "catalog_group_id");
