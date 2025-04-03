import { NextResponse } from "next/server";
import { load } from "cheerio";

import Player from "@/types/player";

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
    const response = await fetch(`https://www.vlr.gg/player/${id}`);
    const html = await response.text();
    const $ = load(html);

    if (
      $("#wrapper > .col-container > div:first-child")
        .text()
        .includes("Page not found")
    ) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const player = new Object() as Player;

    player.nickName = $("h1.wf-title").text().trim();
    player.realName = $("h2.player-real-name").text().trim();
    player.id = id;
    player.link = `https://www.vlr.gg/player/${id}`;
    player.imgUrl = cleanPhoto($(".player-header img").attr("src") || "");
    player.country = cleanCountry(
      $(".player-header .ge-text-light").text().trim()
    );
    player.team = {
      id:
        $("div.player-summary-container-1 > div:nth-child(6) > a")
          .attr("href")
          ?.split("/")[2] || "",

      name:
        $("div.player-summary-container-1 > div:nth-child(6) > a")
          .attr("href")
          ?.split("/")[3] || "",
      logo:
        $(
          "div.player-summary-container-1 > div:nth-child(6) > a > div > img"
        ).attr("src") || "",
    };
    player.role = $(".profile-role").text().trim();
    player.earnings = $(
      ".player-summary-container-2 .wf-card:nth-child(4) span"
    )
      .text()
      .trim()
      ?.split("\n")[0];

    return NextResponse.json(player, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}

const cleanCountry = (country: string) => {
  try {
    country = country.split("\n")[2].replace(/[\n,\t]/g, "");
  } catch {
    country = "";
  }
  return country;
};
const cleanPhoto = (photo: string) => {
  if (photo === undefined) return "";
  if (photo.includes("owcdn.net")) photo = `https:${photo}`;
  else photo = "";
  return photo.replace(/[\n,\t]/g, "");
};
