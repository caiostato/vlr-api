import { Player } from "./player";

export interface Team {
  externalId: string;
  name: string;
  logo: string;
  teamId: string;

  players?: Player[];

  createdAt?: Date;
  updatedAt?: Date;
}
