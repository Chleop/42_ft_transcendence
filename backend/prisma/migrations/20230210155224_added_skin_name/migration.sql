/*
  Warnings:

  - Added the required column `name` to the `Skin` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Skin" ADD COLUMN     "name" TEXT NOT NULL;
