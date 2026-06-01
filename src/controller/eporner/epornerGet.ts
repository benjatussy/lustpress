import { scrapeContent } from "../../scraper/eporner/epornerGetController";
import c from "../../utils/options";

export async function getEporner({ query }: { query: { id: string } }) {
  try {
    const { id } = query;
    let url: string;
    if (id.startsWith("http")) {
      url = id;
    } else if (id.startsWith("video-")) {
      url = `${c.EPORNER}/${id}`;
    } else {
      url = `${c.EPORNER}/hd-porn/${id}`;
    }
    const data = await scrapeContent(url);
    return data;
  } catch (err) {
    const e = err as Error;
    throw new Error(e.message);
  }
}
