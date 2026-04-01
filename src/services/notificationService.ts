import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, StudyNotification, ExamAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateStudyNotificationsAI(profile: UserProfile, analysis?: ExamAnalysis): Promise<StudyNotification[]> {
  const weakTopics = analysis?.weak_topics || [];
  const masteredTopics = profile.masteredTopics || [];

  const prompt = `You are an AI study coach for MDCAT students in Pakistan.
Generate 3 personalized study notifications for the following student profile:

Student Profile:
- Current Streak: ${profile.streakDays} days
- Total Points: ${profile.totalPoints}
- Level: ${profile.level}
- Recently Identified Weak Topics (from latest exam): ${weakTopics.join(', ') || 'None identified yet'}
- Mastered Topics: ${masteredTopics.join(', ') || 'None yet'}
- Last Quiz Completed: ${profile.lastQuizCompletedDate || 'Never'}
- Current Time: ${new Date().toISOString()}

Tasks:
1. Generate a "streak_motivation" notification if the streak is > 0.
2. Generate a "streak_reminder" if they haven't completed a quiz today.
3. Generate a "topic_focus" notification. IF there are weak topics from the latest exam, prioritize suggesting revision for those. Otherwise, suggest high-yield MDCAT topics they haven't mastered yet.
4. Generate a "new_content" notification about a mock test or new practice set.

Requirements:
- Tone: Motivational, encouraging, and slightly urgent for reminders.
- Context: Mention specific MDCAT subjects (Biology, Physics, Chemistry).
- Personalization: If weak topics are provided, the message should specifically mention them and encourage targeted practice.
- Format: Return exactly 3 notifications.

Output format (JSON):
[
  {
    "notification_type": "streak_reminder",
    "title": "Don't break your streak!",
    "message": "You are 2 days into your study streak. Complete today’s quiz to keep it alive.",
    "scheduled_time": "ISO_DATE_STRING"
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              notification_type: { type: Type.STRING, enum: ['streak_reminder', 'streak_motivation', 'new_content', 'topic_focus'] },
              title: { type: Type.STRING },
              message: { type: Type.STRING },
              scheduled_time: { type: Type.STRING }
            },
            required: ["notification_type", "title", "message", "scheduled_time"]
          }
        }
      },
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating notifications:", error);
    return [];
  }
}
