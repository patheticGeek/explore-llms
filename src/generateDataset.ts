import { config } from "dotenv";
import fs from "node:fs/promises";
import getBookmarksFromFile from "./bookmarks/getBookmarksFromFile";
import getPagesHTML from "./bookmarks/getPagesHTML";
import {
  Bookmark,
  BookmarkItem,
  DatasetItem,
  Folder,
  ITEM_TYPE,
} from "./types";

config();

const ensureDir = async (path: string) => {
  try {
    await fs.mkdir(path, { recursive: true });
  } catch (err) {}
};

const getPagesFromBookmarks = (item: BookmarkItem): Array<Bookmark> => {
  if (item.type === ITEM_TYPE.FOLDER) {
    return item.children.map(getPagesFromBookmarks).flat();
  }
  return [item];
};

const processBookmark = async (
  item: Bookmark,
  summaries: Awaited<ReturnType<typeof getPagesHTML>>,
  folders: Array<Folder>
): Promise<DatasetItem | undefined> => {
  if (!summaries[item.id]) return undefined;

  const { level, type, ...metadata } = item;
  const path = `./dataset/pageContent/${metadata.id}.html`;

  await fs.writeFile(path, summaries[item.id]);
  return {
    pageContent: path,
    metadata: {
      ...metadata,
      folders: folders.length
        ? folders.map((f) => f.name).join(" > ")
        : undefined,
    },
  };
};

const processBookmarks = async (
  item: BookmarkItem,
  summaries: Awaited<ReturnType<typeof getPagesHTML>>,
  folders: Array<Folder> = []
): Promise<Array<DatasetItem>> => {
  if (item.type === ITEM_TYPE.FOLDER) {
    const res = await Promise.all(
      item.children.map((i) =>
        processBookmarks(i, summaries, [...folders, item])
      )
    );
    return res.flat();
  }

  const result = await processBookmark(item, summaries, folders);
  return result ? [result] : [];
};

const main = async () => {
  await ensureDir("./dataset/pageContent");

  const bookmarks = getBookmarksFromFile("./bookmarks.html");

  const pages = getPagesFromBookmarks(bookmarks);

  const pagesHTML = await getPagesHTML(pages);

  const data = await processBookmarks(bookmarks, pagesHTML);

  await fs.writeFile("./dataset/index.json", JSON.stringify(data, null, 2));

  return "Done...";
};

console.log("Generating...");
main().then(console.log).catch(console.error);
