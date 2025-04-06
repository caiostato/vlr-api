/*
  Warnings:

  - The primary key for the `Match` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Player` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Team` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `external_id` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `external_id` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `external_id` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_matchId_fkey";

-- AlterTable
ALTER TABLE "Match" DROP CONSTRAINT "Match_pkey",
ADD COLUMN     "external_id" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ADD CONSTRAINT "Match_pkey" PRIMARY KEY ("external_id");
DROP SEQUENCE "Match_id_seq";

-- AlterTable
ALTER TABLE "Player" DROP CONSTRAINT "Player_pkey",
ADD COLUMN     "external_id" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "teamId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Player_pkey" PRIMARY KEY ("external_id");
DROP SEQUENCE "Player_id_seq";

-- AlterTable
ALTER TABLE "Team" DROP CONSTRAINT "Team_pkey",
ADD COLUMN     "external_id" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "matchId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Team_pkey" PRIMARY KEY ("external_id");
DROP SEQUENCE "Team_id_seq";

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("external_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("external_id") ON DELETE SET NULL ON UPDATE CASCADE;
