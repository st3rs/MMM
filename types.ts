export type TransactionType = 'income' | 'expense';
export type Ownership = 'personal' | 'group';

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  type: TransactionType;
  ownership: Ownership;
  groupId?: string; // Optional, exists if ownership is 'group'
  category?: string;
  items?: string[];
  note?: string;
  slipUrl?: string; // Base64 or URL
}

export interface Group {
  id: string;
  name: string;
  budget: number;
  members: number; // Mock member count
  icon: string;
}

export type View = 'dashboard' | 'add' | 'groups' | 'report' | 'profile';

export interface ScanResult {
  merchant: string;
  amount: number;
  date: string;
  category: string;
  items: string[];
}