
import { GoogleGenAI } from "@google/genai";
import { AttackLog } from "../types";

// Generic AI Service Configuration
const AI_CONFIG = {
    provider: "google", // Can be extended to other providers (OpenAI, etc.)
    model: "gemini-3-flash-preview",
    systemInstruction: "You are PRTS, an automated tactical analysis system. Output should be structured, using bullet points where necessary."
};

const getAIClient = () => {
    // In a real app, this would be handled by env vars strictly.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("AI API Key is missing. Analysis module will be disabled.");
        return null;
    }
    
    if (AI_CONFIG.provider === "google") {
        return new GoogleGenAI({ apiKey });
    }
    return null;
};

/**
 * Analyzes an attack log using the configured AI provider.
 */
export const analyzeAttackLog = async (log: AttackLog): Promise<string> => {
    const client = getAIClient();
    if (!client) return "Error: AI module not configured. Unable to access PRTS analysis module.";

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

        if (AI_CONFIG.provider === "google") {
            const response = await (client as GoogleGenAI).models.generateContent({
                model: AI_CONFIG.model,
                contents: prompt,
                config: {
                    systemInstruction: AI_CONFIG.systemInstruction,
                }
            });
            return response.text || "Analysis complete. No specific insights generated.";
        }
        
        return "Error: AI Provider not supported.";
    } catch (error) {
        console.error("AI Analysis Error:", error);
        return "System Error: Unable to establish connection with analysis module.";
    }
};

/**
 * Generic authenticated fetch helper that returns JSON data directly.
 * Used by various components for backend communication.
 */
export const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('prts_token');
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
    
    try {
        const response = await fetch(url, { ...options, headers });
        if (response.ok) {
            return await response.json();
        }
        if (response.status === 401) {
            localStorage.removeItem('prts_token');
            localStorage.removeItem('prts_user');
        }
        return null;
    } catch (error) {
        console.error("Fetch error:", error);
        return null;
    }
};
