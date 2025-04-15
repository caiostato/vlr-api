import Stats from "@/types/stats";
import { agentToRole, mod, roleEnum } from "@/utils/agents";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { load } from "cheerio";
import { NextResponse } from "next/server";

const trackableEvents: string[] = [];

const date = new Date();
trackableEvents.push((date.getFullYear() - 1).toString());

const prisma = new PrismaClient();

export const GET = async () => {
  const players = await prisma.player.findMany({});
  // players = players.filter((player) => player.playerId === 2408);

  //tuyz 2408
  // aspas 8480
  const searchedPlayers = [];

  for (const player of players) {
    const availableMatches = await searchPlayerMatches(player.playerId);
    const allStats: Stats[] = [];
    const allStatsPerRole: Stats[] = [];

    for (const match of availableMatches) {
      const { stats: stats, statsToRole } = await getPlayerStatsById(
        `${match}`,
        player.playerId
      );
      allStats.push(stats);
      allStatsPerRole.push(statsToRole);
    }
    const computedPlayerAverage = computeAverage(allStats);
    const computedPlayerScoreAverage = computeAverage(allStatsPerRole);

    const score = Object.values(computedPlayerScoreAverage).reduce(
      (sum, value) => sum + value,
      0
    );

    searchedPlayers.push({
      player: player.playerId,
      score: score.toFixed(2),
      stats: computedPlayerAverage,
    });
  }

  for (const player of searchedPlayers) {
    await prisma.player.update({
      where: {
        playerId: player.player,
      },
      data: {
        oldScore: parseFloat(player.score),
        currentScore: parseFloat(player.score),
        previousScore: parseFloat(player.score),
      },
    });
  }

  return NextResponse.json(searchedPlayers, { status: 200 });
};

const searchPlayerMatches = async (playerId: string) => {
  const { data } = await axios.get(
    `https://www.vlr.gg/player/matches/${playerId}`
  );
  const $ = load(data);

  const matches: string[] = [];

  $("a.m-item").each((_, el) => {
    const matchPath = $(el).attr("href");
    if (matchPath) {
      const fullUrl = `https://www.vlr.gg${matchPath}`;
      if (trackableEvents.every((ev) => fullUrl.includes(ev))) {
        matches.push(fullUrl);
      }
    }
  });

  return matches;
};

const getPlayerStatsById = async (matchUrl: string, playerId: string) => {
  const { data } = await axios.get(matchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });
  const stats = new Object() as Stats;
  const statsToRole = new Object() as Stats;
  const agentsUsed: string[] = [];

  const $ = load(data);

  const statsContainer = $(
    ".vm-stats-container .vm-stats-game[data-game-id='all']"
  );

  for (const element of statsContainer) {
    const $element = $(element);
    const playerContainers = $element.find(".wf-table-inset.mod-overview tr");
    for (const player of playerContainers) {
      const playerInfoEl = $(player).find(".mod-player").find("a").attr("href");
      if (playerInfoEl?.includes(`${playerId}`)) {
        const statsElements = $(player).find(".mod-stat");
        const playerAgentEl = $(player)
          .find(".mod-agents")
          .find("img")
          .attr("alt");

        agentsUsed.push(playerAgentEl || "");

        const roleMatch: roleEnum = agentToRole[
          "raze"
        ].toLowerCase() as roleEnum;

        const roleModifiers = mod[roleMatch];

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

              statsToRole.kdr = (
                parseFloat(data.both.replace("%", "").replace("+", "")) *
                roleModifiers.kdr
              ).toString();
              break;
            case 1:
              stats.acs = data.both;

              statsToRole.acs = (
                parseFloat(data.both.replace("%", "").replace("+", "")) *
                roleModifiers.acs
              ).toString();
              break;
            case 2:
              stats.k = data.both;

              statsToRole.k = (
                parseFloat(data.both.replace("%", "").replace("+", "")) *
                roleModifiers.k
              ).toString();
              break;
            case 3:
              stats.d = data.both;

              statsToRole.d = (
                parseFloat(data.both.replace("%", "").replace("+", "")) *
                roleModifiers.d
              ).toString();
              break;
            case 4:
              stats.a = data.both;

              statsToRole.a = (
                parseFloat(data.both.replace("%", "").replace("+", "")) *
                roleModifiers.a
              ).toString();
              break;
            case 5:
              stats.kdb = data.both;

              statsToRole.kdb = (
                parseFloat(data.both.replace("%", "").replace("+", "")) *
                roleModifiers.kdb
              ).toString();
              break;
            case 6:
              stats.kast = data.both;

              statsToRole.kast = (
                parseFloat(data.both.replace("%", "").replace("+", "")) *
                roleModifiers.kast
              ).toString();
              break;
            case 7:
              stats.adr = data.both;

              statsToRole.adr = (
                parseFloat(data.both.replace("%", "").replace("+", "")) *
                roleModifiers.adr
              ).toString();
              break;
            case 8:
              stats.hs = data.both;

              statsToRole.hs = (
                parseFloat(data.both.replace("%", "").replace("+", "")) *
                roleModifiers.hs
              ).toString();
              break;
            case 9:
              stats.fk = data.both;

              statsToRole.fk = (
                parseFloat(data.both.replace("%", "").replace("+", "")) *
                roleModifiers.fk
              ).toString();
              break;
            case 10:
              stats.fd = data.both;

              statsToRole.fd = (
                parseFloat(data.both.replace("%", "").replace("+", "")) *
                roleModifiers.fd
              ).toString();
              break;
            case 11:
              stats.fkdb = data.both;

              statsToRole.fkdb = (
                parseFloat(data.both.replace("%", "").replace("+", "")) *
                roleModifiers.fkdb
              ).toString();
              break;
          }
        });
      }
    }
  }

  return { stats: stats, statsToRole: statsToRole };
};

function computeAverage(statsArray: Stats[]) {
  const total: Record<string, number> = {};
  const count = statsArray.length;

  for (const stats of statsArray) {
    for (const key in stats) {
      const rawValue = stats[key as keyof Stats];
      const cleanValue = parseFloat(rawValue.replace("%", "").replace("+", ""));

      if (!isNaN(cleanValue)) {
        total[key] = (total[key] || 0) + cleanValue;
      }
    }
  }

  const media: Record<string, number> = {};
  for (const key in total) {
    media[key] = parseFloat((total[key] / count).toFixed(2));
  }

  return media;
}
