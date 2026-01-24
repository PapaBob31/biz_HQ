/*
  Warnings:

  - You are about to drop the column `totalAfterTax` on the `Sale` table. All the data in the column will be lost.
  - Added the required column `loyaltyDiscount` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subTotal` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "totalAfterTax",
ADD COLUMN     "loyaltyDiscount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "subTotal" DOUBLE PRECISION NOT NULL;
