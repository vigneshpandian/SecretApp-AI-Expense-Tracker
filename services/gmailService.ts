
import { EmailData } from "../types";

/**
 * In a real-world scenario, the backend would handle the Gmail API queries
 * using the provided OAuth token and the q parameter.
 */

export const fetchTodayEmails = async (senders: string[], dateFrom?: string, dateTo?: string): Promise<EmailData[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  const today = new Date().toISOString().split('T')[0];

  // Mocked email database
  const allMockEmails = [
    {
      sender: 'credit_cards@icicibank.com',
      id: "msg_001",
      date: "2024-05-20",
      snippet: "Transaction alert: INR 2,500.00 spent on your ICICI Bank Credit Card",
      body: `Dear Customer, your ICICI Bank Credit Card XX1234 has been debited for INR 2,500.00 at AMAZON INDIA on 2024-05-20. Info: CMS*AMZN.`
    },
    {
      sender: 'credit_cards@icicibank.com',
      id: "msg_001_today",
      date: today,
      snippet: "Transaction alert: INR 1,200.00 spent on your ICICI Bank Credit Card",
      body: `Dear Customer, your ICICI Bank Credit Card XX1234 has been debited for INR 1,200.00 at STARBUCKS on ${today}. Info: POS*SBUX.`
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

  // Filter based on sender AND date range
  return allMockEmails.filter(email => {
    const matchesSender = senders.includes(email.sender);
    const afterFrom = dateFrom ? email.date >= dateFrom : true;
    const beforeTo = dateTo ? email.date <= dateTo : true;
    return matchesSender && afterFrom && beforeTo;
  });
};

export const syncToExternalApi = async (transactions: any[]): Promise<boolean> => {
  console.log("Syncing to API endpoint...", transactions);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true;
};
