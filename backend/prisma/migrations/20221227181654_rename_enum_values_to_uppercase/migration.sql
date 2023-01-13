/*
  Warnings:

  - The values [public,private,protected] on the enum `ChanType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ChanType_new" AS ENUM ('PUBLIC', 'PRIVATE', 'PROTECTED');
ALTER TABLE "Channel" ALTER COLUMN "chantype" DROP DEFAULT;
ALTER TABLE "Channel" ALTER COLUMN "chantype" TYPE "ChanType_new" USING ("chantype"::text::"ChanType_new");
ALTER TYPE "ChanType" RENAME TO "ChanType_old";
ALTER TYPE "ChanType_new" RENAME TO "ChanType";
DROP TYPE "ChanType_old";
ALTER TABLE "Channel" ALTER COLUMN "chantype" SET DEFAULT 'PUBLIC';
COMMIT;

-- AlterTable
ALTER TABLE "Channel" ALTER COLUMN "chantype" SET DEFAULT 'PUBLIC';
