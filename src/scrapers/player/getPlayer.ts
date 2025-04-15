import { load } from "cheerio";

import { baseUrl } from "@/constants";
import { Player } from "@/types/player";

import { cleanPhoto, cleanCountry, cleanName } from "@/utils";

interface getPlayerProps {
  playerId: string;
}

const getPlayer = async ({ playerId }: getPlayerProps): Promise<Player> => {
  const playerUrl = `${baseUrl}/player/${playerId}`;

  const response = await fetch(playerUrl);
  const html = await response.text();
  const $ = load(html);

  const player = new Object() as Player;

  player.playerId = playerId;
  player.alias = $("h1.wf-title").text().trim();
  player.name = $("h2.player-real-name").text().trim();
  player.imageUrl = cleanPhoto($(".player-header img").attr("src") || "");
  player.country = cleanCountry(
    $(".player-header .ge-text-light").text().trim()
  );
  player.teamId =
    $("div.player-summary-container-1 > div:nth-child(6) > a")
      .attr("href")
      ?.split("/")[2] || "";
  const teamDiv = $("div.player-summary-container-1 > div:nth-child(6) > a");
  let category = "";
  const tagDiv = teamDiv.find(".wf-tag");
  if (!!tagDiv) {
    const role = cleanName(tagDiv.text());
    if (!role.toLocaleLowerCase().includes("sub")) {
      category = role;
    }
  }

  player.type = category === "" ? "player" : "staff";
  player.earnings = $(".player-summary-container-2 .wf-card:nth-child(4) span")
    .text()
    .trim()
    ?.split("\n")[0];
  player.currentScore = 0;
  player.oldScore = 0;
  player.previousScore = 0;

  return player;
};

export default getPlayer;
