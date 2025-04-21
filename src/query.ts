import { ContentListUnion, GenerateContentResponse, Type } from "@google/genai";
import { Index } from "@upstash/vector";
import { config } from "dotenv";
import ms from "ms";
import prompts from "prompts";
import getAi from "./lib/ai";

config();

const ai = getAi();

const queryFunctionDeclaration = {
  name: "query_vector_db",
  description: "Queries the vector db in which the bookmarks are stored.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "The string that needs to be queried in db",
      },
      noOfDocuments: {
        type: Type.NUMBER,
        description: "The number of documents to get (optional, default: 10)",
      },
    },
    required: ["query"],
  },
};

const aiConfig = {
  tools: [{ functionDeclarations: [queryFunctionDeclaration] }],
};

const getPrompt = (prompt: string) =>
  `
You are Pathetic Geek's assistant which is built to help people find resources from his bookmarks.
Try to give as many options as possible but try to give only the ones that match the query the most. It is not necessary to return all results asked of you.
If there are less than 2 try to modify query and find more 2 times max.
Do not answer any unrelated query's or vulgar ones.

The user wants a website as follows:
${prompt}

What are the best websites for the user to checkout? Give a list of websites from the above list only. Also give the url and a less than 2 line description:
    `.trim();

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

  const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });

  const contents: ContentListUnion = [
    { role: "user", parts: [{ text: getPrompt(prompt) }] },
  ];

  let haveAnswer = false;
  let response: GenerateContentResponse | undefined;

  while (!haveAnswer) {
    response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: contents,
      config: aiConfig,
    });

    if (response.functionCalls?.length) {
      console.log("Get function call in response", response.functionCalls);
      const responses = await Promise.all(
        response.functionCalls.map(async (functionCall) => {
          if (
            functionCall.name === "query_vector_db" &&
            functionCall.args?.query
          ) {
            const output = await index.query({
              data: functionCall.args?.query as string,
              topK: functionCall.args?.noOfDocuments
                ? parseInt(functionCall.args.noOfDocuments as string, 10)
                : 10,
              includeVectors: true,
              includeMetadata: true,
            });
            return { name: functionCall.name, response: { output } };
          }
        })
      );

      response.functionCalls.forEach((call, idx) => {
        contents.push({ role: "model", parts: [{ functionCall: call }] });
        contents.push({
          role: "user",
          parts: [{ functionResponse: responses[idx]! }],
        });
      });
    } else {
      haveAnswer = true;
    }
  }

  console.log("result generated in", ms(performance.now() - start));
  console.log(response?.text);

  return "Done...";
};

console.log("Started...");
main().then(console.log).catch(console.error);
