import GameTeam from "./gameTeam";
import MatchStatus from "./matchStatus";
import StreamObject from "./streamObject";

type Match = {
  id: string;
  link: string;
  date: string;
  time: string;
  eventId: string;
  eventName: string;
  logo: string;
  streams: StreamObject[];
  status: MatchStatus;
  teams: GameTeam[];
};

export default Match;
