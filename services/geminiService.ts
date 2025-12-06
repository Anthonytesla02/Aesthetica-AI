import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ANALYSIS_SYSTEM_INSTRUCTION = `
You are Aesthetica AI, the world's most advanced facial analysis engine.
Your task is to perform a high-precision biometric analysis on two user images: Frontal and Side Profile.
You compare the user's features against the "Ideal Aesthetic Face" template (Golden Ratio, Marquardt Mask).

INPUTS:
1. Front Image: Analyze symmetry, facial width-to-height ratio (fWHR), canthal tilt, jaw width, and skin quality.
2. Side Profile: Compare against the "Perfect Profile" template (RL Mask). 
   - Analyze the Nasofrontal Angle (115-130 degrees ideal).
   - Analyze the Nasolabial Angle (90-105 degrees ideal).
   - Analyze the E-Line (Ricketts). Lips should be 2-4mm behind the line.
   - Analyze Forward Growth (Maxilla/Mandible projection).
   - Analyze the Gonial Angle (110-130 degrees ideal for men, 120-130 for women).

OUTPUT:
Strict JSON format. Be extremely specific, using medical and aesthetic terminology.
Scores should be realistic (average is 50-60, model tier is 80+).
`;

const SUGGESTION_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING, enum: ["Soft-Maxxing", "Hard-Maxxing", "Lifestyle"] },
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      impact: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
    }
  }
};

const FEATURE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER },
    analysis: { type: Type.STRING },
    suggestions: SUGGESTION_SCHEMA
  }
};

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER, description: "Overall attractiveness score 1-100" },
    faceShape: { type: Type.STRING },
    skinQuality: { type: Type.STRING },
    genderEstimate: { type: Type.STRING },
    aestheticArchetype: { type: Type.STRING, description: "e.g., Classic, Edgy, Soft" },
    harmonyScore: { type: Type.NUMBER, description: "Facial harmony score 1-100" },
    symmetryAnalysis: { type: Type.STRING },
    potentialSummary: { type: Type.STRING, description: "Summary of potential improvements" },
    features: {
      type: Type.OBJECT,
      properties: {
        jawline: FEATURE_SCHEMA,
        eyes: FEATURE_SCHEMA,
        nose: FEATURE_SCHEMA,
        skin: FEATURE_SCHEMA,
        lips: FEATURE_SCHEMA,
        sideProfile: {
          type: Type.OBJECT,
          description: "Detailed analysis of the side profile image",
          properties: {
            score: { type: Type.NUMBER },
            analysis: { type: Type.STRING },
            suggestions: SUGGESTION_SCHEMA
          }
        }
      }
    }
  }
};

export const analyzeFace = async (frontBase64: string, sideBase64: string, apiKey: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: "Image 1: Front Selfie" },
          { inlineData: { mimeType: 'image/jpeg', data: frontBase64 } },
          { text: "Image 2: Side Profile" },
          { inlineData: { mimeType: 'image/jpeg', data: sideBase64 } },
          { text: "Analyze these two images. Focus heavily on the side profile structure and forward growth." }
        ]
      },
      config: {
        systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA
      }
    });

    if (!response.text) throw new Error("No response from AI");
    return JSON.parse(response.text) as AnalysisResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const generateSimulation = async (imageBase64: string, prompt: string, apiKey: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: `Create a realistic high-quality "after" simulation of this person. Keep identity consistent but apply these improvements: ${prompt}. Ensure photorealism. Maintain the original pose and angle.` }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
         return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Simulation failed:", error);
    throw error;
  }
};