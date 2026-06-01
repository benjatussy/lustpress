import { scrapeContent } from "../../scraper/pornhub/pornhubGetController";
import c from "../../utils/options";

export async function getPornhub({ query }: { query: { id: string } }) {
  try {
    const { id } = query;
    // Accept full URL or just the viewkey
    const url = id.startsWith("http") ? id : `${c.PORNHUB}/view_video.php?viewkey=${id}`;
    const data = await scrapeContent(url);
    return data;
  } catch (err) {
    const e = err as Error;
    throw new Error(e.message);
  }
}
