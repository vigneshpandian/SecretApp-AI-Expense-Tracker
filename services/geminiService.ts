
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from "../types";

// Always use the process.env.API_KEY directly for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractTransactionsFromEmail = async (emailText: string): Promise<Transaction[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract transaction details from this bank notification email: "${emailText}"`,
      config: {
        systemInstruction: `You are an expert financial data analyst. 
        Analyze bank transaction alert emails. 
        Extract: Transaction Date, Amount (number), Type ('Credit' | 'Debit'), Description, and a likely Category (e.g., Shopping, Food, Utilities, Travel, Health, Salary, Other).
        The description MUST have the value 'debited to the user' or a relevant summary if it is a credit.
        Important: Return ONLY a JSON array of objects.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              transactionDate: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              type: { type: Type.STRING, enum: ['Credit', 'Debit'] },
              description: { type: Type.STRING },
              category: { type: Type.STRING, description: "One of: Shopping, Food & Dining, Salary, Groceries, Utilities, Travel, Entertainment, Healthcare, Other" }
            },
            required: ["transactionDate", "amount", "type", "description", "category"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const parsed = JSON.parse(text);
    return parsed.map((item: any) => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending'
    }));
  } catch (error) {
    console.error("Error extracting data via Gemini:", error);
    return [];
  }
};
