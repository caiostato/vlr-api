import axios from "axios";
import { load } from "cheerio";
import { baseUrl } from "@/constants";
import getPlayer from "@/scrapers/player/getPlayer";
import { PlayerStatsAdvanced, PlayerStats, Player, Team } from "@prisma/client";
import {
  GameMatch,
  MatchData,
  PlayerGame,
} from "@/app/api/(cron)/cronGetEventData/_types";
import { cleanName } from "@/utils";

const playersCache = new Map<number, Player>();
const teamsCache = new Map<number, Team>();

interface createMatchProps {
  matchUrl: string;
}

type Response = {
  match: MatchData;
  players: Map<number, Player>;
  teams: Map<number, Team>;
};

const createMatch = async ({
  matchUrl,
}: createMatchProps): Promise<Response> => {
  const { data } = await axios.get(`${baseUrl}${matchUrl}`);
  const $ = load(data);

  const matchObj = {} as MatchData;
  matchObj.externalId = crypto.randomUUID();
  matchObj.vlrId = matchUrl.split("/")[1];
  const date = $(".match-header-date .moment-tz-convert:nth-child(1)")
    .text()
    .trim();
  const time = $(".match-header-date .moment-tz-convert:nth-child(2)")
    .text()
    .trim();
  const cleanedDateStr = date.replace(/(\d+)(st|nd|rd|th)/, "$1");
  matchObj.dateTime = new Date(`${cleanedDateStr} ${time}`);
  matchObj.eventId =
    $(".match-header-super a.match-header-event").attr("href")?.split("/")[2] ||
    "0";
  matchObj.eventName = $(
    ".match-header-super a.match-header-event div > div:nth-child(1)"
  )
    .text()
    .trim();
  matchObj.eventLogo =
    $(".match-header-super a.match-header-event img").attr("src") || "";
  matchObj.eventStage = $(
    ".match-header-super a.match-header-event div > div:nth-child(2)"
  )
    .text()
    .replace(/\s+/g, " ")
    .trim();
  matchObj.logoUrl =
    "https:" +
    ($(".match-header-super a.match-header-event img").attr("src") || "");

  const statusDiv = $(
    ".match-header-vs-score > .match-header-vs-note:first-child"
  )
    .text()
    .trim();

  matchObj.status =
    statusDiv === "final"
      ? "Completed"
      : statusDiv === "live"
      ? "Ongoing"
      : "Upcoming";

  const teams: string[] = [];
  $(".match-header-link").each((i, el) => {
    const href = $(el).attr("href") || "";
    const rawName = $(el).text();
    const logo = $(el).find("img").attr("src") || "";
    const idMatch = href.match(/\/team\/(\d+)\//);
    const teamId = idMatch ? idMatch[1] : "";
    if (teamId) {
      teams.push(teamId);
    }
    teamsCache.set(Number(teamId), {
      externalId: crypto.randomUUID(),
      logo: logo,
      name: cleanName(rawName),
      teamId: teamId,
    });
  });
  matchObj.teams = teams;

  const StatsContainer = $(
    ".vm-stats-container .vm-stats-game[data-game-id!='all']"
  );
  const games: GameMatch[] = [];

  for (let i = 0; i < StatsContainer.length; i++) {
    const element = StatsContainer[i];
    const $element = $(element);
    const team0Score = $element.find(`div.team:first-of-type`);
    const team1Score = $element.find(`div.team:last-of-type`);

    const playersTeam1: PlayerGame[] = [];
    const playersTeam2: PlayerGame[] = [];

    const PlayerContainers = $element.find(".wf-table-inset.mod-overview tr");

    for (let j = 0; j < PlayerContainers.length; j++) {
      const el = PlayerContainers[j];
      const href = $(el).find(".mod-player a").attr("href") || "";
      // /player/2462/keznit'
      const playerId = href.split("/")[2];
      if (!playerId) continue;
      const playerScraped = await getPlayer({
        playerId: playerId,
      });
      const statsElements = $(el).find(".mod-stat");

      const stats = new Object() as PlayerStats;
      const statsAdvanced = new Object() as PlayerStatsAdvanced;

      statsElements.each((index, statEl) => {
        const get = (cls: string) => $(statEl).find(`.${cls}`).text().trim();
        const data = {
          t: get("mod-t"),
          ct: get("mod-ct"),
          both: get("mod-both"),
        };

        switch (index) {
          case 0:
            stats.kdr = data.both;
            statsAdvanced.kdr_t = data.t;
            statsAdvanced.kdr_ct = data.ct;
            break;
          case 1:
            stats.acs = data.both;
            statsAdvanced.acs_t = data.t;
            statsAdvanced.acs_ct = data.ct;
            break;
          case 2:
            stats.k = data.both;
            statsAdvanced.k_t = data.t;
            statsAdvanced.k_ct = data.ct;
            break;
          case 3:
            stats.d = data.both;
            statsAdvanced.d_t = data.t;
            statsAdvanced.d_ct = data.ct;
            break;
          case 4:
            stats.a = data.both;
            statsAdvanced.a_t = data.t;
            statsAdvanced.a_ct = data.ct;
            break;
          case 5:
            stats.kdb = data.both;
            statsAdvanced.kdb_t = data.t;
            statsAdvanced.kdb_ct = data.ct;
            break;
          case 6:
            stats.kast = data.both;
            statsAdvanced.kast_t = data.t;
            statsAdvanced.kast_ct = data.ct;
            break;
          case 7:
            stats.adr = data.both;
            statsAdvanced.adr_t = data.t;
            statsAdvanced.adr_ct = data.ct;
            break;
          case 8:
            stats.hs = data.both;
            statsAdvanced.hs_t = data.t;
            statsAdvanced.hs_ct = data.ct;
            break;
          case 9:
            stats.fk = data.both;
            statsAdvanced.fk_t = data.t;
            statsAdvanced.fk_ct = data.ct;
            break;
          case 10:
            stats.fd = data.both;
            statsAdvanced.fd_t = data.t;
            statsAdvanced.fd_ct = data.ct;
            break;
          case 11:
            stats.fkdb = data.both;
            statsAdvanced.fkdb_t = data.t;
            statsAdvanced.fkdb_ct = data.ct;
            break;
        }
      });
      stats.id = crypto.randomUUID();
      statsAdvanced.id = crypto.randomUUID();
      const playerObj = new Object() as PlayerGame;
      playerObj.vlrId = playerScraped.playerId || "";
      playerObj.externalId = crypto.randomUUID();
      playerObj.linkUrl = playerScraped.link;
      playerObj.teamGameId = "";
      playerObj.stats = stats;
      playerObj.advancedStats = statsAdvanced;

      const idFromHref = parseInt(
        href.match(/\/player\/(\d+)/)?.[1] || "0",
        10
      );
      playersCache.set(idFromHref, {
        externalId: crypto.randomUUID(),
        playerId: Number(playerScraped.playerId),
        name: playerScraped.realName,
        alias: playerScraped.nickName,
        type: playerScraped.type,
        imageUrl: playerScraped.imageUrl,
        teamId: playerScraped.teamId || "",
        currentScore: 0,
        previousScore: 0,
        oldScore: 0,
        acs: 0,
        adr: 0,
        assistsPr: 0,
        deaths: 0,
        fdpr: 0,
        fkpr: 0,
        kast: 0,
        kd: 0,
        kills: 0,
        rating: 0,
      });

      if (j <= 4) playersTeam1.push(playerObj);
      else playersTeam2.push(playerObj);
    }

    const gameExternalId = crypto.randomUUID();

    games.push({
      externalId: gameExternalId,
      teamPicker: "",
      teamWinner: "",
      matchId: "",
      gameOrder: i + 1,
      totalTime: $element.find(".map-duration").text().trim(),
      mapName: $element.find(".map").text().trim().split("\t")[0].trim(),
      teams: [
        {
          externalId: crypto.randomUUID(),
          teamId: matchObj.teams[0],
          trRounds: Number(team0Score.find(".mod-t").text().trim()),
          ctRounds: Number(team0Score.find(".mod-ct").text().trim()),
          totalRounds: Number(team0Score.find(".score").text().trim()),
          playersGame: playersTeam1,
          gameMatchId: gameExternalId,
        },
        {
          externalId: crypto.randomUUID(),
          teamId: matchObj.teams[1],
          trRounds: Number(team1Score.find(".mod-t").text().trim()),
          ctRounds: Number(team1Score.find(".mod-ct").text().trim()),
          totalRounds: Number(team1Score.find(".score").text().trim()),
          playersGame: playersTeam2,
          gameMatchId: gameExternalId,
        },
      ],
    });
  }

  matchObj.games = games;

  return {
    match: matchObj,
    players: playersCache,
    teams: teamsCache,
  };
};

export default createMatch;
