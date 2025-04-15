import { PlayerGame } from "./playerTeam";

export type TeamGame = {
  externalId: string;
  teamId: string;
  totalRounds: number;
  ctRounds: number;
  trRounds: number;

  gameMatchId: string; // GameMatch(externalId)

  playersGame: PlayerGame[];
};
