import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();
export async function GET() {
  try {
    await prisma.match.deleteMany();
    await prisma.team.deleteMany();
    await prisma.player.deleteMany();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: err });
  } finally {
    await prisma.$disconnect();
  }
}
