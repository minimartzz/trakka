// Functions related to calling BGG API
import * as xml2js from "xml2js";
import * as processors from "xml2js/lib/processors";

interface BGGIdsInterface {
  type: string;
  id: string;
}

export interface BGGDetailsInterface extends BGGIdsInterface {
  thumbnail: string;
  image: string;
  title: string;
  rating: string;
  weight: string;
  playingtime: string;
  yearPublished: string;
}

export const fetchBGGIds = async (
  query: string,
  signal: AbortSignal
): Promise<BGGIdsInterface[] | []> => {
  try {
    const url = `https://boardgamegeek.com/xmlapi2/search?query=${query}&type=boardgame`;
    const response = await fetch(url, {
      // headers: {
      //   Authorization: `Bearer ${process.env.BGG_TOKEN}`,
      // },
      signal: signal,
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
  signal: AbortSignal
): Promise<BGGDetailsInterface[] | []> => {
  try {
    const ids = params
      .map((param) => param.id)
      .slice(0, 20)
      .join(",");
    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${ids}&type=boardgame&stats=1`;

    const response = await fetch(url, {
      // headers: {
      //   Authorization: `Bearer ${process.env.BGG_TOKEN}`,
      // },
      signal: signal,
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
    let details;
    if (Array.isArray(games)) {
      details = games.map((item) => ({
        id: item["$"]["id"],
        type: item["$"]["type"],
        thumbnail: item["thumbnail"],
        image: item["image"],
        title: Array.isArray(item["name"])
          ? item["name"][0]["$"]["value"]
          : item["name"]["$"]["value"],
        rating: item["statistics"]["ratings"]["average"]["$"]["value"],
        weight: item["statistics"]["ratings"]["averageweight"]["$"]["value"],
        playingtime: item["playingtime"]["$"]["value"],
        yearPublished: item["yearpublished"]["$"]["value"],
      }));
    } else {
      details = [
        {
          id: games["$"]["id"],
          type: games["$"]["type"],
          thumbnail: games["thumbnail"],
          image: games["image"],
          title: Array.isArray(games["name"])
            ? games["name"][0]["$"]["value"]
            : games["name"]["$"]["value"],
          rating: games["statistics"]["ratings"]["average"]["$"]["value"],
          weight: games["statistics"]["ratings"]["averageweight"]["$"]["value"],
          playingtime: games["playingtime"]["$"]["value"],
          yearPublished: games["yearpublished"]["$"]["value"],
        },
      ];
    }
    return details;
  } catch (error) {
    console.error(error);
    return [];
  }
};
