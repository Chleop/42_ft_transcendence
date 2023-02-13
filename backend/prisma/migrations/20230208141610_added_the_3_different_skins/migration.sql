/*
  Warnings:

  - You are about to drop the column `url` on the `Skin` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Skin_url_key";

-- AlterTable
ALTER TABLE "Skin" DROP COLUMN "url",
ADD COLUMN     "background" TEXT NOT NULL DEFAULT 'resource/skin/background/default.jpg',
ADD COLUMN     "ball" TEXT NOT NULL DEFAULT 'resource/skin/ball/default.jpg',
ADD COLUMN     "paddle" TEXT NOT NULL DEFAULT 'resource/skin/paddle/default.jpg';
