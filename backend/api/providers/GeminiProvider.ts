import { GoogleGenAI } from "@google/genai";
import { RagService } from '../../services/RagService';
import { AIProvider } from '../interfaces/AIProvider';

// This class represents a specific implementation of an LLM provider.
// It handles the specific API calls to Google's Gemini service.
export class GeminiProviderService implements AIProvider {
  private ai: GoogleGenAI | null = null;
  private modelName: string;

  constructor(modelName: string = 'gemini-2.5-flash') {
    this.modelName = modelName;
  }

  private getClient(): GoogleGenAI {
    if (this.ai) return this.ai;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing for Gemini Provider.");

    this.ai = new GoogleGenAI({ apiKey });
    return this.ai;
  }

  public async generateResponse(message: string): Promise<string> {
    const ai = this.getClient();

    // Generate RAG response with context retrieval and prompt construction
    const { prompt: augmentedSystemInstruction } = RagService.generateRagResponse(message);

    try {
      const result = await ai.models.generateContent({
        model: this.modelName,
        contents: message,
        config: {
          systemInstruction: augmentedSystemInstruction,
          temperature: 0.2, // Low temperature for factual RAG responses
        },
      });
      return result.text || "No response generated.";
    } catch (error) {
      console.error("Gemini Provider Error:", error);
      throw error;
    }
  }
}
