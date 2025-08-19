import React from "react";
import * as xml2js from "xml2js";
import * as processors from "xml2js/lib/processors";

const id: string = "272739";

const fetchXmlData = async (): Promise<T | null> => {
  const type: string = "boardgame";
  const stats: string = "1";
  // const versions: string = "1";

  const url: string = `https://boardgamegeek.com/xmlapi2/thing?id=${id}&type=${type}&stats=${stats}`;

  try {
    const response = await fetch(url, { next: { revalidate: 36000 } });
    if (!response.ok) {
      throw new Error("Failed to fetch XML");
    }
    const xmlText = await response.text();

    const parser = new xml2js.Parser({
      explicitArray: false,
      tagNameProcessors: [processors.normalize],
    });

    const result = await parser.parseStringPromise(xmlText);
    return result;
  } catch (error) {
    console.error("Error fetching or parsing XML");
    return null;
  }
};

const page = async () => {
  const bggdata = await fetchXmlData();

  if (!bggdata) {
    return <div>Failed to load data</div>;
  }

  const data = bggdata.items.item;
  const name = data["name"][0]["$"]["value"];
  const weight = data["statistics"]["ratings"]["averageweight"]["$"]["value"];
  const playingtime = data["playingtime"]["$"]["value"];
  console.log(weight);

  return (
    <>
      <p>ID: {id}</p>
      <p>Name: {name}</p>
      <p>Weight: {weight}</p>
      <p>Playing Time: {playingtime}</p>
    </>
  );
};

export default page;
