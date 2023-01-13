/*
  Warnings:

  - You are about to drop the column `chantype` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `channelid` on the `ChannelMessage` table. All the data in the column will be lost.
  - You are about to drop the column `datetime` on the `ChannelMessage` table. All the data in the column will be lost.
  - You are about to drop the column `senderid` on the `ChannelMessage` table. All the data in the column will be lost.
  - You are about to drop the column `datetime` on the `DM` table. All the data in the column will be lost.
  - You are about to drop the column `datetime` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `winnerid` on the `Game` table. All the data in the column will be lost.
  - Added the required column `channelId` to the `ChannelMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `ChannelMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `winnerId` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChannelMessage" DROP CONSTRAINT "ChannelMessage_channelid_fkey";

-- DropForeignKey
ALTER TABLE "ChannelMessage" DROP CONSTRAINT "ChannelMessage_senderid_fkey";

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_winnerid_fkey";

-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "chantype",
ADD COLUMN     "chanType" "ChanType" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "ChannelMessage" DROP COLUMN "channelid",
DROP COLUMN "datetime",
DROP COLUMN "senderid",
ADD COLUMN     "channelId" TEXT NOT NULL,
ADD COLUMN     "dateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "senderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DM" DROP COLUMN "datetime",
ADD COLUMN     "dateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "datetime",
DROP COLUMN "winnerid",
ADD COLUMN     "dateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "winnerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ChannelMessage" ADD CONSTRAINT "ChannelMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMessage" ADD CONSTRAINT "ChannelMessage_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
