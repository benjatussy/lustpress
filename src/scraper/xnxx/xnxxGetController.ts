import { load } from "cheerio";
import { lust } from "../../LustPress";
import { IVideoData } from "../../interfaces";

export async function scrapeContent(url: string) {
  try {
    const resolve = await lust.fetchBody(url);
    const $ = load(resolve);

    class Xnxx {
      link: string;
      id: string;
      title: string;
      image: string;
      duration: string;
      views: string;
      uploaded: string;
      action: string[];
      upVote: string;
      downVote: string;
      favVote: string;
      tags: string[];
      models: string[];
      thumbnail: string;
      bigimg: string;
      video: string;
      embed: string;
      constructor() {
        const thumb = $("script")
          .map((i, el) => {
            return $(el).text();
          }).get()
          .filter((el) => el.includes("html5player.setThumbSlideBig"))[0] || "";

        this.thumbnail = thumb.match(/html5player\.setThumbSlideBig\((.*?)\)/)?.[1] || "None";
        this.bigimg = thumb.match(/html5player\.setThumbUrl169\((.*?)\)/)?.[1] || "None";
        this.video = thumb.match(/html5player\.setVideoUrlHigh\((.*?)\)/)?.[1] || "None";
        this.link = $("meta[property='og:url']").attr("content") || "None";
        this.id = this.link.split(".com/")[1] || "None";
        this.title = $("meta[property='og:title']").attr("content") || "None";
        this.image = $("meta[property='og:image']").attr("content") || "None";
        this.duration = $("meta[property='og:duration']").attr("content") || "None";
        this.views = $("span.metadata").text() || "None";
        this.views = this.views.split("-")[2] || "None";

        // Safe uploadDate extraction — guard against missing/changed field
        const ldJson = $("script[type='application/ld+json']").text() || "";
        if (ldJson.includes("uploadDate")) {
          try {
            const parsed = JSON.parse(ldJson);
            this.uploaded = parsed.uploadDate || "None";
          } catch {
            const parts = ldJson.split("uploadDate");
            if (parts.length > 1) {
              this.uploaded = parts[1]
                .split("}")[0]
                .split(":")[1]
                .replace(/"/g, "")
                .replace(/,/g, "")
                .trim();
            } else {
              this.uploaded = "None";
            }
          }
        } else {
          this.uploaded = "None";
        }

        this.action = $("span.vote-actions")
          .find("span.value")
          .map((i, el) => {
            return $(el).text();
          }).get();

        this.upVote = this.action[0] || "None";
        this.downVote = this.action[1] || "None";
        this.favVote = $("span.rating-box.value").text() || "None";
        this.models = $("a.is-pornstar")
          .map((i, el) => {
            return $(el).text();
          }).get();
        this.tags = $("div.metadata-row.video-tags")
          .find("a")
          .map((i, el) => {
            return $(el).text();
          }).get();

        // Safe embed extraction
        const embedRaw = $("input#copy-video-embed").attr("value") || "";
        try {
          const iframePart = embedRaw.split("iframe")[1] || "";
          const srcPart = iframePart.split(" ")[1] || "";
          this.embed = srcPart.replace(/src=/g, "").replace(/"/g, "") || "None";
        } catch {
          this.embed = "None";
        }
      }
    }

    const x = new Xnxx();

    const data: IVideoData = {
      success: true,
      data: {
        title: lust.removeHtmlTagWithoutSpace(x.title),
        id: x.id,
        image: x.image,
        duration: lust.secondToMinute(Number(x.duration)),
        views: lust.removeHtmlTag(x.views),
        rating: x.favVote,
        uploaded: x.uploaded.trim(),
        upvoted: x.upVote,
        downvoted: x.downVote,
        models: x.models,
        tags: x.tags.filter((el) => el !== "Edit tags and models")
      },
      source: x.link,
      assets: lust.removeAllSingleQuoteOnArray([x.embed, x.thumbnail, x.bigimg, x.video])
    };
    return data;

  } catch (err) {
    const e = err as Error;
    throw Error(e.message);
  }
}
