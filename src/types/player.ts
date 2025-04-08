type Player = {
  playerId?: string;
  nickName: string;
  realName: string;
  link: string;

  country: string;

  role: string;
  type: string;

  earnings: string;
  imageUrl: string;

  teamId?: string;
  currentScore: number;
  previousScore: number;
  oldScore: number;
};

export default Player;
