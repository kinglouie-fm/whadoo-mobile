-- CreateTable: activity_type_definitions
CREATE TABLE "activity_type_definitions" (
    "type_id" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "display_name" TEXT NOT NULL,
    "config_schema" JSONB NOT NULL,
    "pricing_schema" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_definitions_pkey" PRIMARY KEY ("type_id", "schema_version")
);

-- CreateIndex
CREATE INDEX "activity_type_definitions_type_id_idx" ON "activity_type_definitions"("type_id");
