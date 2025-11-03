/*
  Warnings:

  - You are about to drop the column `categoryId` on the `stores` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."shopStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'CLOSED');

-- DropForeignKey
ALTER TABLE "public"."stores" DROP CONSTRAINT "stores_categoryId_fkey";

-- AlterTable
ALTER TABLE "public"."stores" DROP COLUMN "categoryId",
ADD COLUMN     "shopStatus" "public"."shopStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "public"."store_categories" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_categories_storeId_categoryId_key" ON "public"."store_categories"("storeId", "categoryId");

-- AddForeignKey
ALTER TABLE "public"."store_categories" ADD CONSTRAINT "store_categories_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."store_categories" ADD CONSTRAINT "store_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
