import { baseUrl } from "@/constants";
import { Player, PrismaClient, Team } from "@prisma/client";
import axios from "axios";
import { load } from "cheerio";
import { NextResponse } from "next/server";
import createMatch from "@/factories/matchFactory";
import { MatchData } from "./_types";

let playersCache = new Map<number, Player>();
let teamsCache = new Map<number, Team>();

const prisma = new PrismaClient();
// const teamCache = new Map<number, Match>();
// const playersCache = new Map<number, Player>();

export async function GET() {
  try {
    const matches = await scrapeMatches();
    await saveIntoDatabase(matches);
    return NextResponse.json(matches, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  } finally {
    prisma.$disconnect();
  }
}

async function scrapeMatches() {
  try {
    const { data } = await axios.get(
      `${baseUrl}/event/matches/2347/champions-tour-2025-americas-stage-1`
    );
    const $ = load(data);

    const matchElements = $(".match-item");
    const matches = [];

    for (let i = 0; i < matchElements.length; i++) {
      // const team: GameTeam[] = [];
      // const players: GamePlayer[] = [];
      // const game: Game[] = [];
      // const MapScore = [];
      const el = matchElements[i];
      const matchHref = $(el).attr("href") || "";

      const { match, players, teams } = await createMatch({
        matchUrl: matchHref,
      });
      match.matchOrder = i + 1;

      playersCache = players;
      teamsCache = teams;

      matches.push(match);
    }

    return matches;
  } catch (err) {
    console.log(err);
    return [];
  }
}

async function saveIntoDatabase(matches: MatchData[]) {
  teamsCache.forEach(async (team) => {
    await prisma.team.upsert({
      where: { teamId: team.teamId },
      update: {
        name: team.name,
        logo: team.logo,
      },
      create: {
        externalId: team.externalId,
        teamId: team.teamId,
        name: team.name,
        logo: team.logo,
      },
    });
  });

  playersCache.forEach(async (player) => {
    const externalTeam = teamsCache.get(Number(player.teamId));
    await prisma.player.upsert({
      where: { playerId: Number(player.playerId) },
      update: {
        name: player.name,
        alias: player.alias,
        imageUrl: player.imageUrl,
        type: player.type,
        teamId:
          externalTeam?.externalId != null ? externalTeam?.externalId : "",
      },
      create: {
        externalId: player.externalId,
        name: player.name,
        alias: player.alias,
        imageUrl: player.imageUrl,
        playerId: Number(player.playerId),
        type: player.type,
        teamId:
          externalTeam?.externalId != null ? externalTeam?.externalId : "",
      },
    });
  });

  matches.forEach(async (match) => {
    await prisma.match
      .upsert({
        where: {
          externalId: match.vlrId,
        },
        update: {
          vlrId: match.vlrId,
          dateTime: match.dateTime,
          eventId: match.eventId,
          eventLogo: match.eventLogo,
          eventName: match.eventName,
          eventStage: match.eventStage,
          logoUrl: match.logoUrl,
          matchOrder: match.matchOrder,
          status: match.status,
        },
        create: {
          externalId: match.externalId,
          vlrId: match.vlrId,
          dateTime: match.dateTime,
          eventId: match.eventId,
          eventLogo: match.eventLogo,
          eventName: match.eventName,
          eventStage: match.eventStage,
          logoUrl: match.logoUrl,
          matchOrder: match.matchOrder,
          status: match.status,
        },
      })
      .then(async () => {
        match.games.forEach(async (game) => {
          await prisma.gameMatch
            .upsert({
              where: {
                externalId: game.externalId,
              },
              update: {
                gameOrder: game.gameOrder,
                mapName: game.mapName,
                teamPicker: game.teamPicker,
                teamWinner: game.teamWinner,
                totalTime: game.totalTime,
                matchId: match.externalId,
              },
              create: {
                externalId: game.externalId,
                gameOrder: game.gameOrder,
                mapName: game.mapName,
                teamPicker: game.teamPicker,
                teamWinner: game.teamWinner,
                totalTime: game.totalTime,
                matchId: match.externalId,
              },
            })
            .then(async () => {
              game.teams.forEach(async (team) => {
                await prisma.teamGame
                  .upsert({
                    where: {
                      externalId: team.externalId,
                    },
                    update: {
                      ctRounds: team.ctRounds,
                      trRounds: team.trRounds,
                      vlrTeamId: team.teamId,
                      gameMatchId: game.externalId,
                      totalRounds: team.totalRounds,
                    },
                    create: {
                      externalId: team.externalId,
                      ctRounds: team.ctRounds,
                      trRounds: team.trRounds,
                      vlrTeamId: team.teamId,
                      gameMatchId: game.externalId,
                      totalRounds: team.totalRounds,
                    },
                  })
                  .then(async () => {
                    team.playersGame.forEach(async (playerGame) => {
                      await prisma.playerGame
                        .upsert({
                          where: { externalId: playerGame.externalId },
                          update: {
                            linkUrl: playerGame.externalId,
                            vlrId: playerGame.externalId,
                            teamGameId: team.externalId,
                          },
                          create: {
                            externalId: playerGame.externalId,
                            linkUrl: playerGame.externalId,
                            vlrId: playerGame.externalId,
                            teamGameId: team.externalId,
                          },
                        })
                        .then(async () => {
                          await prisma.playerStats.create({
                            data: {
                              id: crypto.randomUUID(),
                              playerId: playerGame.externalId,
                              a: playerGame.stats.a,
                              acs: playerGame.stats.acs,
                              adr: playerGame.stats.adr,
                              d: playerGame.stats.d,
                              fd: playerGame.stats.fd,
                              fk: playerGame.stats.fk,
                              fkdb: playerGame.stats.fkdb,
                              hs: playerGame.stats.hs,
                              k: playerGame.stats.k,
                              kast: playerGame.stats.kast,
                              kdb: playerGame.stats.kdb,
                              kdr: playerGame.stats.kdr,
                            },
                          });
                          await prisma.playerStatsAdvanced.create({
                            data: {
                              id: crypto.randomUUID(),
                              playerId: playerGame.externalId,
                              kdr_ct: playerGame.advancedStats.kdr_ct,
                              kdr_t: playerGame.advancedStats.kdr_t,

                              acs_ct: playerGame.advancedStats.acs_ct,
                              acs_t: playerGame.advancedStats.acs_t,

                              k_ct: playerGame.advancedStats.k_ct,
                              k_t: playerGame.advancedStats.k_t,

                              d_ct: playerGame.advancedStats.d_ct,
                              d_t: playerGame.advancedStats.d_t,

                              a_ct: playerGame.advancedStats.a_ct,
                              a_t: playerGame.advancedStats.a_t,

                              kdb_ct: playerGame.advancedStats.kdb_ct,
                              kdb_t: playerGame.advancedStats.kdb_t,

                              kast_ct: playerGame.advancedStats.kast_ct,
                              kast_t: playerGame.advancedStats.kast_t,

                              adr_ct: playerGame.advancedStats.adr_ct,
                              adr_t: playerGame.advancedStats.adr_t,

                              hs_ct: playerGame.advancedStats.hs_ct,
                              hs_t: playerGame.advancedStats.hs_t,

                              fk_ct: playerGame.advancedStats.fk_ct,
                              fk_t: playerGame.advancedStats.fk_t,

                              fd_ct: playerGame.advancedStats.fd_ct,
                              fd_t: playerGame.advancedStats.fd_t,

                              fkdb_ct: playerGame.advancedStats.fkdb_ct,
                              fkdb_t: playerGame.advancedStats.fkdb_t,
                            },
                          });
                        });
                    });
                  });
              });
            });
        });
      });
  });

  // matches.forEach(async (match) => {
  //   match.games.forEach(async (game) => {
  //     game.teams.forEach(async (team) => {
  //       await prisma.teamGame
  //         .upsert({
  //           where: {
  //             externalId: team.externalId,
  //           },
  //           update: {
  //             ctRounds: team.ctRounds,
  //             trRounds: team.trRounds,
  //             vlrTeamId: team.teamId,
  //             gameMatchId: team.gameMatchId,
  //             totalRounds: team.totalRounds,
  //           },
  //           create: {
  //             externalId: team.externalId,
  //             ctRounds: team.ctRounds,
  //             trRounds: team.trRounds,
  //             vlrTeamId: team.teamId,
  //             gameMatchId: team.gameMatchId,
  //             totalRounds: team.totalRounds,
  //           },
  //         })
  //         .then(() => {
  //           team.playersGame.forEach(async (playerGame) => {
  //             await prisma.playerGame
  //               .upsert({
  //                 where: { externalId: playerGame.externalId },
  //                 update: {
  //                   linkUrl: playerGame.externalId,
  //                   vlrId: playerGame.externalId,
  //                   teamGameId: team.externalId,
  //                 },
  //                 create: {
  //                   externalId: playerGame.externalId,
  //                   linkUrl: playerGame.externalId,
  //                   vlrId: playerGame.externalId,
  //                   teamGameId: team.externalId,
  //                 },
  //               })
  //               .then(async () => {
  //                 await prisma.playerStats.create({
  //                   data: {
  //                     id: crypto.randomUUID(),
  //                     playerId: playerGame.externalId,
  //                     a: playerGame.stats.a,
  //                     acs: playerGame.stats.acs,
  //                     adr: playerGame.stats.adr,
  //                     d: playerGame.stats.d,
  //                     fd: playerGame.stats.fd,
  //                     fk: playerGame.stats.fk,
  //                     fkdb: playerGame.stats.fkdb,
  //                     hs: playerGame.stats.hs,
  //                     k: playerGame.stats.k,
  //                     kast: playerGame.stats.kast,
  //                     kdb: playerGame.stats.kdb,
  //                     kdr: playerGame.stats.kdr,
  //                   },
  //                 });
  //                 await prisma.playerStatsAdvanced.create({
  //                   data: {
  //                     id: crypto.randomUUID(),
  //                     playerId: playerGame.externalId,
  //                     kdr_ct: playerGame.advancedStats.kdr_ct,
  //                     kdr_t: playerGame.advancedStats.kdr_t,
  //                     kdr_ot: playerGame.advancedStats.kdr_ot,

  //                     acs_ct: playerGame.advancedStats.acs_ct,
  //                     acs_t: playerGame.advancedStats.acs_t,
  //                     acs_ot: playerGame.advancedStats.acs_ot,

  //                     k_ct: playerGame.advancedStats.k_ct,
  //                     k_t: playerGame.advancedStats.k_t,
  //                     k_ot: playerGame.advancedStats.k_ot,

  //                     d_ct: playerGame.advancedStats.d_ct,
  //                     d_t: playerGame.advancedStats.d_t,
  //                     d_ot: playerGame.advancedStats.d_ot,

  //                     a_ct: playerGame.advancedStats.a_ct,
  //                     a_t: playerGame.advancedStats.a_t,
  //                     a_ot: playerGame.advancedStats.a_ot,

  //                     kdb_ct: playerGame.advancedStats.kdb_ct,
  //                     kdb_t: playerGame.advancedStats.kdb_t,
  //                     kdb_ot: playerGame.advancedStats.kdb_ot,

  //                     kast_ct: playerGame.advancedStats.kast_ct,
  //                     kast_t: playerGame.advancedStats.kast_t,
  //                     kast_ot: playerGame.advancedStats.kast_ot,

  //                     adr_ct: playerGame.advancedStats.adr_ct,
  //                     adr_t: playerGame.advancedStats.adr_t,
  //                     adr_ot: playerGame.advancedStats.adr_ot,

  //                     hs_ct: playerGame.advancedStats.hs_ct,
  //                     hs_t: playerGame.advancedStats.hs_t,
  //                     hs_ot: playerGame.advancedStats.hs_ot,

  //                     fk_ct: playerGame.advancedStats.fk_ct,
  //                     fk_t: playerGame.advancedStats.fk_t,
  //                     fk_ot: playerGame.advancedStats.fk_ot,

  //                     fd_ct: playerGame.advancedStats.fd_ct,
  //                     fd_t: playerGame.advancedStats.fd_t,
  //                     fd_ot: playerGame.advancedStats.fd_ot,

  //                     fkdb_ct: playerGame.advancedStats.fkdb_ct,
  //                     fkdb_t: playerGame.advancedStats.fkdb_t,
  //                     fkdb_ot: playerGame.advancedStats.fkdb_ot,
  //                   },
  //                 });
  //               });
  //           });
  //         });
  //     });

  //     await prisma.gameMatch.upsert({
  //       where: {
  //         externalId: game.externalId,
  //       },
  //       update: {
  //         gameOrder: game.gameOrder,
  //         mapName: game.mapName,
  //         teamPicker: game.teamPicker,
  //         teamWinner: game.teamWinner,
  //         totalTime: game.totalTime,
  //         matchId: game.matchId,
  //       },
  //       create: {
  //         externalId: game.externalId,
  //         gameOrder: game.gameOrder,
  //         mapName: game.mapName,
  //         teamPicker: game.teamPicker,
  //         teamWinner: game.teamWinner,
  //         totalTime: game.totalTime,
  //         matchId: game.matchId,
  //       },
  //     });
  //   });

  //   await prisma.match.upsert({
  //     where: {
  //       externalId: match.externalId,
  //     },
  //     update: {
  //       vlrId: match.vlrId,
  //       dateTime: match.dateTime,
  //       eventId: match.eventId,
  //       eventLogo: match.eventLogo,
  //       eventName: match.eventName,
  //       eventStage: match.eventStage,
  //       logoUrl: match.logoUrl,
  //       matchOrder: match.matchOrder,
  //       status: match.status,
  //     },
  //     create: {
  //       externalId: match.externalId,
  //       vlrId: match.vlrId,
  //       dateTime: match.dateTime,
  //       eventId: match.eventId,
  //       eventLogo: match.eventLogo,
  //       eventName: match.eventName,
  //       eventStage: match.eventStage,
  //       logoUrl: match.logoUrl,
  //       matchOrder: match.matchOrder,
  //       status: match.status,
  //     },
  //   });
  // });
}
