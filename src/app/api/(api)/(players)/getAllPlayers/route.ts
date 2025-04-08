import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();
export async function GET() {
  try {
    const players = await prisma.player.findMany({
      where: {
        type: "player",
      },
    });

    if (players === null) {
      return NextResponse.json(
        { error: "No players in database" },
        { status: 404 }
      );
    }

    return NextResponse.json(players, { status: 200 });
  } catch (err) {
    return NextResponse.json(err, { status: 400 });
  } finally {
    await prisma.$disconnect();
  }
}
