/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Skin` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Skin_name_key" ON "Skin"("name");
