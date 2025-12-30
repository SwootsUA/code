import OpenAI from 'openai';
import { SYSTEM_INSTRUCTION } from '../../config/constants';
import { retrieveContext } from '../../lib/retrival';
import { AIProvider } from '../interfaces/AIProvider';

// This class represents a specific implementation of an LLM provider.
// It handles the specific API calls to OpenAI's service.
export class OpenAiProvider implements AIProvider {
  private client: OpenAI | null = null;
  private modelName: string;

  constructor(modelName: string = 'gpt-4.1-mini') {
    this.modelName = modelName;
  }

  private getClient(): OpenAI {
    if (this.client) return this.client;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is missing for OpenAI Provider.");

    this.client = new OpenAI({ apiKey });
    return this.client;
  }

  public async generateResponse(message: string): Promise<string> {
    const client = this.getClient();

    // 1. RAG STEP: Retrieve relevant context based on the user query
    const relevantContext = retrieveContext(message);

    // 2. PROMPT CONSTRUCTION: Inject retrieved context
    const augmentedSystemInstruction = `${SYSTEM_INSTRUCTION}\n\n=== RETRIEVED CONTEXT ===\n${relevantContext || "(No relevant context found in Knowledge Base)"}`;

    try {
      const response = await client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: augmentedSystemInstruction },
          { role: 'user', content: message }
        ],
        temperature: 0.2, // Low temperature for factual RAG responses
      });
      return response.choices[0].message.content || "No response generated.";
    } catch (error) {
      console.error("OpenAI Provider Error:", error);
      throw error;
    }
  }
}
