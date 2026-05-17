/**
 * EduTrack Backend Server
 * 
 * This server provides:
 * 1. AI Analysis API via Google Gemini Pro.
 * 2. Static file serving for the React frontend (Vite).
 * 3. Health check endpoints.
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

/**
 * Initializes and starts the Express server with Vite middleware support
 */
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse large JSON payloads (specifically for long student lists)
  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI SDK
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  /**
   * AI Insights API Endpoint
   * Takes student data and produces a structured analysis using Gemini
   */
  app.post("/api/analyze", async (req, res) => {
    try {
      const { studentData } = req.body;
      
      if (!studentData || !Array.isArray(studentData)) {
        return res.status(400).json({ error: "Invalid student data provided." });
      }

      // Summarize data to fit within prompt context window effectively
      // We pass the top 40 records as a representative sample with subject data
      const summary = studentData.slice(0, 40).map(s => {
        const subjectString = s.subjects ? s.subjects.map(subj => `${subj.subject}: ${subj.marks}`).join(", ") : "N/A";
        return `ID: ${s.studentId}, Att: ${s.attendance}%, Internal: ${s.internalMarks}, Assignment: ${s.assignmentMarks}, Result: ${s.finalResult}, Subjects: [${subjectString}]`;
      }).join("\n");

      // System prompt for the analyst role
      const prompt = `
        You are a Student Academic Analyst. Analyze the following student academic data and provide:
        1. A high-level summary of overall performance.
        2. Identify specific trends (e.g., correlation between attendance and marks).
        3. List of Student IDs for students "At-Risk" (low attendance AND low marks).
        4. Recommendations for improvement.
        5. Subject-Specific Insights: For each core subject identified in the data, provide:
           - Performance Level (High/Medium/Low) based on average marks.
           - A specific trend observation for that subject.
           - A short prediction/warning for that subject (e.g., "Difficulty curve increasing").
        6. Prediction: Based on current trends, identify students specifically likely to fail in the NEXT semester. 
           Provide their Student ID, the primary reason for this prediction, and a probability percentage (0-100%).
        
        Data Sample (Top 40 records):
        ${summary}
        
        Format the response in structured JSON with this schema:
        {
          "summary": string,
          "trends": string[],
          "atRiskStudentIds": string[],
          "recommendations": string[],
          "subjectInsights": [
            { "subjectName": string, "performanceLevel": "High" | "Medium" | "Low", "trend": string, "prediction": string }
          ],
          "nextSemesterFailurePrediction": [
            { "studentId": string, "reason": string, "probability": string }
          ]
        }
      `;

      // Generate content with schema-controlled output for reliable parsing
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", // Using the robust flash model for quick insights
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              trends: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              atRiskStudentIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              subjectInsights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    subjectName: { type: Type.STRING },
                    performanceLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                    trend: { type: Type.STRING },
                    prediction: { type: Type.STRING }
                  },
                  required: ["subjectName", "performanceLevel", "trend", "prediction"]
                }
              },
              nextSemesterFailurePrediction: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    studentId: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    probability: { type: Type.STRING }
                  },
                  required: ["studentId", "reason", "probability"]
                }
              }
            },
            required: ["summary", "trends", "atRiskStudentIds", "recommendations", "subjectInsights", "nextSemesterFailurePrediction"]
          }
        }
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      res.status(500).json({ error: "Failed to generate AI insights." });
    }
  });

  // Basic health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Handle environment-based routing
  if (process.env.NODE_ENV !== "production") {
    // In development mode, use Vite middleware for Hot Module Replacement and TypeScript transpilation
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve built static files from the dist directory
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind to 0.0.0.0 for containerized deployment (Cloud Run compatibility)
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduTrack Server running on http://localhost:${PORT}`);
  });
}

startServer();
