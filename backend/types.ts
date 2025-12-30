export enum ModelProvider {
  GEMINI_FLASH = 'gemini-2.5-flash',
  GEMINI_PRO = 'gemini-2.5-pro',
  OPENAI_GPT4 = 'gpt-5.2-nano',
  OPENAI_GPT5 = 'gpt-4.1-mini',
  MOCK_MODEL = 'mock-server-response'
}

export interface BackendConfig {
  activeProvider: ModelProvider;
  temperature: number;
}
