/*
  Warnings:

  - You are about to drop the column `matchId` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `nick` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Team` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[match_id]` on the table `Match` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `match_id` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `alias` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image_url` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `logo` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player_id` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_teamId_fkey";

-- DropIndex
DROP INDEX "Match_matchId_key";

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "matchId",
ADD COLUMN     "match_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "nick",
DROP COLUMN "teamId",
ADD COLUMN     "alias" TEXT NOT NULL,
ADD COLUMN     "current_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "image_url" TEXT NOT NULL,
ADD COLUMN     "old_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "previous_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "team_id" TEXT;

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "id",
ADD COLUMN     "logo" TEXT NOT NULL,
ADD COLUMN     "player_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Match_match_id_key" ON "Match"("match_id");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("external_id") ON DELETE SET NULL ON UPDATE CASCADE;
