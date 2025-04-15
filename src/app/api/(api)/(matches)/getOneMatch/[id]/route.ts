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
        { error: "Match ID is required" },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: {
        externalId: id,
      },
      include: {
        games: {
          include: {
            teams: {
              include: {
                playersGame: {
                  include: {
                    stats: true,
                    statsAdvanced: true,
                  },
                },
              },
            },
          },
        },
        teams: true,
      },
    });

    if (match === null) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    console.log(match);

    return NextResponse.json(match, { status: 200 });
  } catch (err) {
    return NextResponse.json(err, { status: 400 });
  } finally {
    await prisma.$disconnect();
  }
}
