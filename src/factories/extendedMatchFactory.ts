import { baseUrl } from "@/constants";
import ExtendedStats from "@/types/advancedStats";
import Match from "@/types/match";
import Stats from "@/types/stats";
import { idGenerator } from "@/utils";
import axios from "axios";
import { load } from "cheerio";

interface CreateMatchProps {
  matchId: string;
}

type PlayerMatchStatsElement = {
  name: string;
  team: string;
  link: string;
  stats: Stats;
  extendedStats: ExtendedStats;
};

type createMatchResponse = {
  match: Match;
  players: PlayerMatchStatsElement[];
};

const createMatch = async ({
  matchId,
}: CreateMatchProps): Promise<createMatchResponse> => {
  const { data } = await axios.get(`${baseUrl}/${matchId}`);
  const $ = load(data);
  const matchObj = new Object() as Match;
  const players: PlayerMatchStatsElement[] = [];
  matchObj.id = matchId;
  matchObj.date = $(".match-header-date .moment-tz-convert:nth-child(1)")
    .text()
    .trim();
  matchObj.time = $(".match-header-date .moment-tz-convert:nth-child(2)")
    .text()
    .trim();
  matchObj.eventId =
    $(".match-header-super a.match-header-event").attr("href")?.split("/")[2] ||
    "0";
  matchObj.eventName = $(
    ".match-header-super a.match-header-event div > div:nth-child(1)"
  )
    .text()
    .trim();
  matchObj.logo =
    "https:" + $(".match-header-super a.match-header-event img").attr("src") ||
    "";

  matchObj.streams = [];
  $(".match-streams .match-streams-btn").each((i, element) => {
    if ($(element).attr("href")) {
      matchObj.streams.push({
        name: $(element).text().trim(),
        link: $(element).attr("href") || "",
      });
    } else {
      matchObj.streams.push({
        name: $(element).text().trim(),
        link: $(element).find("a").attr("href") || "",
      });
    }
  });
  matchObj.status = "Upcoming";
  if (
    $(".match-header-vs-score > .match-header-vs-note:first-child")
      .text()
      .trim() == "final"
  ) {
    matchObj.status = "Completed";
  }
  matchObj.teams = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapScore: any[] = [];

  mapScore.push(
    $(".match-header-vs .match-header-vs-score span").first().text().trim()
  );
  mapScore.push(
    $(".match-header-vs .match-header-vs-score span").last().text().trim()
  );

  const teamContainers = $(".match-header-vs .wf-title-med");
  teamContainers.each((i, element) => {
    matchObj.teams.push({
      name: $(element).text().trim(),
      id: idGenerator(
        $(element).parent().parent().attr("href")?.split("/")[2] || ""
      ),
      score: mapScore[i],
    });
  });

  const statsContainer = $(
    ".vm-stats-container .vm-stats-game[data-game-id!='all']"
  );
  $(statsContainer).each((i, element) => {
    const PlayerContainers = $(element).find(".wf-table-inset.mod-overview tr");
    PlayerContainers.each((index, element) => {
      if ($(element).find(".mod-player a div:nth-child(1)").text().trim() == "")
        return;
      const player = new Object() as PlayerMatchStatsElement;
      const extendedStats = new Object() as ExtendedStats;
      const stats = new Object() as Stats;
      player.name = $(element)
        .find(".mod-player a div:nth-child(1)")
        .text()
        .trim();
      player.team = $(element)
        .find(".mod-player a div:nth-child(2)")
        .text()
        .trim();
      player.link = `https://www.vlr.gg${$(element)
        .find(".mod-player a")
        .attr("href")}`;
      const playerStats = $(element).find(".mod-stat");
      playerStats.each((i, element) => {
        const ct = $(element).find(".mod-ct").text().trim();
        const t = $(element).find(".mod-t").text().trim();
        const ot = $(element).find(".mod-ot").text().trim();
        const both = $(element).find(".mod-both").text().trim();
        const data = {
          ct: ct,
          t: t,
          ot: ot,
        };
        switch (i) {
          case 0:
            extendedStats.kdr = data;
            stats.kdr = both;
            break;
          case 1:
            extendedStats.acs = data;
            stats.acs = both;
            break;
          case 2:
            extendedStats.k = data;
            stats.k = both;
            break;
          case 3:
            extendedStats.d = data;
            stats.d = both;
            break;
          case 4:
            extendedStats.a = data;
            stats.a = both;
            break;
          case 5:
            extendedStats.kdb = data;
            stats.kdb = both;
            break;
          case 6:
            extendedStats.kast = data;
            stats.kast = both;
            break;
          case 7:
            extendedStats.adr = data;
            stats.adr = both;
            break;
          case 8:
            extendedStats.hs = data;
            stats.hs = both;
            break;
          case 9:
            extendedStats.fk = data;
            stats.fk = both;
            break;
          case 10:
            extendedStats.fd = data;
            stats.fd = both;
            break;
          case 11:
            extendedStats.fkdb = data;
            stats.fkdb = both;
            break;
          default:
            break;
        }
      });
      player.extendedStats = extendedStats;
      player.stats = stats;
      players.push(player);
    });
  });

  return {
    match: matchObj,
    players: players,
  };
};

export default createMatch;
