import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();
export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      where: {},
    });

    if (teams === null) {
      return NextResponse.json(
        { error: "No teams in database" },
        { status: 404 }
      );
    }

    return NextResponse.json(teams, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (err) {
    return NextResponse.json(err, { status: 400 });
  } finally {
    await prisma.$disconnect();
  }
}
