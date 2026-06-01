import { load } from "cheerio";
import { lust } from "../../LustPress";
import { IVideoData } from "../../interfaces";

export async function scrapeContent(url: string) {
  try {
    const resolve = await lust.fetchBody(url);
    const $ = load(resolve);

    class Xvideos {
      link: string;
      id: string;
      title: string;
      image: string;
      duration: string;
      views: string;
      rating: string;
      publish: string;
      upVote: string;
      downVote: string;
      video: string;
      videoLow: string;
      videoHLS: string;
      tags: string[];
      models: string[];
      thumbnail: string;
      bigimg: string;
      embed: string;

      constructor() {
        this.link = $("meta[property='og:url']").attr("content") || "None";

        // New URL format: /video.ALPHAID/title OR old /videoNUMBER/title
        const pathParts = this.link.replace("https://www.xvideos.com/", "");
        this.id = pathParts.split("/")[0] || "None";

        this.title = $("meta[property='og:title']").attr("content") || "None";
        this.image = $("meta[property='og:image']").attr("content") || "None";
        this.duration = $("meta[property='og:duration']").attr("content") || "0";

        // views — strong.mobile-hide inside #v-views
        this.views = $("div#v-views").find("strong.mobile-hide").text() || "None";
        this.rating = $("span.rating-total-txt").text() || "None";
        this.upVote = $("span.rating-good-nbr").text() || "None";
        this.downVote = $("span.rating-bad-nbr").text() || "None";

        // Safe uploadDate extraction
        const ldJson = $("script[type='application/ld+json']").text() || "";
        if (ldJson.includes("uploadDate")) {
          try {
            const parsed = JSON.parse(ldJson);
            this.publish = parsed.uploadDate || "None";
          } catch {
            const parts = ldJson.split("uploadDate");
            if (parts.length > 1) {
              this.publish = parts[1]
                .split("}")[0]
                .split(":")[1]
                .replace(/"/g, "")
                .replace(/,/g, "")
                .trim();
            } else {
              this.publish = "None";
            }
          }
        } else {
          this.publish = "None";
        }

        // Player data from inline script
        const scripts = $("script").map((i, el) => $(el).text()).get();
        const playerScript = scripts.find((s) => s.includes("html5player.setThumbSlideBig")) || "";

        this.thumbnail = playerScript.match(/html5player\.setThumbSlideBig\('(.*?)'\)/)?.[1] || "None";
        this.bigimg    = playerScript.match(/html5player\.setThumbUrl169\('(.*?)'\)/)?.[1] || "None";
        this.video     = playerScript.match(/html5player\.setVideoUrlHigh\('(.*?)'\)/)?.[1] || "None";
        this.videoLow  = playerScript.match(/html5player\.setVideoUrlLow\('(.*?)'\)/)?.[1] || "None";
        this.videoHLS  = playerScript.match(/html5player\.setVideoHLS\('(.*?)'\)/)?.[1] || "None";

        // Tags
        this.tags = $("a.is-keyword.btn.btn-default")
          .map((i, el) => $(el).text().trim())
          .get();

        // Models — from uploader or pornstar links
        this.models = $("li.model")
          .map((i, el) => $(el).find("a").attr("href") || "")
          .get()
          .filter(Boolean)
          .map((el) => el.split("/")[2] || el);

        // Embed — the input value is HTML-encoded, decode it first
        const embedRaw = $("input#copy-video-embed").attr("value") || "";
        if (embedRaw) {
          // Decode HTML entities (&lt; &gt; &quot;)
          const decoded = embedRaw
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, "&");
          // Extract src="..."
          const srcMatch = decoded.match(/src="([^"]+)"/);
          this.embed = srcMatch?.[1] || "None";
        } else {
          // Fallback: build embed URL from video id
          const vidId = this.id.replace("video.", "").replace(/^video(\d+)$/, "$1");
          this.embed = `https://www.xvideos.com/embedframe/${vidId}`;
        }
      }
    }

    const xv = new Xvideos();
    const data: IVideoData = {
      success: true,
      data: {
        title: lust.removeHtmlTagWithoutSpace(xv.title),
        id: xv.id,
        image: xv.image,
        duration: lust.secondToMinute(Number(xv.duration)),
        views: lust.removeHtmlTag(xv.views),
        rating: xv.rating,
        uploaded: xv.publish,
        upvoted: xv.upVote,
        downvoted: xv.downVote,
        models: xv.models,
        tags: xv.tags,
      },
      source: xv.link,
      assets: lust.removeAllSingleQuoteOnArray([xv.embed, xv.thumbnail, xv.bigimg, xv.video])
    };
    return data;

  } catch (err) {
    const e = err as Error;
    throw Error(e.message);
  }
}
