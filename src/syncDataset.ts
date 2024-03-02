import { Document } from "@langchain/core/documents";
import { config } from "dotenv";
import fs from "fs/promises";
import { getVectorStore } from "./lib/vectorStore";

config();

const main = async () => {
  const data = await fs.readFile("./dataset.json");

  const pages = JSON.parse(data.toString()) as Array<string>;

  const { vectorStore } = getVectorStore();
  await vectorStore.addDocuments(
    pages.map((pageContent) => new Document({ pageContent })),
    { ids: pages.map((_, idx) => idx.toString()) }
  );

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return "Done...";
};

console.log("Started...");
main().then(console.log).catch(console.error);
