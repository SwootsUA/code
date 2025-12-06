
import { AIProvider } from '../interfaces/AIProvider';

export class MockProvider implements AIProvider {
  async generateResponse(query: string): Promise<string> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return `[MOCK RESPONSE]\n\nЦе тестова відповідь. Система працює в режимі емуляції.\n\nВаш запит: "${query}"\n\n(Для повноцінної роботи потрібен API Key)`;
  }
}
