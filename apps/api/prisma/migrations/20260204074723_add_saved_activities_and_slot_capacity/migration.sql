-- CreateEnum
CREATE TYPE "SlotCapacityStatus" AS ENUM ('active', 'inactive');

-- CreateTable
CREATE TABLE "saved_activities" (
    "user_id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activity_snapshot" JSONB,

    CONSTRAINT "saved_activities_pkey" PRIMARY KEY ("user_id","activity_id")
);

-- CreateTable
CREATE TABLE "slot_capacity" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "slot_start" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "booked_seats" INTEGER NOT NULL DEFAULT 0,
    "status" "SlotCapacityStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slot_capacity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_activities_user_id_saved_at_idx" ON "saved_activities"("user_id", "saved_at" DESC);

-- CreateIndex
CREATE INDEX "slot_capacity_activity_id_slot_start_idx" ON "slot_capacity"("activity_id", "slot_start");

-- CreateIndex
CREATE INDEX "slot_capacity_activity_id_slot_start_status_idx" ON "slot_capacity"("activity_id", "slot_start", "status");

-- CreateIndex
CREATE UNIQUE INDEX "slot_capacity_activity_id_slot_start_key" ON "slot_capacity"("activity_id", "slot_start");

-- AddForeignKey
ALTER TABLE "saved_activities" ADD CONSTRAINT "saved_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_activities" ADD CONSTRAINT "saved_activities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_capacity" ADD CONSTRAINT "slot_capacity_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
