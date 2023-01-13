-- CreateTable
CREATE TABLE "_pending friendship" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_pending friendship_AB_unique" ON "_pending friendship"("A", "B");

-- CreateIndex
CREATE INDEX "_pending friendship_B_index" ON "_pending friendship"("B");

-- AddForeignKey
ALTER TABLE "_pending friendship" ADD CONSTRAINT "_pending friendship_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_pending friendship" ADD CONSTRAINT "_pending friendship_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
