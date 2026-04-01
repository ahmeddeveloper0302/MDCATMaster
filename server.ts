import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to get Gemini AI instance lazily
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is not configured. Please set it in the Secrets panel.");
  }
  return new GoogleGenAI({ apiKey });
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

// API Routes
app.post("/api/gemini/generate", async (req, res) => {
  const { prompt, schema } = req.body;
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema || MCQ_SCHEMA,
      },
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    const errorMessage = error.message || "Failed to generate content from Gemini";
    res.status(500).json({ error: errorMessage });
  }
});

app.post("/api/gemini/analyze", async (req, res) => {
  const { prompt } = req.body;
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

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Gemini Analysis Error details:", error);
    const errorMessage = error.message || "Failed to analyze results";
    res.status(500).json({ error: errorMessage });
  }
});

// Vite middleware setup
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
