-- CreateTable
CREATE TABLE "_banned_channel_members" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_banned_channel_members_AB_unique" ON "_banned_channel_members"("A", "B");

-- CreateIndex
CREATE INDEX "_banned_channel_members_B_index" ON "_banned_channel_members"("B");

-- AddForeignKey
ALTER TABLE "_banned_channel_members" ADD CONSTRAINT "_banned_channel_members_A_fkey" FOREIGN KEY ("A") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_banned_channel_members" ADD CONSTRAINT "_banned_channel_members_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
