
export interface AIProvider {
  /**
   * Generates a response based on the user's query.
   * @param query The user's input text.
   * @returns A promise that resolves to the AI's response text.
   */
  generateResponse(query: string): Promise<string>;
}
