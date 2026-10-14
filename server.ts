import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Routes FIRST
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { activityName, category, destination, customPrompt } = req.body;
    if (!activityName) {
      res.status(400).json({ error: "activityName is required" });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `Generate luxurious, Aman Resorts / Singita / Condé Nast Traveller style descriptions for an African travel experience:
- Name: ${activityName}
- Category: ${category || "General Excursion"}
- Destination: ${destination || "Southern Africa"}
${customPrompt ? `- Custom Instruction: ${customPrompt}` : ""}

Please craft highly detailed, evocative, sensory descriptions suited for high-net-worth travellers. Create different versions:
1. Luxury Description: Beautiful, sensory, long editorial prose paragraphs (not bullets). Focus on history, culture, atmosphere, interesting facts, and local flavor.
2. Short Description: A single punchy, inspiring paragraph.
3. SEO Description: A concise, catchy marketing version.
4. Family Version: Tailored for multi-generational families, safety, comfort, and interactive engagement.
5. Adventure Version: Energetic, focused on thrills, photography, and raw exploration.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            luxuryDescription: {
              type: Type.STRING,
              description: "The primary, long, detailed Aman-style sensory editorial prose description (2-3 paragraphs).",
            },
            shortDescription: {
              type: Type.STRING,
              description: "A single, highly evocative, inspiring paragraph.",
            },
            seoDescription: {
              type: Type.STRING,
              description: "A concise and elegant marketing hook.",
            },
            familyDescription: {
              type: Type.STRING,
              description: "A version emphasizing safety, fun, and connection for families with children or grandparents.",
            },
            adventureDescription: {
              type: Type.STRING,
              description: "A high-energy version focusing on adrenaline, photography, wildlife, or scenic grandeur.",
            },
          },
          required: ["luxuryDescription", "shortDescription", "seoDescription", "familyDescription", "adventureDescription"],
        },
      },
    });

    const data = JSON.parse(response.text?.trim() || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate description" });
  }
});

app.post("/api/gemini/parse-itinerary", async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || !rawText.trim()) {
      res.status(400).json({ error: "rawText is required" });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `You are a specialist Travel Operations parser for Viemma Tours (Bespoke Southern Africa Luxury Travel OS).
Transform the provided travel brief, email, or unformatted itinerary into a strict JSON payload matching the "viemma-itinerary-v1" schema.

Raw travel text:
${rawText}

Instructions:
1. Extract any client info, travellers, flights, accommodations/hotels, transfers, activities, and drivers found.
2. If certain sections (e.g. drivers, flights, or accommodations) are not present in the source text, omit them or provide empty arrays. Do NOT invent fake data.
3. For travellers, do NOT assume a missing age is Adult; leave age empty or 'Adult' only if known. Do NOT designate lead traveller unless explicitly noted.
4. Output strict JSON matching the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Itinerary Parsing Error:", error);
    res.status(500).json({ error: error.message || "Failed to parse itinerary text with Gemini" });
  }
});

// Vite middleware setup
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode serving static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
