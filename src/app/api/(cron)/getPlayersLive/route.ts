import { NextResponse } from "next/server";

export async function GET() {
  // const matches = await getMatches();
  // // matches.forEach((match) => {
  // //   console.log(match.status);
  // // });

  // // const liveMatches = matches.filter((match) => match.status === "Ongoing");
  // //const liveMatch = createMatch({ matchId: liveMatches[0].id})

  // const liveMatch = await createMatch({ matchId: matches[0].id });

  return NextResponse.json({}, { status: 200 });
}
