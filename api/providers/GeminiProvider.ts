
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../../config/constants';
import { retrieveContext } from '../../lib/retrieval';
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

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key is missing for Gemini Provider.");
    }

    this.ai = new GoogleGenAI({ apiKey });
    return this.ai;
  }

  public async generateResponse(message: string): Promise<string> {
    const ai = this.getClient();
    
    // 1. RAG STEP: Retrieve relevant context based on the user query
    const relevantContext = retrieveContext(message);
    
    // 2. PROMPT CONSTRUCTION: Inject retrieved context
    const augmentedSystemInstruction = `${SYSTEM_INSTRUCTION}\n\n=== RETRIEVED CONTEXT ===\n${relevantContext || "(No relevant context found in Knowledge Base)"}`;

    try {
      // We use generateContent instead of chatSession for this stateless RAG demo
      // ensuring every request is treated as a fresh query against the knowledge base.
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
