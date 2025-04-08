import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { load } from "cheerio";
import { NextResponse } from "next/server";

type AgentStats = {
  agent: string;
  use: string;
  rounds: string;
  rating: string;
  acs: string;
  kd: string;
  adr: string;
  kast: string;
  kpr: string;
  apr: string;
  fkpr: string;
  fdpr: string;
  kills: string;
  deaths: string;
  assists: string;
  fk: string;
  fd: string;
};

const prisma = new PrismaClient();
export async function GET() {
  try {
    const players = await prisma.player.findMany({});

    for (let i = 0; i < players.length; i++) {
      if (players[i].type === "player") {
        const playerScore = await getPlayerScore(
          players[i].playerId.toString()
        );
        try {
          await prisma.player.update({
            where: { externalId: `${players[i].externalId}` },
            data: {
              kd: playerScore.kd || 0,
              acs: playerScore.acs || 0,
              adr: playerScore.adr || 0,
              rating: playerScore.rating || 0,
              kast: playerScore.kast || 0,
              kills: playerScore.kills || 0,
              deaths: playerScore.deaths || 0,
              fkpr: playerScore.fkpr || 0,
              fdpr: playerScore.fdpr || 0,
              assistsPr: playerScore.assistsPr || 0,
            },
          });
        } catch (err) {
          console.error("Error updating player", players[i].externalId, err);
        }
      }
    }

    return NextResponse.json({ status: 201 });
  } catch (err) {
    return NextResponse.json(err, { status: 400 });
  } finally {
    await prisma.$disconnect();
  }
}

async function getPlayerScore(playerId: string) {
  const { data } = await axios.get(`https://vlr.gg/player/${playerId}`);
  const $ = load(data);

  const agentStats: AgentStats[] = [];

  $("table.wf-table tbody tr").each((_, row) => {
    const columns = $(row).find("td");

    const agent = $(columns[0]).find("img").attr("alt")?.trim() ?? "unknown";
    const use = $(columns[1]).text().trim();
    const rounds = $(columns[2]).text().trim();
    const rating = $(columns[3]).text().trim();
    const acs = $(columns[4]).text().trim();
    const kd = $(columns[5]).text().trim();
    const adr = $(columns[6]).text().trim();
    const kast = $(columns[7]).text().trim();
    const kpr = $(columns[8]).text().trim();
    const apr = $(columns[9]).text().trim();
    const fkpr = $(columns[10]).text().trim();
    const fdpr = $(columns[11]).text().trim();
    const kills = $(columns[12]).text().trim();
    const deaths = $(columns[13]).text().trim();
    const assists = $(columns[14]).text().trim();
    const fk = $(columns[15]).text().trim();
    const fd = $(columns[16]).text().trim();

    agentStats.push({
      agent,
      use,
      rounds,
      rating,
      acs,
      kd,
      adr,
      kast,
      kpr,
      apr,
      fkpr,
      fdpr,
      kills,
      deaths,
      assists,
      fk,
      fd,
    });
  });

  const averageScore = await computePlayerAverages(agentStats);

  return averageScore;
}

function computePlayerAverages(stats: AgentStats[]) {
  const totalRounds = stats.reduce(
    (sum, agent) => sum + parseInt(agent.rounds),
    0
  );

  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;

  let weightedACS = 0;
  let weightedADR = 0;
  let weightedRating = 0;
  let weightedKAST = 0;
  let weightedFkPr = 0;
  let weightedFdPr = 0;

  stats.forEach((agent) => {
    const rounds = parseInt(agent.rounds);
    const weight = rounds / totalRounds;

    totalKills += parseInt(agent.kills);
    totalDeaths += parseInt(agent.deaths);
    totalAssists += parseInt(agent.assists);
    weightedFkPr += parseInt(agent.fk);
    weightedFdPr += parseInt(agent.fd);

    weightedACS += parseFloat(agent.acs) * weight;
    weightedADR += parseFloat(agent.adr) * weight;
    weightedRating += parseFloat(agent.rating) * weight;
    weightedKAST += parseFloat(agent.kast) * weight;
  });

  const kd = totalDeaths === 0 ? totalKills : totalKills / totalDeaths;

  return {
    kd: parseFloat(kd.toFixed(2)),
    acs: parseFloat(weightedACS.toFixed(1)),
    adr: parseFloat(weightedADR.toFixed(1)),
    rating: parseFloat(weightedRating.toFixed(2)),
    kast: parseFloat(weightedKAST.toFixed(2)),
    kills: totalKills,
    deaths: totalDeaths,
    fkpr: weightedFkPr / totalRounds,
    fdpr: weightedFdPr / totalRounds,
    assistsPr: totalAssists / totalRounds,
  };
}

// function getPrimaryRole(agentStats: AgentStats[]) {
//   const mostUsed = agentStats.reduce(
//     (max, agent) => {
//       const match = agent.use.match(/\((\d+)\)/);
//       const uses = match ? parseInt(match[1]) : 0;
//       return uses > max.uses ? { agent: agent.agent, uses } : max;
//     },
//     { agent: "jett", uses: 0 }
//   );

//   return agentToRole[mostUsed.agent];
// }
