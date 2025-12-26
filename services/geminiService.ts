
import { api } from './apiService';
import { Transaction, TransactionType } from "../types";

/**
 * Extracts transaction data from email text using API endpoint (which internally uses Gemini).
 */
export const extractTransactionsFromEmail = async (emailText: string): Promise<Transaction[]> => {
  // Use the API endpoint instead of calling Gemini directly
  return api.extractTransactionsFromEmail(emailText, false);
};
