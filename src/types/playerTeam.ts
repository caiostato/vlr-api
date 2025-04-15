import { PlayerStatsAdvanced } from "./advancedStats";
import { PlayerStats } from "./playerStats";

export type PlayerGame = {
  agent: string;
  externalId: string;
  alias: string;
  imageUrl: string;
  playerId: string;
  stats: PlayerStats;
  advancedStats: PlayerStatsAdvanced;

  teamGameId: string; // TeamGame (externalId)
};
