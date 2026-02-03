-- CreateTable
CREATE TABLE "user_swipes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "catalog_group_id" TEXT,
    "activity_id" UUID,
    "direction" TEXT NOT NULL,
    "city" TEXT,
    "type_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_swipes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_swipes_user_id_created_at_idx" ON "user_swipes"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_swipes_catalog_group_id_idx" ON "user_swipes"("catalog_group_id");

-- CreateIndex
CREATE INDEX "user_swipes_activity_id_idx" ON "user_swipes"("activity_id");

-- AddForeignKey
ALTER TABLE "user_swipes" ADD CONSTRAINT "user_swipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
