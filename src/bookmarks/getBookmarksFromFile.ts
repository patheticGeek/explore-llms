import crypto from "crypto";
import { readFileSync } from "fs";
import { JSDOM } from "jsdom";
import { BookmarkItem, ITEM_TYPE } from "../types";

const getId = (text) => {
  return crypto.createHash("md5").update(text).digest("hex");
};

const blacklisted = ["Personal", (b) => b.url?.startsWith("chrome://")];
const checkBlacklisted = (node) => {
  return blacklisted.some((b) =>
    typeof b === "function" ? b(node) : b === node.textContent
  );
};

const processNode = (node: HTMLElement, parentNodes) => {
  if (!["DT"].includes(node?.tagName)) return undefined;

  let data: BookmarkItem = {};

  for (const child of node.childNodes) {
    if (child.tagName === "A") {
      data = {
        type: ITEM_TYPE.BOOKMARK,
        name: child.textContent,
        url: child.getAttribute("href"),
        createdAt: child.getAttribute("add_date"),
      };
      break;
    } else if (child.tagName === "DL") {
      data.children = [...child.childNodes];
    } else if (child.tagName === "H3") {
      data.type = ITEM_TYPE.FOLDER;
      data.name = child.textContent;
      data.createdAt = child.getAttribute("add_date");
    }
  }

  data.id = getId(parentNodes.map((p) => p.name).join(">") + `>${data.name}`);
  data.level = parentNodes.length;
  data.createdAt = parseInt(data.createdAt) * 1000;
  // create this object fully first then send to children
  if (data.children) {
    data.children = data.children
      .map((child) => processNode(child, [...parentNodes, data]))
      .filter(Boolean);
  }

  if (checkBlacklisted(data)) return undefined;

  return data;
};

const getBookmarksFromFile = (file: string) => {
  /**
   * Goto your browser > Bookmarks Manager > Export > save as bookmarks.html
   */
  const rawData = readFileSync(file);

  const { window } = new JSDOM(rawData);

  const rootNode = [...window.document.querySelectorAll("dt")].find((node) => [
    [...node.childNodes].find((child) => {
      child.tagName === "H3" && child.getAttribute("personal_toolbar_folder");
    }),
  ]);
  if (!rootNode) throw new Error("[getBookmarksFromFile] No root node found");

  const result = processNode(rootNode, []);
  if (!result)
    throw new Error(
      "[getBookmarksFromFile] No folder returned from process node"
    );

  return result;
};

export default getBookmarksFromFile;
