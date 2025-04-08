import getMatches from "@/scrapers/match/getMatches";
import { NextResponse } from "next/server";

export async function GET() {
  const matches = await getMatches();
  return NextResponse.json(matches, { status: 200 });
}
