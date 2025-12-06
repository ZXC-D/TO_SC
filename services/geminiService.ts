import { GoogleGenAI } from "@google/genai";

// Safely access env var; polyfill empty string if process is undefined (browser)
const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const generateHolidayWish = async (theme: string): Promise<string> => {
  try {
    // Check if key is missing to fail gracefully
    if (!getApiKey()) {
        console.warn("API Key is missing. Falling back to default message.");
        return "孙畅大王，圣诞节快乐！Merry Christmas";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a short, luxurious, witty, and warm Christmas wish (max 1 sentence) in Simplified Chinese specifically for "孙畅大王" (King Sun Chang). The tone should be opulent and magical.`,
    });

    const text = response.text;
    return text || "孙畅大王，圣诞节快乐！Merry Christmas";
    
  } catch (error) {
    console.error("AI Generation failed:", error);
    return "孙畅大王，圣诞节快乐！Merry Christmas";
  }
};