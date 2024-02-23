import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const main = async () => {
  const chatModel = new ChatOllama({
    baseUrl: "http://localhost:11434", // Default value
    model: "mistral",
  });

  // const result = await chatModel.invoke("what is LangSmith?");
  // console.log("result", result);

  const outputParser = new StringOutputParser();

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a world class technical documentation writer."],
    ["user", "{input}"],
  ]);
  // const chain = prompt.pipe(chatModel);
  const llmChain = prompt.pipe(chatModel).pipe(outputParser);

  const result = await llmChain.invoke({
    input: "what is LangSmith?",
  });
  console.log("main -> result:", result);

  return "Done...";
};

console.log("Started...");
main().then(console.log).catch(console.error);
