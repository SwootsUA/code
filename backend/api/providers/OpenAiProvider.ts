import OpenAI from 'openai';
import { RagService } from '../../services/RagService';
import { AIProvider } from '../interfaces/AIProvider';

// This class represents a specific implementation of an LLM provider.
// It handles the specific API calls to OpenAI's service.
export class OpenAiProvider implements AIProvider {
  private ai: OpenAI | null = null;
  private modelName: string;

  constructor(modelName: string = 'gpt-4.1-mini') {
    this.modelName = modelName;
  }

  private getClient(): OpenAI {
    if (this.ai) return this.ai;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is missing for OpenAI Provider.");

    this.ai = new OpenAI({ apiKey });
    return this.ai;
  }

  public async generateResponse(message: string): Promise<string> {
    const ai = this.getClient();

    // Generate RAG response with context retrieval and prompt construction
    const { prompt: augmentedSystemInstruction } = RagService.generateRagResponse(message);

    try {
      const response = await ai.chat.completions.create({
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
