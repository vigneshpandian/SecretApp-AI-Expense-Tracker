
import { Transaction, TransactionType } from "../types";

/**
 * .NET INTEGRATION HINT:
 * Your [HttpPost("extract")] endpoint should return a JSON array 
 * matching this structure:
 * 
 * [
 *   {
 *     "transactionDate": "YYYY-MM-DD",
 *     "amount": 1250.50,
 *     "type": "Debit",
 *     "description": "Amazon India",
 *     "category": "Shopping"
 *   }
 * ]
 */

export const extractTransactionsFromEmail = async (emailText: string): Promise<Transaction[]> => {
  try {
    const token = sessionStorage.getItem('auth_token');
    
    // This calls your future .NET Controller
    const response = await fetch('/api/v1/transactions/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({ emailBody: emailText })
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("Unauthorized: Invalid or expired token.");
      throw new Error(`Backend Proxy Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) return [];

    // Correctly mapping the response to the Transaction type by using TransactionType enum values
    // This fixes the error where string literals "Credit" | "Debit" were not assignable to the enum type
    return data.map((item: any) => ({
      id: item.id || Math.random().toString(36).substring(2, 11),
      transactionDate: item.transactionDate || new Date().toISOString().split('T')[0],
      amount: Number(item.amount) || 0,
      type: item.type === 'Credit' ? TransactionType.CREDIT : TransactionType.DEBIT,
      description: item.description || 'Unknown Transaction',
      category: item.category || 'Uncategorized',
      status: 'pending' as const
    }));
  } catch (error) {
    console.error("Extraction workflow failed:", error);
    // Return empty to allow the UI to handle the empty state gracefully
    return [];
  }
};
