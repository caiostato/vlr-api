import { TeamGame } from "./teamGame";

export type GameMatch = {
  externalId: string;

  totalTime: string;
  teamPicker: string; //externalTeamId
  mapName: string;
  gameOrder: number;
  teamWinner: string; //externalTeamId

  matchId: string; //vlrMatchId
  teams: TeamGame[];
};
