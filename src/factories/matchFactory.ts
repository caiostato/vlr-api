import ExtendedStats from "@/types/advancedStats";
import Match from "@/types/match";
import PlayerStats from "@/types/playerStats";
import Stats from "@/types/stats";
import { idGenerator } from "@/utils";
import { CheerioAPI } from "cheerio";

interface CreateMatchProps {
  matchData: CheerioAPI;
  matchId: string;
  playerName: string;
}

type createMatchResponse = {
  match: Match;
  player: PlayerStats;
};

const createMatch = ({
  matchData,
  matchId,
  playerName,
}: CreateMatchProps): createMatchResponse => {
  const matchObj = new Object() as Match;
  const playerObj = new Object() as PlayerStats;
  const extendedStats = new Object() as ExtendedStats;
  const stats = new Object() as Stats;
  matchObj.id = matchId;
  matchObj.date = matchData(
    ".match-header-date .moment-tz-convert:nth-child(1)"
  )
    .text()
    .trim();
  matchObj.time = matchData(
    ".match-header-date .moment-tz-convert:nth-child(2)"
  )
    .text()
    .trim();
  matchObj.eventId =
    matchData(".match-header-super a.match-header-event")
      .attr("href")
      ?.split("/")[2] || "0";
  matchObj.eventName = matchData(
    ".match-header-super a.match-header-event div > div:nth-child(1)"
  )
    .text()
    .trim();
  matchObj.logo =
    "https:" +
      matchData(".match-header-super a.match-header-event img").attr("src") ||
    "";

  matchObj.streams = [];
  matchData(".match-streams .match-streams-btn").each((i, element) => {
    if (matchData(element).attr("href")) {
      matchObj.streams.push({
        name: matchData(element).text().trim(),
        link: matchData(element).attr("href") || "",
      });
    } else {
      matchObj.streams.push({
        name: matchData(element).text().trim(),
        link: matchData(element).find("a").attr("href") || "",
      });
    }
  });
  matchObj.status = "Upcoming";
  if (
    matchData(".match-header-vs-score > .match-header-vs-note:first-child")
      .text()
      .trim() == "final"
  ) {
    matchObj.status = "Completed";
  }
  matchObj.teams = [];
  const mapScore: any[] = [];

  mapScore.push(
    matchData(".match-header-vs .match-header-vs-score span")
      .first()
      .text()
      .trim()
  );
  mapScore.push(
    matchData(".match-header-vs .match-header-vs-score span")
      .last()
      .text()
      .trim()
  );

  const teamContainers = matchData(".match-header-vs .wf-title-med");
  teamContainers.each((i, element) => {
    matchObj.teams.push({
      name: matchData(element).text().trim(),
      id: idGenerator(
        matchData(element).parent().parent().attr("href")?.split("/")[2] || ""
      ),
      score: mapScore[i],
    });
  });

  const statsContainer = matchData(
    ".vm-stats-container .vm-stats-game[data-game-id!='all']"
  );
  matchData(statsContainer).each((i, element) => {
    if (i == 0) {
      const playerContainers = matchData(element).find(
        ".wf-table-inset.mod-overview tr"
      );
      const filteredPlayerContainers = playerContainers.filter(
        (index, element) =>
          matchData(element)
            .find(".mod-player a div:nth-child(1)")
            .text()
            .trim() == playerName
      )[0];
      const playerStats = matchData(filteredPlayerContainers).find(".mod-stat");
      // playerObj.stats = new Object() as Stats;
      // playerObj.extendedStats = new Object() as ExtendedStats;

      playerStats.each((i, element) => {
        const ct = matchData(element).find(".mod-ct").text().trim();
        const t = matchData(element).find(".mod-t").text().trim();
        const ot = matchData(element).find(".mod-ot").text().trim();
        const both = matchData(element).find(".mod-both").text().trim();

        const data = {
          ct: ct,
          t: t,
          ot: ot,
        };
        // console.log(data);
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
    }
  });

  playerObj.extendedStats = extendedStats;
  playerObj.stats = stats;
  return {
    match: matchObj,
    player: playerObj,
  };
};

export default createMatch;
