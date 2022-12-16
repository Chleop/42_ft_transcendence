/*
  Warnings:

  - You are about to drop the column `skinid` on the `User` table. All the data in the column will be lost.
  - Added the required column `skinId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_skinid_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "skinid",
ADD COLUMN     "skinId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_skinId_fkey" FOREIGN KEY ("skinId") REFERENCES "Skin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
