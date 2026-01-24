/*
  Warnings:

  - The primary key for the `BusinessDetails` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id]` on the table `BusinessDetails` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `id` on the `BusinessDetails` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "OnlyValidId" AS ENUM ('one');

-- AlterTable
ALTER TABLE "BusinessDetails" DROP CONSTRAINT "BusinessDetails_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" "OnlyValidId" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "BusinessDetails_id_key" ON "BusinessDetails"("id");
