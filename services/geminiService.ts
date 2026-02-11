import { GoogleGenAI, Type } from "@google/genai";
import { ScanResult } from '../types';

// Helper to convert file to Base64
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const parseSlipWithGemini = async (file: File): Promise<ScanResult> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key is missing");
    }

    const ai = new GoogleGenAI({ apiKey });
    const base64Data = await fileToGenerativePart(file);

    const prompt = `
      Analyze this image of a receipt/slip. 
      Extract the following information:
      1. Merchant Name (or 'Unknown' if not found)
      2. Total Amount (number only)
      3. Date (in YYYY-MM-DD format, use today if not found)
      4. Category (Choose one: 'Food', 'Transport', 'Office', 'Utilities', 'Entertainment', 'Other')
      5. List of items purchased (simplified)
      
      Return JSON only.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: file.type,
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            category: { type: Type.STRING },
            items: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const result = JSON.parse(text) as ScanResult;
    
    // Fallback/Validation
    if (!result.date) result.date = new Date().toISOString().split('T')[0];
    if (!result.merchant) result.merchant = "ไม่ระบุร้านค้า";
    if (!result.category) result.category = "Other";
    
    return result;

  } catch (error) {
    console.error("Gemini Scan Error:", error);
    // Return a fallback so the app doesn't crash
    return {
      merchant: "Error Scanning",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      category: "Other",
      items: []
    };
  }
};