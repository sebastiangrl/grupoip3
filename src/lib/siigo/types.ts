// SIIGO API Types based on official documentation

export interface SiigoConfig {
  username: string;
  accessKey: string;
  partnerId: string;
  baseUrl?: string;
}

export interface SiigoAuthResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number; // 86400 seconds (24 hours)
  scope: string;
}

export interface SiigoCustomer {
  id: string;
  identification: string;
  name: string[];
  active: boolean;
  address?: {
    city?: {
      city_name: string;
      state_name: string;
    };
  };
  metadata?: {
    created: string;
  };
}

export interface SiigoInvoice {
  id: string;
  number: number;
  name: string;
  date: string;
  customer: {
    id: string;
    identification: string;
  };
  cost_center?: number;
  total: number;
  balance: number;
  items: SiigoInvoiceItem[];
  retentions?: SiigoRetention[];
  metadata?: {
    created: string;
    updated: string;
  };
}

export interface SiigoInvoiceItem {
  code: string;
  quantity: number;
  price: number;
  description: string;
  taxes: SiigoTax[];
  total: number;
}

export interface SiigoTax {
  name: string;
  percentage: number;
  value: number;
}

export interface SiigoRetention {
  name: string;
  percentage: number;
  value: number;
}

export interface SiigoProduct {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: string;
  price?: number;
  active: boolean;
  metadata?: {
    created: string;
  };
}

// Purchase Invoice Structure (For CXP Dashboard)
export interface SiigoPurchase {
  id: string;
  number: number;
  date: string;
  due_date?: string;
  vendor: {
    id: string;
    identification: string;
    name: string;
  };
  total: number;
  balance: number;
  items: Array<{
    description: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

export interface SiigoPaginatedResponse<T> {
  pagination: {
    page: number;
    page_size: number;
    total_results: number;
  };
  results: T[];
}

export interface SiigoApiError {
  error: string;
  message: string;
  details?: any;
}

// Accounting specific types
export interface SiigoAccount {
  id: string;
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  level: number;
  parent_id?: string;
  active: boolean;
}

export interface SiigoTrialBalanceEntry {
  account: SiigoAccount;
  initial_balance: number;
  debit_movement: number;
  credit_movement: number;
  final_balance: number;
}

export interface SiigoJournalEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  total: number;
  entries: SiigoJournalItem[];
}

export interface SiigoJournalItem {
  account_id: string;
  description: string;
  debit: number;
  credit: number;
}

// Date filter interface
export interface SiigoDateFilter {
  start?: string; // YYYY-MM-DD format
  end?: string;   // YYYY-MM-DD format
}

// Company filters for API calls
export interface CompanyFilters {
  dateRange: {
    start: string;
    end: string;
  };
}
