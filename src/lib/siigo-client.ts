import { Company } from '@prisma/client';

// Tipos de datos de SIIGO
export interface SiigoCustomer {
  id: string;
  person_type: 'Person' | 'Company';
  id_type: string;
  identification: string;
  name: string[];
  commercial_name?: string;
  branch_office?: number;
  active: boolean;
  vat_responsible: boolean;
  fiscal_responsibilities: Array<{
    code: string;
    name: string;
  }>;
  address: {
    address: string;
    city: {
      city_code: string;
      city_name: string;
      state_code: string;
      state_name: string;
      country_code: string;
      country_name: string;
    };
  };
  phones: Array<{
    indicative: string;
    number: string;
  }>;
  contacts: Array<{
    first_name: string;
    last_name: string;
    email: string;
    phone: {
      indicative: string;
      number: string;
    };
  }>;
}

export interface SiigoInvoice {
  id: string;
  document: {
    id: number;
    name: string;
  };
  number: number;
  name: string;
  date: string;
  customer: {
    identification: string;
    name: string;
  };
  cost_center?: {
    id: number;
    name: string;
  };
  currency: {
    code: string;
    name: string;
  };
  total: number;
  balance: number;
  items: Array<{
    id: string;
    code: string;
    description: string;
    quantity: number;
    price: number;
    total: number;
    taxes: Array<{
      id: string;
      name: string;
      type: string;
      percentage: number;
      value: number;
    }>;
  }>;
  payments: Array<{
    id: string;
    name: string;
    value: number;
    due_date: string;
  }>;
  mail?: {
    send: boolean;
  };
  observations?: string;
  stamp?: {
    send: boolean;
  };
}

export interface SiigoProduct {
  id: string;
  code: string;
  name: string;
  account_group: {
    id: string;
    name: string;
  };
  type: 'Product' | 'Service';
  stock_control: boolean;
  active: boolean;
  tax_classification: string;
  tax_included: boolean;
  tax_consumption_value?: number;
  taxes: Array<{
    id: string;
    name: string;
    type: string;
    percentage: number;
  }>;
  prices: Array<{
    currency_code: string;
    currency_name: string;
    price_list: Array<{
      position: number;
      value: number;
    }>;
  }>;
  unit: {
    code: string;
    name: string;
  };
  reference?: string;
  description?: string;
}

export interface SiigoPurchase {
  id: string;
  document: {
    id: number;
    name: string;
  };
  number: number;
  name: string;
  date: string;
  supplier: {
    identification: string;
    name: string;
  };
  cost_center?: {
    id: number;
    name: string;
  };
  currency: {
    code: string;
    name: string;
  };
  total: number;
  balance: number;
  observations?: string;
  items: Array<{
    id: string;
    code: string;
    description: string;
    quantity: number;
    price: number;
    total: number;
    taxes: Array<{
      id: string;
      name: string;
      type: string;
      percentage: number;
      value: number;
    }>;
  }>;
}

export interface SiigoAccountingEntry {
  id: string;
  date: string;
  document: {
    id: number;
    name: string;
  };
  number: number;
  name: string;
  observations?: string;
  items: Array<{
    account: {
      code: string;
      name: string;
    };
    description: string;
    debit: number;
    credit: number;
    cost_center?: {
      id: number;
      name: string;
    };
  }>;
}

export interface SiigoJournal {
  account: {
    code: string;
    name: string;
    group: string;
  };
  initial_balance: number;
  debit: number;
  credit: number;
  final_balance: number;
  cost_center?: {
    id: number;
    name: string;
  };
}

export interface SiigoTrialBalance {
  account: {
    code: string;
    name: string;
    level: number;
    type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  };
  initial_balance: number;
  debit_movement: number;
  credit_movement: number;
  final_balance: number;
}

// Configuración de filtros por empresa
export interface CompanyFilters {
  dateRange: {
    start: string;
    end: string;
  };
  costCenters?: string[];
  accountTypes?: string[];
  customers?: string[];
  suppliers?: string[];
}

class SiigoClient {
  private apiKey: string;
  private baseUrl = 'https://api.siigo.com/v1';
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async authenticate(): Promise<void> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return; // Token aún válido
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.apiKey}`,
          'Partner-Id': 'GrupoIP3',
        },
        body: JSON.stringify({
          username: 'admin@grupoip3.com',
          access_key: this.apiKey,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SIIGO Auth Error:', response.status, errorText);
        throw new Error(`SIIGO Auth failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      // Los tokens de SIIGO duran típicamente 1 hora
      this.tokenExpiry = new Date(Date.now() + (data.expires_in || 3600) * 1000);
    } catch (error) {
      console.error('Error authenticating with SIIGO:', error);
      throw error;
    }
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    await this.authenticate();

    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SIIGO API error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  // === CLIENTES ===
  async getCustomers(filters: {
    page?: number;
    page_size?: number;
    active?: boolean;
    name?: string;
  } = {}): Promise<{ pagination: any; results: SiigoCustomer[] }> {
    return this.makeRequest('/customers', {
      page: filters.page || 1,
      page_size: filters.page_size || 100,
      active: filters.active,
      name: filters.name,
    });
  }

  async getCustomer(customerId: string): Promise<SiigoCustomer> {
    return this.makeRequest(`/customers/${customerId}`);
  }

  // === FACTURAS DE VENTA ===
  async getInvoices(filters: {
    page?: number;
    page_size?: number;
    start_date?: string; // YYYY-MM-DD
    end_date?: string;   // YYYY-MM-DD
    customer_id?: string;
    document_id?: number;
  } = {}): Promise<{ pagination: any; results: SiigoInvoice[] }> {
    return this.makeRequest('/invoices', {
      page: filters.page || 1,
      page_size: filters.page_size || 100,
      start_date: filters.start_date,
      end_date: filters.end_date,
      customer_id: filters.customer_id,
      document_id: filters.document_id,
    });
  }

  async getInvoice(invoiceId: string): Promise<SiigoInvoice> {
    return this.makeRequest(`/invoices/${invoiceId}`);
  }

  // === PRODUCTOS ===
  async getProducts(filters: {
    page?: number;
    page_size?: number;
    active?: boolean;
    name?: string;
    code?: string;
  } = {}): Promise<{ pagination: any; results: SiigoProduct[] }> {
    return this.makeRequest('/products', {
      page: filters.page || 1,
      page_size: filters.page_size || 100,
      active: filters.active,
      name: filters.name,
      code: filters.code,
    });
  }

  // === COMPRAS ===
  async getPurchases(filters: {
    page?: number;
    page_size?: number;
    start_date?: string;
    end_date?: string;
    supplier_id?: string;
  } = {}): Promise<{ pagination: any; results: SiigoPurchase[] }> {
    return this.makeRequest('/purchases', {
      page: filters.page || 1,
      page_size: filters.page_size || 100,
      start_date: filters.start_date,
      end_date: filters.end_date,
      supplier_id: filters.supplier_id,
    });
  }

  // === CONTABILIDAD ===
  async getAccountingEntries(filters: {
    page?: number;
    page_size?: number;
    start_date?: string;
    end_date?: string;
    account_code?: string;
  } = {}): Promise<{ pagination: any; results: SiigoAccountingEntry[] }> {
    return this.makeRequest('/accounting-entries', {
      page: filters.page || 1,
      page_size: filters.page_size || 100,
      start_date: filters.start_date,
      end_date: filters.end_date,
      account_code: filters.account_code,
    });
  }

  async getJournal(filters: {
    start_date: string;
    end_date: string;
    account_code?: string;
    cost_center_id?: number;
  }): Promise<SiigoJournal[]> {
    return this.makeRequest('/reports/journal', filters);
  }

  async getTrialBalance(filters: {
    start_date: string;
    end_date: string;
    level?: number; // Nivel de detalle de cuentas
  }): Promise<SiigoTrialBalance[]> {
    return this.makeRequest('/reports/trial-balance', filters);
  }

  // === MÉTODOS DE ANÁLISIS PARA DASHBOARDS ===
  
  // P&G - Pérdidas y Ganancias
  async getProfitAndLoss(filters: CompanyFilters) {
    const [invoices, purchases] = await Promise.all([
      this.getAllInvoices(filters),
      this.getAllPurchases(filters),
    ]);

    const totalIncome = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalExpenses = purchases.reduce((sum, pur) => sum + pur.total, 0);
    const netProfit = totalIncome - totalExpenses;

    return {
      income: {
        total: totalIncome,
        invoices: invoices.length,
        average: invoices.length > 0 ? totalIncome / invoices.length : 0,
      },
      expenses: {
        total: totalExpenses,
        purchases: purchases.length,
        average: purchases.length > 0 ? totalExpenses / purchases.length : 0,
      },
      netProfit,
      margin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
    };
  }

  // CXC - Cuentas por Cobrar
  async getAccountsReceivable(filters: CompanyFilters) {
    const invoices = await this.getAllInvoices(filters);
    const pendingInvoices = invoices.filter(inv => inv.balance > 0);
    
    const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.balance, 0);
    const overdue = pendingInvoices.filter(inv => {
      const dueDate = new Date(inv.payments[0]?.due_date || inv.date);
      return dueDate < new Date();
    });

    return {
      total: totalPending,
      count: pendingInvoices.length,
      overdue: {
        total: overdue.reduce((sum, inv) => sum + inv.balance, 0),
        count: overdue.length,
      },
      aging: this.calculateAging(pendingInvoices),
      topDebtors: this.getTopDebtors(pendingInvoices, 10),
    };
  }

  // CXP - Cuentas por Pagar
  async getAccountsPayable(filters: CompanyFilters) {
    const purchases = await this.getAllPurchases(filters);
    const pendingPurchases = purchases.filter(pur => pur.balance > 0);
    
    const totalPending = pendingPurchases.reduce((sum, pur) => sum + pur.balance, 0);

    return {
      total: totalPending,
      count: pendingPurchases.length,
      bySupplier: this.groupBySupplier(pendingPurchases),
      dueSoon: pendingPurchases.filter(pur => {
        const dueDate = new Date(pur.date);
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return dueDate <= sevenDaysFromNow;
      }),
    };
  }

  // Métodos helper privados
  private async getAllInvoices(filters: CompanyFilters): Promise<SiigoInvoice[]> {
    const allInvoices: SiigoInvoice[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getInvoices({
        page,
        page_size: 100,
        start_date: filters.dateRange.start,
        end_date: filters.dateRange.end,
      });

      allInvoices.push(...response.results);
      hasMore = response.results.length === 100;
      page++;
    }

    return allInvoices;
  }

  private async getAllPurchases(filters: CompanyFilters): Promise<SiigoPurchase[]> {
    const allPurchases: SiigoPurchase[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getPurchases({
        page,
        page_size: 100,
        start_date: filters.dateRange.start,
        end_date: filters.dateRange.end,
      });

      allPurchases.push(...response.results);
      hasMore = response.results.length === 100;
      page++;
    }

    return allPurchases;
  }

  private calculateAging(invoices: SiigoInvoice[]) {
    const aging = {
      current: 0,    // 0-30 días
      days30: 0,     // 31-60 días
      days60: 0,     // 61-90 días
      days90: 0,     // 91+ días
    };

    const today = new Date();
    
    invoices.forEach(inv => {
      const dueDate = new Date(inv.payments[0]?.due_date || inv.date);
      const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 30) aging.current += inv.balance;
      else if (daysDiff <= 60) aging.days30 += inv.balance;
      else if (daysDiff <= 90) aging.days60 += inv.balance;
      else aging.days90 += inv.balance;
    });

    return aging;
  }

  private getTopDebtors(invoices: SiigoInvoice[], limit: number) {
    const debtors = new Map<string, { name: string; total: number; count: number }>();

    invoices.forEach(inv => {
      const customer = inv.customer.identification;
      const current = debtors.get(customer) || { name: inv.customer.name, total: 0, count: 0 };
      current.total += inv.balance;
      current.count += 1;
      debtors.set(customer, current);
    });

    return Array.from(debtors.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  private groupBySupplier(purchases: SiigoPurchase[]) {
    const suppliers = new Map<string, { name: string; total: number; count: number }>();

    purchases.forEach(pur => {
      const supplier = pur.supplier.identification;
      const current = suppliers.get(supplier) || { name: pur.supplier.name, total: 0, count: 0 };
      current.total += pur.balance;
      current.count += 1;
      suppliers.set(supplier, current);
    });

    return Array.from(suppliers.entries()).map(([id, data]) => ({ id, ...data }));
  }
}

export default SiigoClient;

// Factory para crear cliente con configuración de empresa
export function createSiigoClient(company: Company): SiigoClient {
  if (!company.siigoAccessKey) {
    throw new Error('SIIGO API key not configured for this company');
  }
  
  return new SiigoClient(company.siigoAccessKey);
}
