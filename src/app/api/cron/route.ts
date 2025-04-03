import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { load } from "cheerio";
import { NextResponse } from "next/server";

const baseUrl = "https://www.vlr.gg";
const prisma = new PrismaClient();
const teamCache = new Map<number, Team>();

interface Player {
  name: string;
  nick: string;
  id: number;
  type: string;
  role: string;
}

interface Team {
  name: string;
  id: number;
  players: Player[];
}

interface Match {
  match: number;
  matchId: number;
  teams: Team[];
  status: string;
}

export async function GET() {
  try {
    const matches = await scrapeMatches();
    await saveMatchesToDB(matches);
    return NextResponse.json({ success: true, matches });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}

function cleanName(raw: string): string {
  return raw
    .replace(/\[[0-9]+\]/g, "") // Remove [ID]
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

async function getPlayersFromTeam(teamId: number): Promise<Player[]> {
  try {
    const url = `${baseUrl}/team/${teamId}`;
    const { data } = await axios.get(url);
    const $ = load(data);

    const players: Player[] = [];

    $('a[href^="/player/"]').each((_, el) => {
      const href = $(el).attr("href");
      const idMatch = href?.match(/\/player\/(\d+)\//);

      const item = $(el).find(".team-roster-item-name");

      const name = !!item.find(".team-roster-item-name-real")
        ? cleanName(item.find(".team-roster-item-name-real").text())
        : "";
      const nick = !!item.find(".team-roster-item-name-alias")
        ? cleanName(item.find(".team-roster-item-name-alias").text())
        : "";

      const tagDiv = item.find(".wf-tag");

      let category = "";
      if (!!tagDiv) {
        const role = cleanName(tagDiv.text());
        if (!role.toLocaleLowerCase().includes("sub")) {
          category = role;
        }
      }

      const type = category === "" ? "player" : "staff";

      if (idMatch) {
        players.push({
          name,
          nick,
          id: parseInt(idMatch[1], 10),
          type,
          role: category,
        });
      }
    });

    return players;
  } catch (error) {
    console.error(
      `❌ Failed to get players for team ${teamId}:`,
      (error as Error).message
    );
    return [];
  }
}

async function getTeamWithPlayers(name: string, id: number): Promise<Team> {
  if (teamCache.has(id)) {
    return teamCache.get(id)!;
  }

  const cleanedName = cleanName(name);
  const players = await getPlayersFromTeam(id);
  const team = { name: cleanedName, id, players };

  teamCache.set(id, team);
  return team;
}

async function getTeamsFromMatch(matchUrl: string): Promise<Team[]> {
  try {
    const { data } = await axios.get(baseUrl + matchUrl);
    const $ = load(data);

    const teams: Team[] = [];

    const teamElements = $(".match-header-link-name");

    for (let i = 0; i < teamElements.length; i++) {
      const el = teamElements[i];
      const rawName = $(el).text();
      const href = $(el).parent().attr("href");
      const idMatch = href?.match(/\/team\/(\d+)\//);
      const teamId = idMatch ? parseInt(idMatch[1], 10) : null;

      if (rawName && teamId) {
        const team = await getTeamWithPlayers(rawName, teamId);
        teams.push(team);
      }
    }

    return teams;
  } catch (error) {
    console.error(
      `❌ Failed to get teams from match:`,
      (error as Error).message
    );
    return [];
  }
}

async function scrapeMatches(): Promise<Match[]> {
  try {
    const { data } = await axios.get(
      `${baseUrl}/event/matches/2347/champions-tour-2025-americas-stage-1`
    );
    const $ = load(data);

    const matchElements = $(".match-item");
    const matches: Match[] = [];

    let matchCounter = 0;

    for (let i = 0; i < matchElements.length; i++) {
      const el = matchElements[i];
      const matchHref = $(el).attr("href");
      const matchIdMatch = matchHref?.match(/^\/(\d+)\//);
      const matchId = matchIdMatch ? parseInt(matchIdMatch[1], 10) : null;
      const status = $(el).find(".ml-status").text().trim().toLowerCase();

      if (matchHref && matchId) {
        const teams = await getTeamsFromMatch(matchHref);
        if (teams.length === 2) {
          matches.push({
            match: ++matchCounter,
            matchId,
            teams,
            status,
          });
        }
      }
    }

    return matches;
  } catch (error) {
    console.error("❌ Error scraping matches:", (error as Error).message);
    return [];
  }
}

async function saveMatchesToDB(matches: Match[]) {
  for (const match of matches) {
    await prisma.match.upsert({
      where: { matchId: match.matchId },
      update: { status: match.status },
      create: {
        match: match.match,
        matchId: match.matchId,
        status: match.status,
        teams: {
          create: match.teams.map((team) => ({
            id: team.id,
            name: team.name,
            players: {
              create: team.players.map((player) => ({
                id: player.id,
                name: player.name,
                nick: player.nick,
                type: player.type,
                role: player.role,
              })),
            },
          })),
        },
      },
    });
  }
}
