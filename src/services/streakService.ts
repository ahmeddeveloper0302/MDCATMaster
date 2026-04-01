import { GoogleGenAI, Type } from "@google/genai";
import { StreakUpdate } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const updateStreakAI = async (
  lastLoginDate: string,
  streakDays: number,
  quizCompletedToday: boolean
): Promise<StreakUpdate> => {
  const prompt = `
    You are an AI that manages a daily study streak for MDCAT students.
    
    Input:
    - Last login date: ${lastLoginDate}
    - Number of consecutive study days: ${streakDays}
    - Daily quiz completion status: ${quizCompletedToday}
    
    Tasks:
    1. Update the streak based on today’s activity
    2. Assign reward points for streak continuation
    3. Identify if the streak is broken and reset accordingly
    4. Provide a motivational message for the student
    
    Rules:
    - If today is the day after lastLoginDate, increment streak if quizCompletedToday is true.
    - If today is more than one day after lastLoginDate, streak is broken.
    - If today is the same as lastLoginDate, streak remains same but quiz status might update.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          current_streak_days: { type: Type.INTEGER },
          reward_points_earned: { type: Type.INTEGER },
          streak_broken: { type: Type.BOOLEAN },
          message: { type: Type.STRING },
        },
        required: ["current_streak_days", "reward_points_earned", "streak_broken", "message"],
      },
    },
  });

  return JSON.parse(response.text);
};
