export enum ITEM_TYPE {
  FOLDER = "folder",
  BOOKMARK = "bookmark",
}

export type Bookmark = {
  id: string;
  type: ITEM_TYPE.BOOKMARK;
  name: string;
  url: string;
  createdAt: number;
  level: number;
};

export type Folder = {
  id: string;
  type: ITEM_TYPE.FOLDER;
  name: string;
  children: Array<Bookmark | Folder>;
  createdAt: number;
};

export type BookmarkItem = Bookmark | Folder;

export type DatasetItem = {
  pageContent: string;
  metadata: Omit<Bookmark, "level" | "type"> & { folders?: string };
};
