-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('active', 'cancelled', 'completed');

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "slot_start" TIMESTAMP(3) NOT NULL,
    "participants_count" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'active',
    "activity_snapshot" JSONB NOT NULL,
    "business_snapshot" JSONB,
    "selection_snapshot" JSONB NOT NULL,
    "price_snapshot" JSONB NOT NULL,
    "payment_amount" DECIMAL(10,2),
    "payment_currency" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookings_user_id_slot_start_idx" ON "bookings"("user_id", "slot_start" DESC);

-- CreateIndex
CREATE INDEX "bookings_activity_id_slot_start_idx" ON "bookings"("activity_id", "slot_start");

-- CreateIndex
CREATE INDEX "bookings_business_id_slot_start_idx" ON "bookings"("business_id", "slot_start");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
