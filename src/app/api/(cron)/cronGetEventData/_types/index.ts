export type MatchData = {
  externalId: string;
  vlrId: string;
  matchOrder: number;

  dateTime: Date;
  logoUrl: string;
  status: "Completed" | "Ongoing" | "Upcoming";

  eventId: string;
  eventName: string;
  eventLogo: string;
  eventStage: string;

  teams: string[]; //externalTeamId
  games: GameMatch[];
};

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

export type TeamGame = {
  externalId: string;
  teamId: string;
  totalRounds: number;
  ctRounds: number;
  trRounds: number;

  gameMatchId: string; // GameMatch(externalId)

  playersGame: PlayerGame[];
};

export type PlayerGame = {
  externalId: string;
  vlrId: string;
  linkUrl: string;
  stats: PlayerStats;
  advancedStats: PlayerStatsAdvanced;

  teamGameId: string; // TeamGame (externalId)
};

export type PlayerStats = {
  id: string;
  kdr: string;
  acs: string;
  k: string;
  d: string;
  a: string;
  kdb: string;
  kast: string;
  adr: string;
  hs: string;
  fk: string;
  fd: string;
  fkdb: string;
};

export type PlayerStatsAdvanced = {
  id: string;

  kdr_ct: string;
  kdr_t: string;

  acs_ct: string;
  acs_t: string;

  k_ct: string;
  k_t: string;

  d_ct: string;
  d_t: string;

  a_ct: string;
  a_t: string;

  kdb_ct: string;
  kdb_t: string;

  kast_ct: string;
  kast_t: string;

  adr_ct: string;
  adr_t: string;

  hs_ct: string;
  hs_t: string;

  fk_ct: string;
  fk_t: string;

  fd_ct: string;
  fd_t: string;

  fkdb_ct: string;
  fkdb_t: string;
};
