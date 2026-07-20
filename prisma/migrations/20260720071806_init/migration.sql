-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SELLER', 'OPERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE');

-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'OCCUPIED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('FOOD', 'DRINK', 'SNACK', 'DESSERT', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductBatchStatus" AS ENUM ('ACTIVE', 'SOLD_OUT', 'EXPIRED', 'DISCOUNTED', 'DONATED', 'REMOVED', 'PICKUP_PENDING', 'PICKED_UP');

-- CreateEnum
CREATE TYPE "ExpirationAction" AS ENUM ('DISCOUNT', 'REMOVE', 'DONATE', 'SELLER_PICKUP');

-- CreateEnum
CREATE TYPE "StockingStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PickupCodeStatus" AS ENUM ('UNUSED', 'USED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'SELLER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "provider" "AuthProvider" NOT NULL DEFAULT 'GOOGLE',
    "providerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessDescription" TEXT,
    "phoneNumber" TEXT,
    "businessAddress" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendingMachine" (
    "id" TEXT NOT NULL,
    "machineCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "status" "MachineStatus" NOT NULL DEFAULT 'ACTIVE',
    "customerQrCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendingMachine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineSlot" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "slotCode" TEXT NOT NULL,
    "slotNumber" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "status" "SlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "category" "ProductCategory" NOT NULL,
    "defaultPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "reservationCode" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "reservationDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationSlot" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "machineSlotId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductBatch" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "machineSlotId" TEXT NOT NULL,
    "batchCode" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "remainingQuantity" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "originalPrice" DECIMAL(12,2) NOT NULL,
    "manufacturedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "ProductBatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpirationPolicy" (
    "id" TEXT NOT NULL,
    "productBatchId" TEXT NOT NULL,
    "thresholdHours" INTEGER NOT NULL,
    "action" "ExpirationAction" NOT NULL,
    "discountPercentage" DECIMAL(5,2),
    "pickupDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpirationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockingSession" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "StockingStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerOrder" (
    "id" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "customerId" TEXT,
    "machineId" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productBatchId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupCode" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "PickupCodeStatus" NOT NULL DEFAULT 'UNUSED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PickupCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_providerId_key" ON "User"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_userId_key" ON "SellerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VendingMachine_machineCode_key" ON "VendingMachine"("machineCode");

-- CreateIndex
CREATE UNIQUE INDEX "VendingMachine_customerQrCode_key" ON "VendingMachine"("customerQrCode");

-- CreateIndex
CREATE UNIQUE INDEX "MachineSlot_machineId_slotCode_key" ON "MachineSlot"("machineId", "slotCode");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_reservationCode_key" ON "Reservation"("reservationCode");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationSlot_reservationId_machineSlotId_key" ON "ReservationSlot"("reservationId", "machineSlotId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBatch_batchCode_key" ON "ProductBatch"("batchCode");

-- CreateIndex
CREATE UNIQUE INDEX "ExpirationPolicy_productBatchId_key" ON "ExpirationPolicy"("productBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "StockingSession_reservationId_key" ON "StockingSession"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "StockingSession_accessToken_key" ON "StockingSession"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "StockingSession_accessCode_key" ON "StockingSession"("accessCode");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerOrder_orderCode_key" ON "CustomerOrder"("orderCode");

-- CreateIndex
CREATE UNIQUE INDEX "PickupCode_orderId_key" ON "PickupCode"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PickupCode_code_key" ON "PickupCode"("code");

-- AddForeignKey
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineSlot" ADD CONSTRAINT "MachineSlot_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "VendingMachine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "VendingMachine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationSlot" ADD CONSTRAINT "ReservationSlot_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationSlot" ADD CONSTRAINT "ReservationSlot_machineSlotId_fkey" FOREIGN KEY ("machineSlotId") REFERENCES "MachineSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBatch" ADD CONSTRAINT "ProductBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBatch" ADD CONSTRAINT "ProductBatch_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBatch" ADD CONSTRAINT "ProductBatch_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBatch" ADD CONSTRAINT "ProductBatch_machineSlotId_fkey" FOREIGN KEY ("machineSlotId") REFERENCES "MachineSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpirationPolicy" ADD CONSTRAINT "ExpirationPolicy_productBatchId_fkey" FOREIGN KEY ("productBatchId") REFERENCES "ProductBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockingSession" ADD CONSTRAINT "StockingSession_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockingSession" ADD CONSTRAINT "StockingSession_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockingSession" ADD CONSTRAINT "StockingSession_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "VendingMachine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "VendingMachine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CustomerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productBatchId_fkey" FOREIGN KEY ("productBatchId") REFERENCES "ProductBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupCode" ADD CONSTRAINT "PickupCode_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CustomerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
