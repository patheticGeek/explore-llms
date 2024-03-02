import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { config } from "dotenv";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import ms from "ms";
import fs from "node:fs/promises";
import prompts from "prompts";

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

  const start = performance.now();

  const data = await fs.readFile("./dataset.json");

  const docs = JSON.parse(data.toString());

  const chatModel = new ChatOllama({
    baseUrl: "http://localhost:11434",
    model: "mistral",
  });

  const embeddings = new OllamaEmbeddings({
    model: "mistral",
    baseUrl: "http://localhost:11434",
    requestOptions: {
      useMMap: true,
      numThread: 6,
      numGpu: 1,
    },
  });

  console.log(`[prompt] ${prompt}\n`);
  const vectorStore = await MemoryVectorStore.fromTexts(docs, [], embeddings);
  console.log("vector store generated", ms(performance.now() - start));

  const vectorResults = await vectorStore.similaritySearch(prompt, 10);
  console.log(
    "vectorResults",
    ms(performance.now() - start),
    "vectorResults.length",
    vectorResults.length
  );

  const result = await chatModel.invoke(`
You are Pathetic Geek's assistant which is built to help users find resources from his bookmarks.

The user wants a website as follows:
${prompt}

The resources that match the prompt are described as follows:
${vectorResults.map((r) => `- ${r.pageContent}`).join("\n")}

What are the best websites for the user to checkout? Give a list of 5 websites from the above list only along with a short description:
  `);

  console.log("result generated in", ms(performance.now() - start));
  console.log("result.content", result.content);

  // const result = await chatModel.invoke("what is LangSmith?");
  // const outputParser = new StringOutputParser();

  // const prompt = ChatPromptTemplate.fromMessages([
  //   ["system", "You are a world class technical documentation writer."],
  //   ["user", "{input}"],
  // ]);
  // // const chain = prompt.pipe(chatModel);
  // const llmChain = prompt.pipe(chatModel).pipe(outputParser);

  // const result = await llmChain.invoke({
  //   input: "what is LangSmith?",
  // });
  // console.log("main -> result:", result);

  return "Done...";
};

console.log("Started...");
main().then(console.log).catch(console.error);
