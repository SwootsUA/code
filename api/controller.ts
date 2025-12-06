
import { ModelProvider } from '../types';
import { ProviderFactory } from './ProviderFactory';

// === BACKEND CONTROLLER ===
// This file simulates a Node.js server controller.
// It is now decoupled from specific provider implementations.

// Default configuration (can be loaded from config file in real app)
let currentProviderType = ModelProvider.GEMINI_FLASH;

/**
 * Changes the active backend model.
 * In a real server, this might be a per-request configuration or a global setting.
 */
export const setBackendModel = (provider: ModelProvider) => {
  console.log(`[Server] Switching model to: ${provider}`);
  currentProviderType = provider;
};

export const getBackendModel = () => currentProviderType;

/**
 * Main entry point for processing user queries.
 * Routes the request to the currently active provider.
 */
export const processUserQuery = async (query: string): Promise<string> => {
  console.log(`[Server] Processing query: "${query}" using provider: ${currentProviderType}`);

  try {
    // Instantiate the provider using the factory
    const provider = ProviderFactory.createProvider(currentProviderType);
    
    // Delegate execution to the provider
    return await provider.generateResponse(query);
  } catch (error) {
    console.error("[Server] Error processing query:", error);
    
    // Fallback logic if needed (e.g., if Gemini fails, switch to Mock or error out)
    throw error;
  }
};
