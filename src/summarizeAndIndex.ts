import { GenerateContentResponse } from "@google/genai";
import { Index } from "@upstash/vector";
import { config } from "dotenv";
import fs, { readFile } from "fs/promises";
import getAi from "./lib/ai";
import { DatasetItem } from "./types";

config();

const ai = getAi();

const promptForPage = `Given document is the content of a website. Summarize in a paragraph what the website is useful for to someone. This summary will be stored in a vector db and you should be able to retrieve it.`;

const responsePrefix = (page: DatasetItem) =>
  `Added on ${new Date(
    page.metadata.createdAt
  ).toISOString()}, is present in "${page.metadata.folders}" bookmark folder.`;

const main = async () => {
  const data = await fs.readFile("./dataset/index.json");

  const pages = JSON.parse(data.toString()) as Array<DatasetItem>;
  console.log("Pages count:", pages.length);

  const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });

  for (const page of pages) {
    if (typeof page.pageContent !== "string") {
      console.log(`No path in page`, page);
      continue;
    }

    const pageContent = await readFile(page.pageContent);
    const contents = [
      { text: promptForPage },
      {
        inlineData: {
          mimeType: "text/md",
          data: Buffer.from(pageContent).toString("base64"),
        },
      },
    ];

    let response: GenerateContentResponse | undefined;
    while (!response) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-1.5-flash-8b",
          contents: contents,
        });
      } catch (err) {
        if (err.message.includes("429 Too Many Requests")) {
          console.log("Got 429, sleeping for 1min");
          await new Promise((res) => setTimeout(res, 60_000));
          console.log("Sleep finished!");
        }
      }
    }

    if (response) {
      const result = responsePrefix(page) + (response.text || "");
      console.log(page.metadata, result);

      await index.upsert({
        id: page.metadata.id,
        data: result,
        metadata: {
          ...page.metadata,
          createdAt: new Date(page.metadata.createdAt).toISOString(),
        },
      });
    }
  }

  await new Promise((res) => setTimeout(res, 2000));

  return "Done...";
};

console.log("Started...");
main().then(console.log).catch(console.error);
