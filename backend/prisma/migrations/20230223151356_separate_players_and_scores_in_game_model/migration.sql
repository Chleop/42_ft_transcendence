/*
  Warnings:

  - You are about to drop the column `scores` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the `_gamesplayed` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `player0_id` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player1_id` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `score0` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `score1` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_gamesplayed" DROP CONSTRAINT "_gamesplayed_A_fkey";

-- DropForeignKey
ALTER TABLE "_gamesplayed" DROP CONSTRAINT "_gamesplayed_B_fkey";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "scores",
ADD COLUMN     "player0_id" TEXT NOT NULL,
ADD COLUMN     "player1_id" TEXT NOT NULL,
ADD COLUMN     "score0" INTEGER NOT NULL,
ADD COLUMN     "score1" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_gamesplayed";

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_player0_id_fkey" FOREIGN KEY ("player0_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_player1_id_fkey" FOREIGN KEY ("player1_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
