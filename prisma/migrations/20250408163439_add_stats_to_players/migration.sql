/*
  Warnings:

  - The primary key for the `Match` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `external_id` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `match_id` on the `Match` table. All the data in the column will be lost.
  - The primary key for the `Player` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `current_score` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `external_id` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `old_score` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `previous_score` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `team_id` on the `Player` table. All the data in the column will be lost.
  - The primary key for the `Team` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `external_id` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `matchId` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `player_id` on the `Team` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[matchId]` on the table `Match` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[playerId]` on the table `Player` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamId]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `externalId` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `matchId` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `externalId` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playerId` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `externalId` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamId` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_team_id_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_matchId_fkey";

-- DropIndex
DROP INDEX "Match_match_id_key";

-- AlterTable
ALTER TABLE "Match" DROP CONSTRAINT "Match_pkey",
DROP COLUMN "external_id",
DROP COLUMN "id",
DROP COLUMN "match_id",
ADD COLUMN     "externalId" TEXT NOT NULL,
ADD COLUMN     "matchId" INTEGER NOT NULL,
ADD CONSTRAINT "Match_pkey" PRIMARY KEY ("externalId");

-- AlterTable
ALTER TABLE "Player" DROP CONSTRAINT "Player_pkey",
DROP COLUMN "current_score",
DROP COLUMN "external_id",
DROP COLUMN "id",
DROP COLUMN "image_url",
DROP COLUMN "old_score",
DROP COLUMN "previous_score",
DROP COLUMN "team_id",
ADD COLUMN     "acs" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "adr" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "assistsPr" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "currentScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deaths" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "externalId" TEXT NOT NULL,
ADD COLUMN     "fdpr" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fkpr" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "kast" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "kd" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "kills" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "oldScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "playerId" INTEGER NOT NULL,
ADD COLUMN     "previousScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "teamId" TEXT,
ADD CONSTRAINT "Player_pkey" PRIMARY KEY ("externalId");

-- AlterTable
ALTER TABLE "Team" DROP CONSTRAINT "Team_pkey",
DROP COLUMN "external_id",
DROP COLUMN "matchId",
DROP COLUMN "player_id",
ADD COLUMN     "externalId" TEXT NOT NULL,
ADD COLUMN     "teamId" INTEGER NOT NULL,
ADD CONSTRAINT "Team_pkey" PRIMARY KEY ("externalId");

-- CreateTable
CREATE TABLE "_MatchToTeam" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MatchToTeam_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MatchToTeam_B_index" ON "_MatchToTeam"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Match_matchId_key" ON "Match"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_playerId_key" ON "Player"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_teamId_key" ON "Team"("teamId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("externalId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MatchToTeam" ADD CONSTRAINT "_MatchToTeam_A_fkey" FOREIGN KEY ("A") REFERENCES "Match"("externalId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MatchToTeam" ADD CONSTRAINT "_MatchToTeam_B_fkey" FOREIGN KEY ("B") REFERENCES "Team"("externalId") ON DELETE CASCADE ON UPDATE CASCADE;
