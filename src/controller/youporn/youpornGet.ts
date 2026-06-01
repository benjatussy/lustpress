import { scrapeContent } from "../../scraper/youporn/youpornGetController";
import c from "../../utils/options";

export async function getYouporn({ query }: { query: { id: string } }) {
  try {
    const { id } = query;
    const url = id.startsWith("http") ? id : `${c.YOUPORN}/watch/${id}`;
    const data = await scrapeContent(url);
    return data;
  } catch (err) {
    const e = err as Error;
    throw new Error(e.message);
  }
}
