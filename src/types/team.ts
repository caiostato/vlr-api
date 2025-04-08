import Player from "./player";

interface Team {
  name: string;
  id: number;
  players: Player[];
  logo: string;
}

export default Team;
