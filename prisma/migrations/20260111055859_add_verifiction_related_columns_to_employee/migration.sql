/*
  Warnings:

  - You are about to drop the column `securityAnswer` on the `Employee` table. All the data in the column will be lost.
  - Added the required column `verified` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "securityAnswer",
ADD COLUMN     "otp_and_expirationts" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL;
