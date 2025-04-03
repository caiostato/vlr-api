import { NextResponse } from "next/server";
import { load } from "cheerio";
import PlayerComparison from "./_types/playerComparison";
import getPlayerMatch from "@/utils/getPlayerMatch";

export async function GET(req: Request, context: { params: { id: string } }) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }
    const playerResponse = await fetch(`https://www.vlr.gg/player/${id}`);
    const playerHtml = await playerResponse.text();
    const $ = load(playerHtml);

    if (
      $("#wrapper > .col-container > div:first-child")
        .text()
        .includes("Page not found")
    ) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const res = new Object() as PlayerComparison;

    res.playerId = id;
    res.playerName = $("h1.wf-title").text().trim();
    res.playerLink = `https://www.vlr.gg/player/${id}`;
    res.playerTeam =
      $("div.player-summary-container-1 > div:nth-child(6) > a")
        .attr("href")
        ?.split("/")[3] || "";

    const firstMatch = await getPlayerMatch({
      matchId: $("a.wf-card")[0].attributes[0].value.split("/")[1],
      playerName: $("h1.wf-title").text().trim(),
    });
    const secondMatch = await getPlayerMatch({
      matchId: $("a.wf-card")[1].attributes[0].value.split("/")[1],
      playerName: $("h1.wf-title").text().trim(),
    });

    res.firstMatch = firstMatch;
    res.secondMatch = secondMatch;

    return NextResponse.json(res, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
