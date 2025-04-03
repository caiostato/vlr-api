import Match from "@/types/match";
import PlayerStats from "@/types/playerStats";

type match = {
  match: Match;
  player: PlayerStats;
};

type PlayerComparison = {
  playerId: string;
  playerName: string;
  playerTeam: string;
  playerLink: string;
  firstMatch: match;
  secondMatch: match;
};

export default PlayerComparison;
