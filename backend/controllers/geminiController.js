import { GoogleGenAI } from '@google/genai';

let aiClient = null;

/**
 * Lazily initializes the Google GenAI client to prevent startup crashes when the API key is missing.
 */
function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

/**
 * Controller: Generate context-aware retro gaming hints, guild names, or crafting assistance.
 */
export async function generateGameHint(req, res, next) {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();
    
    // Contextual system instruction matching Pixel Realms' aesthetic
    const systemInstruction = `You are the Pixel Realms AI Oracle, a helpful, wise, and atmospheric retro gaming assistant. 
The user is browsing the Pixel Realms Network portal (a multiplayer sandbox gaming server filled with mining, crafting, survival, and PvP). 
Generate short, atmospheric responses themed around blocks, ores, retro pixel aesthetics, or fantasy RPG concepts. Keep answers brief and engaging.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const reply = response.text;
    return res.json({ success: true, reply });
  } catch (err) {
    // Graceful error state if the key is missing or invalid
    if (err.message && err.message.includes('GEMINI_API_KEY')) {
      console.warn('[GEMINI] Gemini API key not configured. Returning atmospheric placeholder.');
      return res.json({
        success: true,
        reply: "🔮 [Pixel Realms Oracle]: The ancient portals of intelligence remain sealed. Configure your GEMINI_API_KEY in the Settings > Secrets panel to unlock authentic AI wisdom!",
        unconfigured: true
      });
    }
    next(err);
  }
}
