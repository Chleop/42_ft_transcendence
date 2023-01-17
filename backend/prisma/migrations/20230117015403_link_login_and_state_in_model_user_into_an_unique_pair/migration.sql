/*
  Warnings:

  - A unique constraint covering the columns `[login,state]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_login_state_key" ON "User"("login", "state");
