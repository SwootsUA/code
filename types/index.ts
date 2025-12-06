
export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

// Backend Configuration Types
export enum ModelProvider {
  GEMINI_FLASH = 'gemini-2.5-flash',
  GEMINI_PRO = 'gemini-2.5-pro',
  MOCK_MODEL = 'mock-server-response'
}

export interface BackendConfig {
  activeProvider: ModelProvider;
  temperature: number;
}
