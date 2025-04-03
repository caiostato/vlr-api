import PlayerTeam from "./playerTeam";

type Player = {
  id: string;
  nickName: string;
  realName: string;
  link: string;
  imgUrl: string;
  country: string;
  team: PlayerTeam;
  role: string;
  earnings: string;
};

export default Player;
