import { scrapeContent } from "../../scraper/xvideos/xvideosGetController";
import c from "../../utils/options";

export async function getXvideos({ query }: { query: { id: string } }) {
  try {
    const { id } = query;
    const url = id.startsWith("http") ? id : `${c.XVIDEOS}/${id}`;
    const data = await scrapeContent(url);
    return data;
  } catch (err) {
    const e = err as Error;
    throw new Error(e.message);
  }
}

