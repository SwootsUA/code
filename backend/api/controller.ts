import { ModelProvider } from '../types';
import { ProviderFactory } from './ProviderFactory';

function parseProviderType(raw: string | undefined): ModelProvider {
  if (!raw) return ModelProvider.OPENAI_GPT4;

  // Accept either enum values (e.g., 'gpt-4.1-mini') or enum keys (e.g., 'OPENAI_GPT4')
  const values = Object.values(ModelProvider);
  if (values.includes(raw as ModelProvider)) return raw as ModelProvider;

  const key = raw.trim().toUpperCase();
  const byKey = (ModelProvider as any)[key];
  if (byKey && values.includes(byKey)) return byKey as ModelProvider;

  console.warn(`[Server] Unknown PROVIDER_TYPE="${raw}". Falling back to ${ModelProvider.OPENAI_GPT4}.`);
  return ModelProvider.OPENAI_GPT4;
}

let currentProviderType: ModelProvider = parseProviderType(process.env.PROVIDER_TYPE);

export const setBackendModel = (provider: ModelProvider) => {
  console.log(`[Server] Switching model to: ${provider}`);
  currentProviderType = provider;
};

export const getBackendModel = () => currentProviderType;

export const processUserQuery = async (query: string): Promise<string> => {
  console.log(`[Server] Processing query: "${query}" using provider: ${currentProviderType}`);

  try {
    const provider = ProviderFactory.createProvider(currentProviderType);
    return await provider.generateResponse(query);
  } catch (error) {
    console.error('[Server] Error processing query:', error);
    throw error;
  }
};
