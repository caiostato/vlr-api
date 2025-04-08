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
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    const player = await prisma.player.findUnique({
      where: {
        externalId: id,
      },
    });

    if (player === null) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }
    console.log(player);

    return NextResponse.json(player, { status: 200 });
  } catch (err) {
    return NextResponse.json(err, { status: 400 });
  } finally {
    await prisma.$disconnect();
  }
}
