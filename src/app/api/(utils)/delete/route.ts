import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();
export async function DELETE() {
  try {
    await prisma.team.deleteMany();
    await prisma.player.deleteMany();
    await prisma.playerStats.deleteMany();
    await prisma.playerStatsAdvanced.deleteMany();
    await prisma.playerGame.deleteMany();
    await prisma.teamGame.deleteMany();
    await prisma.gameMatch.deleteMany();
    await prisma.match.deleteMany();

    return NextResponse.json({ message: "All deleted" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: err }, { status: 400 });
  } finally {
    await prisma.$disconnect();
  }
}
