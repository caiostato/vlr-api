import { UserTeam, PlayerGame } from "@prisma/client";
import { Team } from "./team";

export type Player = {
  externalId: string;
  playerId: string;

  name: string;
  type: string;
  alias: string;
  imageUrl: string;
  country: string;
  earnings: string;

  currentScore: number;
  previousScore: number;
  oldScore: number;

  teamId?: string | null;
  team?: Team | null;

  rating?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  acs?: number;
  adr?: number;
  fd?: number;
  fk?: number;
  hs?: number;
  kast?: number;

  price?: number;

  userTeams?: UserTeam[];

  createdAt?: Date;
  updatedAt?: Date;

  PlayerGame?: PlayerGame[];
};
