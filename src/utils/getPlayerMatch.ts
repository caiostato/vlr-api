import createMatch from "@/factories/matchFactory";
import Match from "@/types/match";
import PlayerStats from "@/types/playerStats";
import { load } from "cheerio";

interface getPlayerMatchProps {
  matchId: string;
  playerName: string;
}

type getPlayerMatchResponse = {
  match: Match;
  player: PlayerStats;
};

const getPlayerMatch = async ({
  matchId,
  playerName,
}: getPlayerMatchProps): Promise<getPlayerMatchResponse> => {
  const response = await fetch(`https://www.vlr.gg/${matchId}`);
  const html = await response.text();
  const $ = load(html);

  const match = createMatch({
    matchData: $,
    matchId: matchId,
    playerName: playerName,
  });

  return match;
};

export default getPlayerMatch;
