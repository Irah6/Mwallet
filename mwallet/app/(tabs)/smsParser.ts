export interface ParsedTransaction {
  id: string;
  amount: number;
  type: 'expense' | 'income';
  description: string; // Merchant or recipient
  date: Date;
  raw: string; // Original SMS body
  account?: string; // e.g., 'Credit Card xx5313'
}

type Parser = (body: string) => Omit<ParsedTransaction, 'id' | 'raw' | 'date'> | null;

// Regex-based parsers for different banks

const sliceParser: Parser = (body) => {
  const match = body.match(/Rs\.\s*([\d,]+\.?\d*)\s+spent on your credit card (xx\d+) at (.*?)\./);
  if (!match) return null;

  return {
    amount: parseFloat(match[1].replace(/,/g, '')),
    type: 'expense',
    description: match[3].trim(),
    account: `slice card ${match[2]}`,
  };
};

const federalBankParser: Parser = (body) => {
  const match = body.match(/Rs\s*([\d,]+\.?\d*)\s+sent via UPI.*?to (.*?)\.Ref:/);
  if (!match) return null;

  return {
    amount: parseFloat(match[1].replace(/,/g, '')),
    type: 'expense',
    description: match[2].trim(),
    account: 'Federal Bank UPI',
  };
};

const hdfcBankParser: Parser = (body) => {
  const match = body.match(/Spent Rs\.([\d,]+\.?\d*) On HDFC Bank Card (\d+) At (.*?) On/);
  if (!match) return null;

  return {
    amount: parseFloat(match[1].replace(/,/g, '')),
    type: 'expense',
    description: match[3].trim(),
    account: `HDFC Card xx${match[2]}`,
  };
};

// A registry of senders and their corresponding parsers
const parserRegistry: { [key: string]: Parser } = {
  'SLCBNK-S': sliceParser,
  'FEDBNK-S': federalBankParser,
  'HDFCBK-S': hdfcBankParser,
};

export const parseSms = (sms: any): ParsedTransaction | null => {
  // Safety check to ensure the SMS object is valid
  if (!sms || !sms.address || !sms.body) return null;

  // The sender ID format is like 'xy-HDFCBK-S'. We extract the core part safely.
  const senderParts = sms.address.split('-');
  const senderId = senderParts.length > 1 ? senderParts[1] : sms.address;

  const parser = parserRegistry[senderId];

  if (parser) {
    const parsedData = parser(sms.body);
    if (parsedData) {
      return {
        ...parsedData,
        id: `${sms.date}-${parsedData.amount}`, // Create a semi-unique ID
        raw: sms.body,
        date: new Date(sms.date),
      };
    }
  }
  return null;
};