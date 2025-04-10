import { PlayerGame, PlayerStats, PlayerStatsAdvanced } from "@prisma/client";
import MatchStatus from "./matchStatus";
import StreamObject from "./streamObject";

type Match = {
  id: string;
  link: string;
  date: string;
  time: string;
  eventId: string;
  eventName: string;
  eventLogo: string;
  eventStage: string;
  logo: string;
  streams: StreamObject[];
  status: MatchStatus;
  teams: { teamId: string; logo: string; name: string }[];
  games: {
    gameOrder: number;
    totalTime: string;
    mapName: string;
    teams: {
      teamId: string;
      totalRounds: number;
      ctRounds: number;
      trRounds: number;
      players: PlayerGame & { stats: PlayerStats } & {
          statsAdvanced: PlayerStatsAdvanced;
        }[];
    }[];
  }[];
};

export default Match;
