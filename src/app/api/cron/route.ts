import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { load } from "cheerio";
import { NextResponse } from "next/server";

const baseUrl = "https://www.vlr.gg";
const prisma = new PrismaClient();
const teamCache = new Map<number, Team>();
const playersCache = new Map<number, Player>();

interface Player {
  name: string;
  alias: string;
  imageUrl: string;

  id: number;
  playerId?: number;
  type: string;
  role: string;
  teamId?: string;
}

interface Team {
  name: string;
  id: number;
  players: Player[];
  logo: string;
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
    return NextResponse.json({ success: true });
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

async function getPlayersFromTeam(
  teamId: number
): Promise<{ players: Player[]; logo: string }> {
  try {
    const url = `${baseUrl}/team/${teamId}`;
    const { data } = await axios.get(url);
    const $ = load(data);

    const players: Player[] = [];
    const logo = `https:${$(".team-header img").attr("src")}`;

    $('a[href^="/player/"]').each((_, el) => {
      const href = $(el).attr("href");
      const idMatch = href?.match(/\/player\/(\d+)\//);

      const item = $(el).find(".team-roster-item-name");

      const name = !!item.find(".team-roster-item-name-real")
        ? cleanName(item.find(".team-roster-item-name-real").text())
        : "";
      const alias = !!item.find(".team-roster-item-name-alias")
        ? cleanName(item.find(".team-roster-item-name-alias").text())
        : "";
      const imageUrl = $(el).find("img").attr("src") || "";

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
        const id = parseInt(idMatch[1], 10);
        const playerObj = {
          name,
          alias,
          imageUrl,
          id,
          type,
          role: category,
          teamId: teamId.toString(),
        };

        playersCache.set(id, playerObj);
        players.push(playerObj);
      }
    });

    return { players, logo };
  } catch (error) {
    console.error(
      `❌ Failed to get players for team ${teamId}:`,
      (error as Error).message
    );
    return { players: [], logo: "" };
  }
}

async function getTeamWithPlayers(name: string, id: number): Promise<Team> {
  if (teamCache.has(id)) {
    return teamCache.get(id)!;
  }

  const cleanedName = cleanName(name);
  const { players, logo } = await getPlayersFromTeam(id);
  const team = { name: cleanedName, id, players, logo: logo };

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
  const allTeams = matches.flatMap((match) => match.teams);

  const uniqueTeams = Array.from(
    new Map(allTeams.map((team) => [team.id, team])).values()
  );

  // Map from original `team.id` to generated `externalId`
  const teamIdToExternalId = new Map<number, string>();

  const teamsData = uniqueTeams.map((team) => {
    const externalId = crypto.randomUUID();
    teamIdToExternalId.set(team.id, externalId);

    return {
      externalId,
      teamId: team.id,
      name: team.name,
      logo: team.logo,
    };
  });

  // Create all teams
  for (const team of teamsData) {
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
  }

  // Now create players, referencing the correct externalId
  for (const player of playersCache.values()) {
    const externalTeamId = teamIdToExternalId.get(Number(player.teamId));
    if (!externalTeamId) {
      console.warn(
        `⚠️ Skipping player ${player.alias} — no team match for teamId ${player.teamId}`
      );
      continue;
    }

    await prisma.player.upsert({
      where: { playerId: player.id },
      update: {
        alias: player.alias,
        name: player.name,
        imageUrl: player.imageUrl,
        role: player.role,
        type: player.type,
        teamId: externalTeamId, // ✅ now correct
      },
      create: {
        externalId: crypto.randomUUID(),
        alias: player.alias,
        name: player.name,
        imageUrl: player.imageUrl,
        playerId: player.id,
        role: player.role,
        type: player.type,
        teamId: externalTeamId, // ✅ now correct
        currentScore: 0,
        oldScore: 0,
        previousScore: 0,
      },
    });
  }

  for (const match of matches) {
    const teamConnections = match.teams.map((team) => {
      const matchedTeam = teamsData.find((t) => t.teamId === team.id);
      if (!matchedTeam) throw new Error(`Team with ID ${team.id} not found`);
      return { externalId: matchedTeam.externalId };
    });

    await prisma.match.upsert({
      where: { matchId: match.matchId },
      update: { status: match.status || "unknown" },
      create: {
        externalId: crypto.randomUUID(),
        matchId: match.matchId,
        match: match.matchId,
        status: match.status || "unknown",
        teams: {
          connect: teamConnections,
        },
      },
    });
  }
}
