import axios from "axios";
import liveGeminiService from "./services/liveGeminiService.js";

/**
 * Build chat-specific prompt (conversational, Visual Serving Format)
 * Optimized for Orvion's friendly, structured responses with PURE MARKDOWN
 */
const buildChatPrompt = (command, assistantName, userName, conversationContext) => {
  const contextSection = conversationContext ?
    `\n\nPrevious Conversation:\n${conversationContext.contextString || conversationContext}\n\nUse this context to maintain conversation continuity.\n` : '';

  return `You are **Orvion**, a highly advanced AI assistant created by Harshal.
Your goal is to provide helpful, accurate, and visually structured responses.

${contextSection}

### RESPONSE FORMATTING RULES (STRICTLY FOLLOW):

1.  **MARKDOWN ONLY**: Always output valid, clean Markdown. No JSON, no XML.
2.  **STRUCTURE**:
    *   Start with a **Heading 1 (#)** for the main topic title.
    *   Use **Heading 2 (##)** to separate major sections.
    *   Use **Heading 3 (###)** for subsections.
3.  **DATA PRESENTATION**:
    *   **Tables**: ALWAYS use Markdown tables (\`| Col | Col | ... \`) when comparing items, listing specs, or presenting structured data.
    *   **Lists**: Use bullet points (*) or numbered lists (1.) for steps, features, or key points. Never write long, dense paragraphs.
4.  **HIGHLIGHTING**:
    *   Use **bold** for key terms and important concepts.
    *   Use \`code\` blocks for commands, code snippets, or technical terms.
5.  **TONE**:
    *   Professional, friendly, and concise.

### EXAMPLE STRUCTURE:

# 🚀 Main Topic Title

Brief introduction explaining the concept.

## 📊 Comparison / Data
| Feature | Details |
| :--- | :--- |
| Item A | Description A |
| Item B | Description B |

## 🛠 Key Features
*   **Feature 1**: Explanation...
*   **Feature 2**: Explanation...

user: ${command}`;
};

/**
 * Build voice-specific prompt (JSON with intents)
 * Maintains existing voice command structure
 */
const buildVoicePrompt = (command, assistantName, userName, conversationContext) => {
  const contextSection = conversationContext ?
    `\n\nPrevious Conversation Context:\n${conversationContext.contextString || conversationContext}\n\nUse this context to understand follow-up questions and maintain conversation continuity.\n` : '';

  return `You are a virtual assistant named ${assistantName} created by ${userName}. 
You are not Google. You will now behave like a voice-enabled assistant.
${contextSection}
Your task is to understand the user's natural language input (in ANY language) and respond with a JSON object.

CRITICAL: Detect the language of the user input and respond in the same language.
If the user speaks Hindi, respond in Hindi. If Marathi, respond in Marathi. If English, respond in English.
Keep the JSON keys in English, but the "response" value must be in the detected language.

Structure:

{
  "type": "general" | "google-search" | "...",
  "userInput": "<original user input>",
  "response": "<a short spoken response in the SAME language as input>",
  "language": "<detected language code, e.g., 'en-US', 'hi-IN', 'mr-IN', 'es-ES'>",
  "metadata": { 
    "appName": "<extracted app name if applicable>",
    "searchQuery": "<concise search term for wikipedia/google/youtube>"
  }
}

Instructions:
- "type": determine the intent of the user.
- "userInput": original sentence the user spoke.
- "response": A short voice-friendly reply in the user's language.
- "language": The BCP-47 language code of the detected language (important for Text-to-Speech).
- "metadata.searchQuery": CRITICAL. Extract the core subject/formatted query from the input.
  - For "who is Donald Trump", query = "Donald Trump"
  - For "play Despacito", query = "Despacito"
  - For "search for latest news", query = "latest news"
Type meanings:
- "general": factual/informational questions you can answer directly with short answers
- "google-search": user wants to search something on Google
- "youtube-search": user wants to search something on YouTube
- "youtube-play": user wants to directly play a video or song
- "calculator-open": user wants to open a calculator
- "instagram-open": user wants to open Instagram
- "instagram-dm": user wants to send Instagram direct message (e.g., "send Instagram DM to John", "message on Instagram")
- "instagram-story": user wants to open Instagram stories or camera (e.g., "open Instagram story", "post on Instagram")
- "instagram-profile": user wants to view Instagram profile (e.g., "open Instagram profile", "show Instagram account")
- "facebook-open": user wants to open Facebook
- "weather-show": user wants to know weather
- "get-time": user asks for current time
- "get-date": user asks for today's date
- "get-day": user asks what day it is
- "get-month": user asks for the current month
- "payment-phonepe": user wants to pay using PhonePe (e.g., "pay 500 rupees using phonepe", "send money via phonepe")
- "payment-googlepay": user wants to pay using Google Pay (e.g., "pay 1000 using google pay", "gpay 200 rupees")
- "payment-paytm": user wants to pay using Paytm (e.g., "paytm 300 rupees", "send via paytm")
- "payment-upi": user wants to pay using any UPI app (e.g., "pay 500 rupees", "send 1000", "transfer money")
- "whatsapp-send": send WhatsApp message
- "telegram-send": send Telegram message
- "call-contact": make a phone call
- "set-alarm": set an alarm
- "set-reminder": set a reminder
- "play-music": play music
- "device-control": control smart devices (TV, lights, etc.)
- "take-note": take a note
- "read-news": read latest news
- "translate": translate text
- "email-send": send an email
- "screenshot": take a screenshot
- "volume-control": control device volume
- "brightness-control": control screen brightness
- "wikipedia-query": user wants Wikipedia facts (e.g., "who is Einstein", "tell me about pyramids", "what is photosynthesis")
- "web-search": user wants to search the web for current information
- "quick-answer": user asks a question that needs a quick factual answer
- "calendar-view": view calendar events (e.g., "show my calendar", "what's on my schedule")
- "calendar-create": create calendar event (e.g., "schedule meeting at 3pm", "add event")
- "calendar-today": check today's events (e.g., "what's on my calendar today", "today's schedule")
- "gmail-check": check unread emails (e.g., "check my email", "any new emails")
- "gmail-read": read recent emails (e.g., "read my emails", "show recent messages")
- "gmail-send": send an email via Gmail (e.g., "send email to John", "email someone")
- "bluetooth-scan": scan for Bluetooth devices (e.g., "scan bluetooth", "find bluetooth devices")
- "bluetooth-connect": connect to Bluetooth device (e.g., "connect to headphones", "pair device")
- "app-launch": launch an application (e.g., "open spotify", "launch vscode", "start chrome")
- "app-close": close an application (e.g., "close spotify", "quit chrome", "close spotify app")
- "list-apps": list installed applications (e.g., "list apps", "show installed apps", "what apps do I have")
- "screen-record": start/stop screen recording (e.g., "record screen", "start recording")
- "screen-share": start screen sharing (e.g., "share screen", "start screen share")
- "cast-media": cast media to Chromecast/TV (e.g., "cast to TV", "stream to chromecast")
- "cast-youtube": cast YouTube video to TV (e.g., "play this on TV", "cast YouTube video")
- "camera-photo": take a photo (e.g., "take a picture", "capture photo", "take selfie")
- "camera-video": record video (e.g., "record video", "start camera recording")
- "pick-contact": select contact from phone (e.g., "pick a contact", "select contact", "choose contact")
- "itinerary-create": create travel itinerary or trip plan (e.g., "create 5-day Goa itinerary", "plan trip to Paris")
- "trip-plan": plan a trip with budget and activities (e.g., "plan 3-day trip under 10000", "create vacation plan")

Payment Command Examples:
- "pay 500 rupees using phonepe" → type: "payment-phonepe", response: "Opening PhonePe to pay 500 rupees"
- "send 1000 via google pay" → type: "payment-googlepay", response: "Opening Google Pay to send 1000 rupees"
- "paytm 200 to Raj" → type: "payment-paytm", response: "Opening Paytm to pay 200 rupees to Raj"
- "transfer 5000 rupees" → type: "payment-upi", response: "Opening UPI to transfer 5000 rupees"

Knowledge Command Examples:
- "who is Albert Einstein" → type: "wikipedia-query", response: "Let me tell you about Albert Einstein"
- "tell me about the Eiffel Tower" → type: "wikipedia-query", response: "Here's what I found about the Eiffel Tower"
- "search for latest AI news" → type: "web-search", response: "Searching for latest AI news"
- "what is the capital of France" → type: "quick-answer", response: "Let me find that for you"

Multi-Step Task Examples:
- "create a 5-day Goa itinerary under 15000" → type: "itinerary-create", response: "I'll create a detailed 5-day Goa itinerary for you"
- "plan a trip to Manali for 3 days" → type: "trip-plan", response: "Planning your 3-day Manali trip"

Phase 3 Command Examples:
- "show my calendar" → type: "calendar-view", response: "Loading your calendar"
- "schedule meeting at 3pm" → type: "calendar-create", response: "Creating calendar event"
- "what's on my calendar today" → type: "calendar-today", response: "Checking today's schedule"
- "check my email" → type: "gmail-check", response: "Checking your emails"
- "read my recent emails" → type: "gmail-read", response: "Reading your recent messages"
- "send email to John" → type: "gmail-send", response: "Opening email composer"
- "scan for bluetooth devices" → type: "bluetooth-scan", response: "Scanning for devices"
- "connect to my headphones" → type: "bluetooth-connect", response: "Connecting to device"
- "open spotify" → type: "app-launch", metadata: { "appName": "spotify" }, response: "Opening Spotify"
- "close spotify" → type: "app-close", metadata: { "appName": "spotify" }, response: "Closing Spotify"
- "launch vscode" → type: "app-launch", metadata: { "appName": "vscode" }, response: "Launching VS Code"
- "quit chrome" → type: "app-close", metadata: { "appName": "chrome" }, response: "Closing Chrome"
- "list installed apps" → type: "list-apps", response: "Fetching installed applications"
- "show me available apps" → type: "list-apps", response: "Getting list of apps"
- "what apps are installed" → type: "list-apps", response: "Checking installed applications"
- "record my screen" → type: "screen-record", response: "Starting screen recording"
- "share my screen" → type: "screen-share", response: "Starting screen share"
- 
Important:
- Use ${userName} if asked who created you
- Only respond with the JSON object, nothing else
- For payment commands, keep the full amount and recipient details in userInput
- For Wikipedia queries, prefer "wikipedia-query" over "google-search" for factual information about people, places, events
- For trip planning, use "itinerary-create" or "trip-plan" for multi-step travel planning tasks
- Use conversation context to understand pronouns and follow-up questions (e.g., "What about his childhood?" after asking about Einstein)

CRITICAL WIKIPEDIA PRIORITY RULES:
- ALWAYS use "wikipedia-query" for questions starting with: who, what, when, where, why, how (when asking about concepts/people/places)
- ALWAYS use "wikipedia-query" for: "tell me about", "explain", "describe", "information about", "facts about"
- ALWAYS use "wikipedia-query" for factual information about: people, places, historical events, scientific concepts, countries, cities, landmarks, inventions, discoveries, animals, plants, organizations- Use "web-search" ONLY for: current events, latest news, real-time information, shopping, recent updates, trending topics
- **PRIORITIZE "wikipedia-query" over "web-search" and "general" for ANY factual/informational question**


User Input: ${command}
`;
};

/**
 * Main Gemini API function with mode support
 * @param {string} command - User input
 * @param {string} assistantName - Name of assistant
 * @param {string} userName - Name of user
 * @param {object} conversationContext - Previous conversation context
 * @param {string} mode - 'chat' or 'voice' (default: 'voice' for backward compatibility)
 */
const geminiResponse = async (command, assistantName, userName, conversationContext = '', mode = 'voice', signal = null) => {
  // [COPILOT-CHANGE] Switch to gemini-2.5-flash-native-audio-dialog (User Requested)
  let modelName = 'gemini-2.5-flash-native-audio-dialog';

  // [COPILOT-CHANGE] Route to Live API for Native Audio model
  if (modelName === 'gemini-2.5-flash-native-audio-dialog') {
    console.log('[GEMINI] Using Live API (WebSocket) for model:', modelName);
    try {
      const systemPrompt = mode === 'chat'
        ? buildChatPrompt(command, assistantName, userName, conversationContext)
        : buildVoicePrompt(command, assistantName, userName, conversationContext);

      // Use the Live Service
      const response = await liveGeminiService.generateResponse(command, modelName, process.env.GEMINI_API_KEY, systemPrompt);

      if (mode === 'chat') console.log('[GEMINI] Chat response length:', response ? response.length : 0);
      return response;
    } catch (err) {
      console.error('[GEMINI] Live API Failed:', err.message);
      console.warn('[GEMINI] Falling back to REST (gemini-1.5-flash)');
      modelName = 'gemini-1.5-flash'; // Fallback model
      // Continue to REST implementation below
    }
  }

  // REST Fallback (Standard Path)
  let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  if (process.env.GEMINI_API_KEY) {
    apiUrl += '?key=' + process.env.GEMINI_API_KEY;
  }

  // Build appropriate prompt based on mode
  const prompt = mode === 'chat'
    ? buildChatPrompt(command, assistantName, userName, conversationContext)
    : buildVoicePrompt(command, assistantName, userName, conversationContext);

  console.log(`[GEMINI] Mode: ${mode}, Command: ${command.substring(0, 50)}...`);

  // Retry Logic Configuration
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }

      const result = await axios.post(apiUrl, {
        "contents": [{
          "parts": [{ "text": prompt }]
        }],
        "generationConfig": {
          "temperature": 0.7,
          "topK": 40,
          "topP": 0.95,
          "maxOutputTokens": 8192,
          "responseMimeType": "text/plain"
        }
      }, {
        signal // Pass abort signal to axios
      });

      const response = result.data.candidates[0].content.parts[0].text;

      if (mode === 'chat') {
        console.log('[GEMINI] Chat response length:', response.length);
        return response;
      }
      return response;

    } catch (error) {
      if (error.message === 'Request aborted' || error.name === 'CanceledError') {
        console.info('[GEMINI] Request aborted by user.');
        return null; // Stop gracefully
      }

      const status = error.response ? error.response.status : null;
      console.error(`[GEMINI-API-ERROR] Attempt ${attempt + 1} failed. Status: ${status || 'Unknown'}`);

      // Retry on 429/503
      if (status === 429 || status === 503) {
        attempt++;
        if (attempt <= MAX_RETRIES) {
          const delay = Math.pow(2, attempt - 1) * 1000 + Math.random() * 500;
          console.warn(`[GEMINI] Rate limit/Server error. Retrying in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        }
      }

      console.error('[GEMINI-API-ERROR] Final failure:', error.message);

      if (status === 429) {
        const rateLimitMessage = "I've reached my usage limit for the moment. Please wait a minute before asking again.";
        if (mode === 'chat') return rateLimitMessage;
        return JSON.stringify({ type: 'general', userInput: command, response: rateLimitMessage });
      }

      const fallbackMsg = 'I apologize, I am having trouble connecting to my AI service. Please try again.';
      if (mode === 'chat') return fallbackMsg;
      return JSON.stringify({ type: 'general', userInput: command, response: fallbackMsg });
    }
  }
}

export default geminiResponse;