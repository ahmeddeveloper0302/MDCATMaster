import { GoogleGenAI, Type } from "@google/genai";
import { GamificationUpdate } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const updateGamificationAI = async (
  totalAttempted: number,
  totalCorrect: number,
  streakDays: number,
  masteredTopics: string[]
): Promise<GamificationUpdate> => {
  const prompt = `
    You are an AI that assigns badges and levels to MDCAT students based on their performance.
    
    Input:
    - Total MCQs attempted: ${totalAttempted}
    - Total correct answers: ${totalCorrect}
    - Streak days: ${streakDays}
    - Topics mastered: ${masteredTopics.join(", ")}
    
    Tasks:
    1. Assign level based on experience points (XP). 1 correct answer = 10 XP. 1 attempted = 2 XP.
    2. Award badges for milestones (e.g., 50 correct answers, 7-day streak, 5 topics mastered).
    3. Provide description of each earned badge.
    4. Suggest next achievable badge.
    
    Rules:
    - Level 1: 0-500 XP
    - Level 2: 501-1500 XP
    - Level 3: 1501-3000 XP
    - Level 4: 3001-5000 XP
    - Level 5: 5001+ XP
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          level: { type: Type.INTEGER },
          XP: { type: Type.INTEGER },
          earned_badges: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          next_badge: { type: Type.STRING },
          message: { type: Type.STRING },
        },
        required: ["level", "XP", "earned_badges", "next_badge", "message"],
      },
    },
  });

  return JSON.parse(response.text);
};
