
import { EmailData } from "../types";

/**
 * In a real-world scenario, you would use the Gmail API list messages method with a 'q' parameter.
 * Example query: "from:(sender1@example.com OR sender2@example.com) after:2024/05/20"
 */

export const fetchTodayEmails = async (senders: string[]): Promise<EmailData[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  const today = new Date().toISOString().split('T')[0];

  // Mocked logic: Filter "database" of emails by selected senders
  const allMockEmails = [
    {
      sender: 'credit_cards@icicibank.com',
      id: "msg_001",
      date: today,
      snippet: "Transaction alert: INR 2,500.00 spent on your ICICI Bank Credit Card",
      body: `Dear Customer, your ICICI Bank Credit Card XX1234 has been debited for INR 2,500.00 at AMAZON INDIA on ${today}. Info: CMS*AMZN.`
    },
    {
      sender: 'alerts@icicibank.com',
      id: "msg_002",
      date: today,
      snippet: "Credit Alert: Your ICICI Bank account has been credited",
      body: `Your ICICI Bank Account XX5678 has been credited with INR 45,000.00 on ${today} by NEFT/Zomato/Salary. Current balance is INR 1,20,450.00.`
    },
    {
      sender: 'shopping@alerts.com',
      id: "msg_003",
      date: today,
      snippet: "You spent 500 at Store",
      body: `Transaction of 500.00 occurred at Store on ${today}. Account debited.`
    }
  ];

  // Only return emails that match the configured senders
  return allMockEmails.filter(email => senders.includes(email.sender));
};

export const syncToExternalApi = async (transactions: any[]): Promise<boolean> => {
  console.log("Syncing to API endpoint...", transactions);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true;
};
