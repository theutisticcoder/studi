
/**
 * This module mocks interaction with Google Gemini.
 * Replace the mock implementation with actual API calls using fetch and your Gemini API key.
 */

export async function chatWithGemini(prompt: string): Promise<string> {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 1200));

  // Mock response logic
  const lower = prompt.toLowerCase();
  if (lower.includes('equation')) {
    return 'Here is the LaTeX for E=mc^2: $E=mc^2$';
  }
  return "I'm working on the answer for that. (Mocked Gemini response)";
}
