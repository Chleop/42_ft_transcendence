/*
  Warnings:

  - You are about to drop the column `tFSecretCreationDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `twoFactSecret` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "tFSecretCreationDate",
DROP COLUMN "twoFactSecret",
ADD COLUMN     "twoFACode" TEXT,
ADD COLUMN     "twoFACreationDate" TIMESTAMP(3);
