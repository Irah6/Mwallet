import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: Date;
  raw?: string;
  category: string;
  account?: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  color: string;
  type: 'bank' | 'credit';
  limit?: number;
}

const initialAccounts: Account[] = [
  { id: '1', name: 'Primary Bank', balance: 4500.75, color: '#4A90E2', type: 'bank' },
  { id: '2', name: 'Savings Account', balance: 12030.0, color: '#50E3C2', type: 'bank' },
  { id: '3', name: 'Credit Card', balance: -750.5, color: '#E35050', type: 'credit', limit: 2000 },
];

const initialTransactions: Transaction[] = [
  { id: '1', description: 'Netflix Subscription', amount: 15.49, type: 'expense', date: new Date(), raw: 'SMS not available', category: 'Entertainment', account: 'Credit Card' },
  { id: '2', description: 'Salary', amount: 2000.0, type: 'income', date: new Date(), raw: 'SMS not available', category: 'Income', account: 'Primary Bank' },
  { id: '3', description: 'Groceries at Walmart', amount: 120.34, type: 'expense', date: new Date(), raw: 'SMS not available', category: 'Shopping', account: 'Credit Card' },
  { id: '4', description: 'Gas Station', amount: 45.5, type: 'expense', date: new Date(), raw: 'SMS not available', category: 'Transport', account: 'Primary Bank' },
  { id: '5', description: 'Etsy Payout', amount: 85.0, type: 'income', date: new Date(), raw: 'SMS not available', category: 'Income', account: 'Primary Bank' },
  { id: '6', description: 'Dinner with friends', amount: 64.20, type: 'expense', date: new Date(), raw: 'SMS not available', category: 'Food', account: 'Credit Card' },
];

interface GlobalContextType {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);

  return (
    <GlobalContext.Provider value={{ transactions, setTransactions, accounts, setAccounts }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
};