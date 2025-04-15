import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();
export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      where: { status: { in: ["Upcoming", "Ongoing"] } },
      include: {
        teams: true,
      },
      orderBy: {
        dateTime: "asc",
      },
    });

    if (matches === null) {
      return NextResponse.json(
        { error: "No matches in database" },
        { status: 404 }
      );
    }

    return NextResponse.json(matches, { status: 200 });
  } catch (err) {
    return NextResponse.json(err, { status: 400 });
  } finally {
    await prisma.$disconnect();
  }
}
