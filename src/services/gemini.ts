import { GoogleGenAI, Type } from "@google/genai";
import { MCQ, Subject, Difficulty, UserAnswer, ExamAnalysis } from "../types";

// Initialize Gemini AI lazily
let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Please ensure it is set in the environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

const MCQ_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      question: { type: Type.STRING },
      options: {
        type: Type.OBJECT,
        properties: {
          A: { type: Type.STRING },
          B: { type: Type.STRING },
          C: { type: Type.STRING },
          D: { type: Type.STRING },
        },
        required: ["A", "B", "C", "D"],
      },
      answer: { type: Type.STRING, enum: ["A", "B", "C", "D"] },
      explanation: { type: Type.STRING },
      pastPaperReference: { type: Type.STRING },
      isRepeatedConcept: { type: Type.BOOLEAN },
      topic: { type: Type.STRING },
    },
    required: ["id", "question", "options", "answer", "explanation", "pastPaperReference", "isRepeatedConcept", "topic"],
  },
};

export async function generateMCQs(subject: Subject, topic: string, difficulty: Difficulty): Promise<MCQ[]> {
  const prompt = `You are an expert MDCAT exam paper setter in Pakistan with deep knowledge of past papers (UHS, SZABMU, DUHS, PMC/PMDC).
Generate 10 high-quality MDCAT-level MCQs for the subject: ${subject} and topic: ${topic}.

Difficulty Level: ${difficulty}

Requirements:
- Each MCQ must be based on concepts and patterns commonly tested in past MDCAT exams.
- Adapt or rephrase real past paper questions (do NOT copy verbatim).
- Target Difficulty: ${difficulty}.
- Questions should test concepts, not just rote memorization.
- Ensure scientific accuracy.
- For each MCQ, provide a detailed explanation (4-6 lines) that explains the correct answer and why other options are incorrect if applicable.
- Provide a specific past paper reference including the year and exam board (e.g., "UHS 2019", "SZABMU 2021", "PMC 2022", "DUHS 2018").
- Set 'isRepeatedConcept' to true if the core concept tested in the MCQ has appeared multiple times in past MDCAT exams (UHS, SZABMU, PMC/PMDC), otherwise set it to false.
- Set 'topic' to the specific sub-topic name (e.g., "Cell Structure", "Enzymes", "Circular Motion").`;

  return executeGeneration(prompt);
}

export async function generateFullExam(subject: Subject, difficulty: Difficulty, count: number): Promise<MCQ[]> {
  const prompt = `You are an expert MDCAT exam paper setter in Pakistan.
Generate a full-length MDCAT exam section for the subject: ${subject}.
Number of MCQs: ${count}
Difficulty Level: ${difficulty}

Requirements:
- Distribute questions across the entire syllabus of ${subject} as per the latest PMC/PMDC guidelines.
- Each MCQ must have 4 options (A-D) and only ONE correct answer.
- Include 4-6 lines detailed explanation for each answer.
- Include a specific past paper reference (e.g., "UHS 2019", "SZABMU 2021", "PMC 2022").
- Set 'isRepeatedConcept' to true if the core concept is high-yield and frequently repeated in past papers.
- Set 'topic' to the specific sub-topic name for each question.
- Maintain exam-like pattern and question distribution (e.g., for Biology, include Cell Biology, Genetics, Evolution, etc.).`;

  return executeGeneration(prompt);
}

export async function analyzeExamResults(answers: UserAnswer[]): Promise<ExamAnalysis> {
  const prompt = `You are an AI that analyzes MDCAT exam results for a student.
Input: 
- List of MCQs answered by the student with:
   - Question ID
   - User answer
   - Correct answer
   - Subject
   - Topic
   - Time spent (seconds)

Data:
${JSON.stringify(answers, null, 2)}

Tasks:
1. Calculate accuracy % per subject (if multiple subjects are present, otherwise just the one).
2. Identify top 3 weak topics (lowest accuracy).
3. Calculate time spent per question and flag questions taking unusually long (e.g., > 90s for science, > 45s for English).
4. Provide a progress summary:
   - Subject-wise performance
   - Weak topics
   - Suggestions for improvement

Output format (JSON):
{
  "accuracy": {"Biology": 70, "Physics": 65, ...},
  "weak_topics": ["Genetics", "Thermodynamics", ...],
  "time_per_question": {"Q1": 45, "Q2": 30, ...},
  "suggestions": ["Revise Genetics", "Practice Thermodynamics MCQs", ...]
}`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Error analyzing results:", error);
    throw error;
  }
}

async function executeGeneration(prompt: string, schema: any = MCQ_SCHEMA): Promise<MCQ[]> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Error generating MCQs:", error);
    throw error;
  }
}

export async function getSuggestedTopics(subject: Subject): Promise<string[]> {
  const prompt = `As an MDCAT expert in Pakistan, provide a list of 12 most common and high-yield topics for the subject: ${subject}. 
Return only the list of topics as a simple array of strings. 
Focus on topics that appear frequently in UHS, SZABMU, and PMDC past papers.`;

  const schema = {
    type: Type.ARRAY,
    items: { type: Type.STRING },
  };

  try {
    return await executeGeneration(prompt, schema) as unknown as string[];
  } catch (error: any) {
    console.error("Error fetching suggested topics:", error);
    throw error;
  }
}
