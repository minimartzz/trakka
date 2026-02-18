"use server";
// Functions related to calling BGG API
import * as xml2js from "xml2js";
import * as processors from "xml2js/lib/processors";

interface BGGIdsInterface {
  type: string;
  id: string;
}

interface BGGAPILink {
  $: {
    type: string;
    id: string;
    value: string;
  };
}

interface BGGLinkInterface {
  id: string;
  name: string;
}

export interface BGGDetailsInterface extends BGGIdsInterface {
  thumbnail: string;
  image: string;
  title: string;
  description: string;
  minPlayers: string;
  maxPlayers: string;
  recPlayers: string;
  playingTime: string;
  minPlayingTime: string;
  maxPlayingTime: string;
  minAge: string;
  rating: string;
  weight: string;
  categories: BGGLinkInterface[];
  mechanics: BGGLinkInterface[];
  families: BGGLinkInterface[];
  playingtime: string;
  yearPublished: string;
}

const extractRecommendedPlayers = (polls: any): string => {
  if (!polls) return "n/a";

  const pollArray = Array.isArray(polls) ? polls : [polls];
  const playerPoll = pollArray.find(
    (p) => p["$"]["name"] === "suggested_numplayers",
  );

  if (!playerPoll || !playerPoll["results"]) return "n/a";

  let bestCount = "n/a";
  let maxVotes = -1;

  const pollResults = Array.isArray(playerPoll.results)
    ? playerPoll.results
    : [playerPoll.results];

  pollResults.forEach((r: any) => {
    const numPlayers = r["$"]["numplayers"];
    const votes = Array.isArray(r["result"]) ? r["result"] : [r["result"]];

    const bestVote = votes.find((v: any) => v["$"]["value"] === "Best");
    const bestVoteCount = parseInt(bestVote?.["$"]["numvotes"] || "0", 10);

    if (bestVoteCount > maxVotes) {
      maxVotes = bestVoteCount;
      bestCount = numPlayers;
    }
  });

  return bestCount;
};

const extractBgTags = (
  links: BGGAPILink[],
  type: string,
): BGGLinkInterface[] => {
  if (!links) return [];
  const linkArray = Array.isArray(links) ? links : [links];

  return linkArray
    .filter((item: BGGAPILink) => item["$"]["type"] === type)
    .map((item: BGGAPILink) => ({
      id: item["$"]["id"],
      name: item["$"]["value"],
    }));
};

export const fetchBGGIds = async (
  query: string,
  exact: boolean,
): Promise<BGGIdsInterface[] | []> => {
  try {
    const url = exact
      ? `https://boardgamegeek.com/xmlapi2/search?query=${query}&type=boardgame&exact=1`
      : `https://boardgamegeek.com/xmlapi2/search?query=${query}&type=boardgame`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_BGG_TOKEN}`,
        "User-Agent": "Trakka/1.0",
      },
      next: { revalidate: 36000 },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch XML from BGG ID search");
    }
    const xmlText = await response.text();

    // Convert XML to JSON
    const parser = new xml2js.Parser({
      explicitArray: false,
      tagNameProcessors: [processors.normalize],
    });
    const result = await parser.parseStringPromise(xmlText);

    // Extract IDs
    const games = result.items.item;
    if (games == null) {
      return [];
    }

    let items;
    if (Array.isArray(games)) {
      items = games.map((game: { [x: string]: any }) => game["$"]);
    } else {
      items = [games["$"]]; // BGG API will return a signal object if only 1 result is available
    }

    return items;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchBGGDetails = async (
  params: BGGIdsInterface[],
): Promise<BGGDetailsInterface[] | []> => {
  try {
    const ids = params
      .map((param) => param.id)
      .slice(0, 20)
      .join(",");
    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${ids}&type=boardgame&stats=1`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_BGG_TOKEN}`,
        "User-Agent": "Trakka/1.0",
      },
      next: { revalidate: 36000 },
    });

    if (!response.ok) {
      throw new Error("Failed to get more board game details");
    }
    const xmlText = await response.text();

    // Convert XML to JSON
    const parser = new xml2js.Parser({
      explicitArray: false,
      tagNameProcessors: [processors.normalize],
    });
    const data = await parser.parseStringPromise(xmlText);
    if (data == null) {
      return [];
    }

    const games = data.items.item;
    let details: BGGDetailsInterface[];

    const extractDetails = (item: any): BGGDetailsInterface => ({
      id: item["$"]["id"],
      type: item["$"]["type"],
      thumbnail: item["thumbnail"],
      image: item["image"],
      title: Array.isArray(item["name"])
        ? item["name"][0]["$"]["value"]
        : item["name"]["$"]["value"],
      description: item["description"],
      minPlayers: item["minplayers"]["$"]["value"],
      maxPlayers: item["maxplayers"]["$"]["value"],
      recPlayers: extractRecommendedPlayers(item["poll"]),
      playingTime: item["playingtime"]["$"]["value"],
      minPlayingTime: item["minplaytime"]["$"]["value"],
      maxPlayingTime: item["maxplaytime"]["$"]["value"],
      minAge: item["minage"]["$"]["value"],
      rating: item["statistics"]["ratings"]["average"]["$"]["value"],
      weight: item["statistics"]["ratings"]["averageweight"]["$"]["value"],
      playingtime: item["playingtime"]["$"]["value"],
      yearPublished: item["yearpublished"]["$"]["value"],
      // Tag related information
      categories: extractBgTags(item["link"], "boardgamecategory"),
      mechanics: extractBgTags(item["link"], "boardgamemechanic"),
      families: extractBgTags(item["link"], "boardgamefamily"),
    });

    if (Array.isArray(games)) {
      details = games.map(extractDetails);
    } else {
      details = [extractDetails(games)];
    }

    return details;
  } catch (error) {
    console.error(error);
    return [];
  }
};
