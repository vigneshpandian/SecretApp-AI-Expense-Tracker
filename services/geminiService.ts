
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionType } from "../types";

/**
 * Uses Gemini 3 Flash to extract structured transaction data from ICICI Bank alert emails.
 */
export const extractTransactionsFromEmail = async (emailText: string): Promise<Transaction[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract the transaction details from this ICICI Bank Credit Card alert. 
      Email Content:
      """
      ${emailText}
      """`,
      config: {
        systemInstruction: `You are a financial parsing expert for Indian Bank emails. 
        Focus specifically on ICICI Bank Credit Card alerts. 
        - Look for patterns like "Spent on your ICICI Bank Credit Card XX1234".
        - Identify the Merchant (after 'at' or 'on').
        - Identify the Amount (preceded by 'INR').
        - Identify if it is a 'Spent' (Debit) or 'Refund/Payment' (Credit).
        - Map to categories: Shopping, Food, Groceries, Travel, Utilities, Health, Entertainment, Others.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              transactionDate: { type: Type.STRING, description: "YYYY-MM-DD format" },
              amount: { type: Type.NUMBER },
              type: { type: Type.STRING, description: "'Credit' or 'Debit'" },
              description: { type: Type.STRING, description: "The merchant name" },
              category: { type: Type.STRING },
              cardLast4: { type: Type.STRING, description: "The last 4 digits of the card used (e.g. 1234)" }
            },
            required: ["transactionDate", "amount", "type", "description", "category"]
          }
        }
      }
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) return [];

    const extractedData = JSON.parse(jsonStr);
    
    return extractedData.map((item: any) => ({
      id: Math.random().toString(36).substring(2, 11),
      transactionDate: item.transactionDate,
      amount: item.amount,
      type: item.type === 'Credit' ? TransactionType.CREDIT : TransactionType.DEBIT,
      description: item.description,
      category: item.category,
      cardLast4: item.cardLast4,
      status: 'pending' as const
    }));
  } catch (error) {
    console.error("Gemini Extraction failed:", error);
    return [];
  }
};
