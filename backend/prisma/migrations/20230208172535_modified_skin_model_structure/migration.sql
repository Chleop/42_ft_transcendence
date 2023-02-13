/*
  Warnings:

  - You are about to drop the column `name` on the `Skin` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[skinId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_skinId_fkey";

-- DropIndex
DROP INDEX "Skin_name_key";

-- AlterTable
ALTER TABLE "Skin" DROP COLUMN "name";

-- CreateIndex
CREATE UNIQUE INDEX "User_skinId_key" ON "User"("skinId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_skinId_fkey" FOREIGN KEY ("skinId") REFERENCES "Skin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
