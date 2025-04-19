import { config } from "dotenv";
import fs from "node:fs/promises";
import getBookmarksFromFile from "./bookmarks/getBookmarksFromFile";
import getPageSummaries from "./bookmarks/processBookmarks";
import {
  Bookmark,
  BookmarkItem,
  DatasetItem,
  Folder,
  ITEM_TYPE,
} from "./types";

config();

const getPagesFromBookmarks = (item: BookmarkItem): Array<Bookmark> => {
  if (item.type === ITEM_TYPE.FOLDER) {
    return item.children.map(getPagesFromBookmarks).flat();
  }
  return [item];
};

const processItem = (
  item: Bookmark,
  summaries: Awaited<ReturnType<typeof getPageSummaries>>,
  folders: Array<Folder>
): DatasetItem | undefined => {
  if (!summaries[item.id]) return undefined;
  const { level, type, ...metadata } = item;
  return {
    pageContent: summaries[item.id],
    metadata: {
      ...metadata,
      folders: folders.length
        ? folders.map((f) => f.name).join(" > ")
        : undefined,
    },
  };
};

const processBookmarksWithSummaries = (
  item: BookmarkItem,
  summaries: Awaited<ReturnType<typeof getPageSummaries>>,
  folders: Array<Folder> = []
): Array<DatasetItem> => {
  if (item.type === ITEM_TYPE.FOLDER) {
    return item.children
      .map((i) =>
        processBookmarksWithSummaries(i, summaries, [...folders, item])
      )
      .flat();
  }

  const result = processItem(item, summaries, folders);
  return result ? [result] : [];
};

const main = async () => {
  const bookmarks = getBookmarksFromFile("./bookmarks.html");

  const pages = getPagesFromBookmarks(bookmarks);

  const summaries = await getPageSummaries(pages);

  console.log("Have summaries");

  const data = processBookmarksWithSummaries(bookmarks, summaries);

  await fs.writeFile("./dataset.json", JSON.stringify(data, null, 2));

  return "Done...";
};

console.log("Generating...");
main().then(console.log).catch(console.error);
