import { Document } from "@langchain/core/documents";
import { config } from "dotenv";
import fs from "fs/promises";
import chunk from "lodash/chunk";
import { getVectorStore } from "./lib/vectorStore";
import { DatasetItem } from "./types";

config();

const main = async () => {
  const data = await fs.readFile("./dataset.json");

  const pages = JSON.parse(data.toString()) as Array<DatasetItem>;

  const { vectorStore } = getVectorStore();

  const documents: Array<Document> = pages.map((page) => {
    delete page.metadata.folders;
    return {
      ...page,
      pageContent: typeof page.pageContent === "string" ? page.pageContent : "",
      metadata: {
        ...page.metadata,
        createdAt: new Date(page.metadata.createdAt).toISOString(),
      },
    };
  });

  let idx = 0;
  const chunks = chunk(documents, 1);

  console.log("main -> chunks:", chunks.length);

  const errorIds: string[] = [];
  for (const docs of chunks) {
    const ids = docs.map((d) => d.metadata.id);

    console.log("chunk", idx);
    try {
      await vectorStore.addDocuments(docs, { ids });
    } catch (err) {
      console.log("error", ids, err);
      errorIds.push(...ids);
    }
    idx++;
  }

  await new Promise((res) => setTimeout(res, 2000));
  console.log("main -> errorIds:", errorIds);

  return "Done...";
};

console.log("Started...");
main().then(console.log).catch(console.error);
