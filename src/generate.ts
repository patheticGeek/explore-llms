import fs from "node:fs/promises";
import getBookmarksFromFile from "./bookmarks/getBookmarksFromFile";
import getPageSummaries from "./bookmarks/processBookmarks";
import { Bookmark, BookmarkItem, Folder, ITEM_TYPE } from "./types";

const getPagesFromBookmarks = (item: BookmarkItem): Array<Bookmark> => {
  if (item.type === ITEM_TYPE.FOLDER) {
    return item.children.map(getPagesFromBookmarks).flat();
  }
  return [item];
};

const processItem = (
  item: Bookmark,
  documents: Awaited<ReturnType<typeof getPageSummaries>>,
  folders: Array<Folder>
) => {
  if (!documents[item.id]) return "";
  return `
The url of page is ${item.url} and it is under ${
    folders.length
      ? "folders " + folders.map((f) => f.name).join(" > ")
      : "no folder"
  }.
The page metadata is as follows:
${Object.entries(documents[item.id])
  .map((r) => r.join(": "))
  .join("\n")}
  `.trim();
};

const toJSON = (
  item: BookmarkItem,
  documents: Awaited<ReturnType<typeof getPageSummaries>>,
  folders: Array<Folder> = []
): Array<string> => {
  if (item.type === ITEM_TYPE.FOLDER) {
    return item.children
      .map((i) => toJSON(i, documents, [...folders, item]))
      .flat();
  }

  return [processItem(item, documents, folders)].filter(Boolean);
};

const main = async () => {
  const bookmarks = getBookmarksFromFile("./bookmarks.html");

  const pages = getPagesFromBookmarks(bookmarks);

  const documents = await getPageSummaries(pages);

  const data = toJSON(bookmarks, documents);

  await fs.writeFile("./dataset.json", JSON.stringify(data, null, 2));

  return true;
};

console.log("Generating...");
main().then(console.log).catch(console.error);
