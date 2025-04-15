import { GameMatch } from "./gameTeam";
import MatchStatus from "./matchStatus";
export type Match = {
  externalId: string;
  vlrId: string;
  matchOrder: number;

  dateTime: Date;
  logoUrl: string;
  status: MatchStatus;

  eventId: string;
  eventName: string;
  eventLogo: string;
  eventStage: string;
  score: number[];

  teams: string[]; //externalTeamId
  games: GameMatch[];
};
