import axios from "axios";
import { load } from "cheerio";
import { baseUrl } from "@/constants";
import getPlayer from "@/scrapers/player/getPlayer";
import { cleanName } from "@/utils";
import { Player } from "@/types/player";
import { Team } from "@/types/team";
import { Match } from "@/types/match";
import { GameMatch } from "@/types/gameTeam";
import { PlayerGame } from "@/types/playerTeam";
import { PlayerStatsAdvanced } from "@/types/advancedStats";
import { PlayerStats } from "@/types/playerStats";

const playersCache = new Map<number, Player>();
const teamsCache = new Map<number, Team>();

interface createMatchProps {
  matchUrl: string;
}

type Response = {
  match: Match;
  players: Map<number, Player>;
  teams: Map<number, Team>;
};

const createMatch = async ({
  matchUrl,
}: createMatchProps): Promise<Response> => {
  //match loop
  const { data } = await axios.get(`${baseUrl}${matchUrl}`);
  const $ = load(data);

  const matchObj = {} as Match;
  matchObj.externalId = crypto.randomUUID();
  matchObj.vlrId = matchUrl.split("/")[1];
  const date = $(".match-header-date .moment-tz-convert:nth-child(1)")
    .text()
    .trim();
  const time = $(".match-header-date .moment-tz-convert:nth-child(2)")
    .text()
    .trim();
  const cleanedDateStr = date.replace(/(\d+)(st|nd|rd|th)/, "$1");
  const currentYear = new Date().getFullYear();
  const cleanDate = new Date(`${cleanedDateStr} ${time}`);
  cleanDate.setFullYear(currentYear);
  matchObj.dateTime = cleanDate;
  matchObj.eventId =
    $(".match-header-super a.match-header-event").attr("href")?.split("/")[2] ||
    "0";
  matchObj.eventName = $(
    ".match-header-super a.match-header-event div > div:nth-child(1)"
  )
    .text()
    .trim();
  matchObj.eventLogo = `https:${
    $(".match-header-super a.match-header-event img").attr("src") || ""
  }`;
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
  //team loop
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
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  matchObj.teams = teams;

  const StatsContainer = $(
    ".vm-stats-container .vm-stats-game[data-game-id!='all']"
  );
  const games: GameMatch[] = [];
  const scores: number[] = [0, 0];

  //game loop
  for (let i = 0; i < StatsContainer.length; i++) {
    try {
      const element = StatsContainer[i];
      const $element = $(element);
      const team0Score = $element.find(`div.team:first-of-type`);
      const team1Score = $element.find(`div.team:last-of-type`);
      if ($element.find(".map-duration").text().trim() != "") {
        const playersTeam1: PlayerGame[] = [];
        const playersTeam2: PlayerGame[] = [];

        const PlayerContainers = $element.find(
          ".wf-table-inset.mod-overview tr"
        );

        //player stats loop
        for (let j = 0; j < PlayerContainers.length; j++) {
          const el = PlayerContainers[j];
          const href = $(el).find(".mod-player a").attr("href") || "";
          const playerId = href.split("/")[2];
          if (!playerId) continue;
          const playerScraped = await getPlayer({
            playerId: playerId,
          });

          const agent = $(el).find(".mod-agent img").attr("alt") || "";
          const statsElements = $(el).find(".mod-stat");

          const playerObj = new Object() as PlayerGame;

          if (playerScraped.type === "player") {
            const stats = new Object() as PlayerStats;
            const statsAdvanced = new Object() as PlayerStatsAdvanced;
            statsElements.each((index, statEl) => {
              const get = (cls: string) =>
                $(statEl).find(`.${cls}`).text().trim();
              const data = {
                t: get("mod-t"),
                ct: get("mod-ct"),
                both: get("mod-both"),
              };

              switch (index) {
                case 0:
                  stats.rating = data.both;
                  statsAdvanced.rating_t = data.t;
                  statsAdvanced.rating_ct = data.ct;
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

            playerObj.agent = agent;
            stats.id = crypto.randomUUID();
            statsAdvanced.id = crypto.randomUUID();
            playerObj.stats = stats;
            playerObj.advancedStats = statsAdvanced;
          }

          playerObj.alias = playerScraped.alias;
          playerObj.imageUrl = playerScraped.imageUrl;
          playerObj.externalId = crypto.randomUUID();
          playerObj.teamGameId = "";

          const idFromHref = parseInt(
            href.match(/\/player\/(\d+)/)?.[1] || "0",
            10
          );
          playerObj.playerId = idFromHref.toString();

          playersCache.set(idFromHref, {
            externalId: crypto.randomUUID(),
            playerId: playerScraped.playerId,
            name: playerScraped.name,
            alias: playerScraped.alias,
            type: playerScraped.type,
            imageUrl: playerScraped.imageUrl,
            country: playerScraped.country,
            earnings: playerScraped.earnings,
            teamId: playerScraped.teamId || "",
            currentScore: 0,
            previousScore: 0,
            oldScore: 0,
            acs: 0,
            adr: 0,
            assists: 0,
            deaths: 0,
            kast: 0,
            fk: 0,
            fd: 0,
            hs: 0,
            price: 0,
            kills: 0,
            rating: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          if (j <= 5) playersTeam1.push(playerObj);
          else playersTeam2.push(playerObj);
        }

        const gameExternalId = crypto.randomUUID();
        const team1Id = crypto.randomUUID();
        const team2Id = crypto.randomUUID();
        const teamWinner =
          Number(team0Score.find(".score").text().trim()) >
          Number(team1Score.find(".score").text().trim())
            ? matchObj.teams[0]
            : matchObj.teams[1];

        if (teamWinner === matchObj.teams[0]) {
          scores[0] += 1;
        } else {
          scores[1] += 1;
        }

        const teamPicker =
          $element.find(".map").find(".mod-1").length === 1
            ? teams[0]
            : teams[1];

        matchObj.score = scores;

        games.push({
          externalId: gameExternalId,
          teamPicker: teamPicker,
          teamWinner: teamWinner,
          matchId: "",
          gameOrder: i + 1,
          totalTime: $element.find(".map-duration").text().trim(),
          mapName: $element.find(".map").text().trim().split("\t")[0].trim(),
          teams: [
            {
              externalId: team1Id,
              teamId: matchObj.teams[0],
              trRounds: Number(team0Score.find(".mod-t").text().trim()),
              ctRounds: Number(team0Score.find(".mod-ct").text().trim()),
              totalRounds: Number(team0Score.find(".score").text().trim()),
              playersGame: playersTeam1,
              gameMatchId: gameExternalId,
            },
            {
              externalId: team2Id,
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
    } catch (err) {
      console.log(err);
    }
  }

  matchObj.games = games;

  return {
    match: matchObj,
    players: playersCache,
    teams: teamsCache,
  };
};

export default createMatch;
