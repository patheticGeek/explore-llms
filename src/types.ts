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
};

export type Folder = {
  id: string;
  type: ITEM_TYPE.FOLDER;
  name: string;
  children: Array<Bookmark | Folder>;
  createdAt: number;
};

export type BookmarkItem = Bookmark | Folder;
