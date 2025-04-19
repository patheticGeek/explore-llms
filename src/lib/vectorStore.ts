import { CohereEmbeddings } from "@langchain/cohere";
import { UpstashVectorStore } from "@langchain/community/vectorstores/upstash";
import { Index } from "@upstash/vector";

export const getVectorStore = () => {
  const embeddings = new CohereEmbeddings({ maxRetries: 1 });
  const index = new Index({});
  const vectorStore = new UpstashVectorStore(embeddings, {
    index: index,
    maxRetries: 1,
  });

  return { embeddings, index, vectorStore };
};
