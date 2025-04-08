import { baseUrl } from "@/constants";
import createMatch from "@/factories/simpleMatchFactory";
import Match from "@/types/match";
import axios from "axios";
import { load } from "cheerio";

const getMatches = async (): Promise<Match[]> => {
  const { data } = await axios.get(
    `${baseUrl}/event/matches/2347/champions-tour-2025-americas-stage-1`
  );
  const $ = load(data);

  const matchElements = $(".match-item");
  const matches: Match[] = [];

  for (let i = 0; i < matchElements.length; i++) {
    const el = matchElements[i];
    const matchHref = $(el).attr("href") || "";
    const match = await createMatch({ matchUrl: matchHref });
    matches.push(match);
  }

  return matches;
};
export default getMatches;
