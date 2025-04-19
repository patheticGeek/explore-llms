import { ChatCohere } from "@langchain/cohere";
import { config } from "dotenv";
import ms from "ms";
import prompts from "prompts";
import { getVectorStore } from "./lib/vectorStore";

config();

const main = async () => {
  const prompt = (
    await prompts({
      type: "text",
      name: "value",
      message: "What resource are you looking for?",
    })
  ).value;

  if (!prompt) throw new Error("Provide a prompt");
  console.log(`Getting sites for ya...`);

  const start = performance.now();

  const { vectorStore } = getVectorStore();
  const vectorResults = await vectorStore.similaritySearch(prompt, 10);
  console.log("vectorResults", ms(performance.now() - start));

  const chatModel = new ChatCohere({
    temperature: 0,
    maxRetries: 1,
  });

  const chatMessage = `
You are Pathetic Geek's assistant which is built to help people find resources from his bookmarks.

The user wants a website as follows:
${prompt}

The bookmarks that match the prompt are as follows:
${
  vectorResults.length
    ? vectorResults
        .map(
          ({ pageContent, metadata }) =>
            `URL: ${metadata.url}\nName:${metadata.name}\nFolder: ${metadata.folder}\nSummary: ${pageContent}`
        )
        .join("\n")
    : "No websites found using the query"
}

What are the best websites for the user to checkout? Give a list of 4 websites from the above list only. Also give the url and a short description:
    `.trim();
  const result = await chatModel.invoke(chatMessage);

  console.log("result generated in", ms(performance.now() - start));
  console.log(`Got output ${result}`);

  return "Done...";
};

console.log("Started...");
main().then(console.log).catch(console.error);
