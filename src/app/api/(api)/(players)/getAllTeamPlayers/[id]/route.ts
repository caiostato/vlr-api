import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }
    const players = await prisma.player.findMany({
      where: {
        type: "player",
        teamId: `${id}`,
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
