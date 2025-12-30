import { knowledgeBaseData } from '../data/knowledgeBase';

interface KnowledgeChunk {
  id: string;
  category: string;
  keywords: string[];
  content: string;
}

// Simple in-memory retrieval simulation
export const retrieveContext = (query: string): string => {
  const normalizedQuery = query.toLowerCase();
  const queryTokens = normalizedQuery.split(/\s+/).filter(token => token.length > 2);

  const chunks: KnowledgeChunk[] = knowledgeBaseData;

  // Score each chunk
  const scoredChunks = chunks.map(chunk => {
    let score = 0;

    // 1. Keyword match in 'keywords' array (Higher weight)
    chunk.keywords.forEach(kw => score += normalizedQuery.includes(kw.toLowerCase()) ? 5 : 0);

    // 2. Token match in content (Lower weight)
    queryTokens.forEach(token => score += chunk.content.toLowerCase().includes(token) ? 1 : 0);

    return { ...chunk, score };
  });

  // Filter out chunks with 0 score, sort by score descending
  const relevantChunks = scoredChunks
    .filter(chunk => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Take top 5 most relevant chunks

  if (relevantChunks.length === 0) return ""; // No relevant context found

  // Format relevant chunks into a single string
  return relevantChunks
    .map(chunk => `[Category: ${chunk.category}]\n${chunk.content}`)
    .join("\n\n");
};
