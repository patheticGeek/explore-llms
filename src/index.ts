import { Cohere } from "@langchain/cohere";
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
  console.log(
    "vectorResults",
    ms(performance.now() - start),
    "vectorResults.length",
    vectorResults.length
  );

  const chatModel = new Cohere({});

  const result = await chatModel.invoke(
    `
You are Pathetic Geek's assistant which is built to help people find resources from his bookmarks.

The user wants a website as follows:
${prompt}

The bookmarks that match the prompt are as follows:
${vectorResults.map((r) => `- ${r.pageContent}`).join("\n")}

What are the best websites for the user to checkout? Give a list of 4 websites from the above list only. Also give the url and a short description:
  `.trim()
  );

  console.log("result generated in", ms(performance.now() - start));
  console.log("result\n", result);

  return "Done...";
};

console.log("Started...");
main().then(console.log).catch(console.error);
