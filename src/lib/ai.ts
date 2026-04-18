import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Assistant Service (Requirement 11.1)
 * Integrates with Gemini 1.5 Flash for venue-specific assistance.
 */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaMockKey');
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 500,
  }
});

const SYSTEM_PROMPT = `
You are the CrowdFlow Assistant. You are currently assisting attendees at a large venue.
Your goal is to provide helpful, safe, and accurate information about venue density, queue times, and navigation.

Venue Context:
- Zones: North Stand Lower, South Stand Lower, Main Food Concourse, Main West Entry.
- Facilities: West Gate Primary (Entry), Burger & Brew (Food).
- Services: Real-time heatmap, queue predictions, and optimized navigation are available in the app.

Safety Guidelines:
- DO NOT store or request PII (Personally Identifiable Information) like names, emails, or phone numbers.
- DO NOT provide medical or emergency advice. In case of emergency, tell the user to find the nearest staff member or first aid station.
- Keep responses concise and focused on venue navigation and crowd flow.
`.trim();

/**
 * Validates chat messages for safety and format (Requirement 11.2).
 */
export function validateChatMessage(message: string): { valid: boolean; error?: string } {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (message.length > 500) {
    return { valid: false, error: 'Message is too long (max 500 characters)' };
  }

  // Basic PII detection (Requirement 9.1)
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /\b\d{10,}\b/;
  
  if (emailRegex.test(message) || phoneRegex.test(message)) {
    return { valid: false, error: 'Please do not share personal contact information.' };
  }

  return { valid: true };
}

/**
 * Starts a chat session with the established system prompt.
 */
export async function getChatStream(prompt: string, history: any[] = []) {
  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: "Initialization" }] },
      { role: 'model', parts: [{ text: SYSTEM_PROMPT }] },
      ...history
    ]
  });

  const result = await chat.sendMessageStream(prompt);
  return result.stream;
}
