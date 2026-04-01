import { GoogleGenAI, Type } from "@google/genai";
import { RevisionPlan, MCQ } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const generateRevisionPlanAI = async (
  incorrectMcqs: { mcq: MCQ; mistakeCount: number }[]
): Promise<RevisionPlan> => {
  const prompt = `
    You are an AI that generates a revision plan for MDCAT students.
    
    Input:
    - List of incorrect MCQs attempted by the student
    - Number of times each question was answered incorrectly
    
    Data:
    ${incorrectMcqs.map(item => `
      Question ID: ${item.mcq.id}
      Topic: ${item.mcq.topic || 'General'}
      Question: ${item.mcq.question}
      Mistake Count: ${item.mistakeCount}
    `).join('\n')}
    
    Tasks:
    1. Prioritize questions by highest mistake frequency.
    2. Suggest a revision schedule (daily plan, e.g., Day 1, Day 2, etc.).
    3. Include concise explanations for each question focused on why the mistake might have happened or the core concept.
    4. Tag topics for focused review.
    
    Return the plan in the specified JSON format.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          revision_plan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question_id: { type: Type.STRING },
                topic: { type: Type.STRING },
                explanation: { type: Type.STRING },
                review_day: { type: Type.STRING },
              },
              required: ["question_id", "topic", "explanation", "review_day"],
            },
          },
        },
        required: ["revision_plan"],
      },
    },
  });

  return JSON.parse(response.text);
};
