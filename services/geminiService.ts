
import { GoogleGenAI } from "@google/genai";
import { AttackLog } from "../types";

const getClient = () => {
    // Check if API key exists. In a real app, this would be handled by env vars strictly.
    // For this demo, we assume process.env.API_KEY is available.
    if (!process.env.API_KEY) {
        console.warn("API Key is missing for Gemini Service");
        return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeAttackLog = async (log: AttackLog): Promise<string> => {
    const ai = getClient();
    if (!ai) return "Error: API Key not configured. Unable to access PRTS analysis module.";

    try {
        const prompt = `
        You are a cybersecurity expert AI integrated into a Honeypot System.
        Analyze the following attack log entry and explain the potential intent, the nature of the payload, and recommendations for mitigation.
        Keep the tone technical, concise, and professional, fitting a tactical dashboard.

        Log Data:
        Source IP: ${log.sourceIp}
        Location: ${log.location}
        Method: ${log.method}
        Payload: ${log.payload}
        Severity: ${log.severity}
        `;

        // Fixed: Updated model name to 'gemini-3-flash-preview' for basic text/reasoning tasks
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                systemInstruction: "You are PRTS, an automated tactical analysis system. Output should be structured, using bullet points where necessary.",
            }
        });

        // Fixed: Accessing .text property directly instead of text() method
        return response.text || "Analysis complete. No specific insights generated.";
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        return "System Error: Unable to establish connection with analysis module.";
    }
};
