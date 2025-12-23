
import { EmailData } from "../types";

/**
 * Simulation of Gmail API retrieval.
 * In production, this would use the user's OAuth token to query the Gmail API.
 */
export const fetchTodayEmails = async (senders: string[], dateFrom?: string, dateTo?: string): Promise<EmailData[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  const today = new Date().toISOString().split('T')[0];

  // Mocked email database focusing on the requested sender
  const allMockEmails = [
    {
      sender: 'credit_cards@icicibank.com',
      id: "icici_001",
      date: today,
      snippet: "Transaction alert: INR 2,500.00 spent on your ICICI Bank Credit Card",
      body: `Dear Customer, your ICICI Bank Credit Card XX1234 has been debited for INR 2,500.00 at AMAZON INDIA on ${today}. Info: CMS*AMZN. If this was not done by you, call 1800 1080.`
    },
    {
      sender: 'credit_cards@icicibank.com',
      id: "icici_002",
      date: today,
      snippet: "Transaction alert: INR 450.00 spent on your ICICI Bank Credit Card",
      body: `Transaction Alert: You have spent INR 450.00 on ICICI Bank Card XX4321 at ZOMATO on ${today}. Ref no: 998877.`
    },
    {
      sender: 'credit_cards@icicibank.com',
      id: "icici_003",
      date: today,
      snippet: "Payment received for your ICICI Bank Credit Card",
      body: `Dear Customer, we have received a payment of INR 15,000.00 towards your ICICI Bank Credit Card XX1234 on ${today}. Your available limit is INR 85,000.00.`
    },
    {
      sender: 'alerts@icicibank.com',
      id: "icici_savings_001",
      date: today,
      snippet: "Savings Account Credit Alert",
      body: `Your ICICI Bank Account XX5678 has been credited with INR 75,000.00 on ${today} by NEFT from GOOGLE IRELAND. Current balance is INR 1,50,000.00.`
    }
  ];

  // Filter based on sender AND date range
  return allMockEmails.filter(email => {
    const matchesSender = senders.length === 0 || senders.includes(email.sender);
    const afterFrom = dateFrom ? email.date >= dateFrom : true;
    const beforeTo = dateTo ? email.date <= dateTo : true;
    return matchesSender && afterFrom && beforeTo;
  });
};

export const syncToExternalApi = async (transactions: any[]): Promise<boolean> => {
  console.log("Syncing to external ledger...", transactions);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true;
};
