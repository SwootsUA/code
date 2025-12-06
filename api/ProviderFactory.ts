
import { ModelProvider } from '../types';
import { AIProvider } from './interfaces/AIProvider';
import { GeminiProviderService } from './providers/GeminiProvider';
import { MockProvider } from './providers/MockProvider';

export class ProviderFactory {
  /**
   * Creates and returns an instance of an AI Provider.
   * @param providerType The type of model to instantiate.
   */
  static createProvider(providerType: ModelProvider): AIProvider {
    switch (providerType) {
      case ModelProvider.GEMINI_FLASH:
      case ModelProvider.GEMINI_PRO:
        return new GeminiProviderService(providerType);
        
      case ModelProvider.MOCK_MODEL:
        return new MockProvider();
        
      default:
        console.warn(`Unknown provider type: ${providerType}. Defaulting to Gemini Flash.`);
        return new GeminiProviderService(ModelProvider.GEMINI_FLASH);
    }
  }
}
