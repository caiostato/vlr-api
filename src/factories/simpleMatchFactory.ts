import axios from "axios";
import { load } from "cheerio";

import { baseUrl } from "@/constants";
import Match from "@/types/match";
import { idGenerator } from "@/utils";

interface createMatchProps {
  matchUrl: string;
}

const createMatch = async ({ matchUrl }: createMatchProps): Promise<Match> => {
  const { data } = await axios.get(`${baseUrl}${matchUrl}`);
  const $ = load(data);

  const matchObj = new Object() as Match;

  matchObj.id = matchUrl.split("/")[1];
  matchObj.date = $(".match-header-date .moment-tz-convert:nth-child(1)")
    .text()
    .trim();
  matchObj.time = $(".match-header-date .moment-tz-convert:nth-child(2)")
    .text()
    .trim();
  matchObj.eventId =
    $(".match-header-super a.match-header-event").attr("href")?.split("/")[2] ||
    "0";
  matchObj.eventName = $(
    ".match-header-super a.match-header-event div > div:nth-child(1)"
  )
    .text()
    .trim();
  matchObj.logo =
    "https:" + $(".match-header-super a.match-header-event img").attr("src") ||
    "";

  const statusDiv = $(
    ".match-header-vs-score > .match-header-vs-note:first-child"
  )
    .text()
    .trim();

  matchObj.status = "Upcoming";
  if (statusDiv === "final") matchObj.status = "Completed";
  if (statusDiv === "live") {
    matchObj.status = "Ongoing";
  }

  matchObj.streams = [];
  $(".match-streams .match-streams-btn").each((i, element) => {
    if ($(element).attr("href")) {
      matchObj.streams.push({
        name: $(element).text().trim(),
        link: $(element).attr("href") || "",
      });
    } else {
      matchObj.streams.push({
        name: $(element).text().trim(),
        link: $(element).find("a").attr("href") || "",
      });
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapScore: any[] = [];

  mapScore.push(
    $(".match-header-vs .match-header-vs-score span").first().text().trim()
  );
  mapScore.push(
    $(".match-header-vs .match-header-vs-score span").last().text().trim()
  );
  matchObj.teams = [];
  const teamContainers = $(".match-header-vs .wf-title-med");

  teamContainers.each((i, element) => {
    matchObj.teams.push({
      name: $(element).text().trim(),
      id: idGenerator(
        $(element).parent().parent().attr("href")?.split("/")[2] || ""
      ),
      score: mapScore[i],
    });
  });

  return matchObj;
};

export default createMatch;
