import { SYSTEM_INSTRUCTION } from '../config/constants';
import { retrieveContext } from '../lib/retrival';

export interface RagResponse {
  context: string;
  prompt: string;
}

export class RagService {
  /**
   * Generates a complete RAG response with context retrieval and prompt construction
   * @param query The user's query
   * @param systemInstruction Optional custom system instruction (defaults to SYSTEM_INSTRUCTION)
   * @returns Object containing retrieved context and augmented prompt
   */
  static generateRagResponse(query: string, systemInstruction: string = SYSTEM_INSTRUCTION): RagResponse {
    // 1. Retrieve relevant context
    const context = retrieveContext(query);

    // 2. Build augmented prompt
    const prompt = RagService.buildAugmentedPrompt(systemInstruction, context);

    return { context, prompt };
  }

  /**
   * Builds an augmented prompt by combining system instruction with retrieved context
   * @param systemInstruction The base system instruction
   * @param context The retrieved context (can be empty)
   * @returns The complete prompt string
   */
  private static buildAugmentedPrompt(systemInstruction: string, context: string): string {
    return `${systemInstruction}\n\n=== RETRIEVED CONTEXT ===\n${context || "(No relevant context found in Knowledge Base)"}`;
  }
}
