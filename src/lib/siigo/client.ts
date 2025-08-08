import { 
  SiigoConfig, 
  SiigoAuthResponse, 
  SiigoCustomer, 
  SiigoInvoice, 
  SiigoProduct,
  SiigoPurchase,
  SiigoPaginatedResponse,
  SiigoTrialBalanceEntry,
  SiigoJournalEntry,
  SiigoDateFilter,
  CompanyFilters
} from './types';
import { decrypt } from '../crypto';
import { prisma } from '../prisma';

export class SiigoClient {
  private config: SiigoConfig;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private baseUrl: string;

  constructor(config: SiigoConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || process.env.SIIGO_API_URL || 'https://api.siigo.com';
  }

  /**
   * Authenticate with SIIGO API and get JWT token
   */
  async authenticate(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.config.username,
          access_key: this.config.accessKey,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SIIGO Auth failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data: SiigoAuthResponse = await response.json();
      
      this.token = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
      
      return this.token;
    } catch (error) {
      throw new Error(`Failed to authenticate with SIIGO API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get valid token, refreshing if necessary
   */
  async getValidToken(): Promise<string> {
    if (!this.token || !this.tokenExpiry || this.tokenExpiry <= new Date()) {
      await this.authenticate();
    }
    return this.token!;
  }

  /**
   * Make authenticated request to SIIGO API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getValidToken();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Partner-Id': this.config.partnerId,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SIIGO API error: ${response.status} ${response.statusText}. ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get all customers with pagination
   */
  async getCustomers(page: number = 1, pageSize: number = 100): Promise<SiigoPaginatedResponse<SiigoCustomer>> {
    return this.makeRequest<SiigoPaginatedResponse<SiigoCustomer>>(
      `/v1/customers?page=${page}&page_size=${pageSize}`
    );
  }

  /**
   * Get all customers (handle pagination automatically)
   */
  async getAllCustomers(): Promise<SiigoCustomer[]> {
    const allCustomers: SiigoCustomer[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await this.getCustomers(page, 100);
        allCustomers.push(...response.results);
        
        const totalPages = Math.ceil(response.pagination.total_results / response.pagination.page_size);
        hasMore = page < totalPages;
        page++;

        // Add delay to respect rate limits
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        break;
      }
    }

    return allCustomers;
  }

  /**
   * Get invoices with pagination and optional date filter
   */
  async getInvoices(page: number = 1, pageSize: number = 100, dateFilter?: SiigoDateFilter): Promise<SiigoPaginatedResponse<SiigoInvoice>> {
    let endpoint = `/v1/invoices?page=${page}&page_size=${pageSize}`;
    
    if (dateFilter?.start) {
      endpoint += `&start_date=${dateFilter.start}`;
    }
    if (dateFilter?.end) {
      endpoint += `&end_date=${dateFilter.end}`;
    }

    return this.makeRequest<SiigoPaginatedResponse<SiigoInvoice>>(endpoint);
  }

  /**
   * Get all invoices (handle pagination automatically)
   */
  async getAllInvoices(dateFilter?: SiigoDateFilter): Promise<SiigoInvoice[]> {
    const allInvoices: SiigoInvoice[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await this.getInvoices(page, 100, dateFilter);
        allInvoices.push(...response.results);
        
        if (!response.pagination || allInvoices.length >= (response.pagination.total_results || 0)) {
          hasMore = false;
        } else {
          const totalPages = Math.ceil(response.pagination.total_results / response.pagination.page_size);
          hasMore = page < totalPages;
        }
        
        page++;

        // Add delay to respect rate limits
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        break;
      }
    }

    return allInvoices;
  }

  /**
   * Get products
   */
  async getProducts(): Promise<SiigoProduct[]> {
    try {
      const response = await this.makeRequest<{ results: SiigoProduct[] }>('/v1/products');
      return response.results || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get purchases with optional date filter
   */
  async getPurchases(dateFilter?: SiigoDateFilter): Promise<SiigoPurchase[]> {
    try {
      let endpoint = '/v1/purchases';
      
      if (dateFilter?.start) {
        endpoint += `?start_date=${dateFilter.start}`;
      }
      if (dateFilter?.end) {
        endpoint += `${endpoint.includes('?') ? '&' : '?'}end_date=${dateFilter.end}`;
      }

      const response = await this.makeRequest<{ results: SiigoPurchase[] }>(endpoint);
      return response.results || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get trial balance
   */
  async getTrialBalance(filters: CompanyFilters): Promise<any> {
    try {
      // SIIGO API endpoint for trial balance
      let endpoint = '/v1/trial-balance';
      
      if (filters.dateRange?.start) {
        endpoint += `?start_date=${filters.dateRange.start}`;
      }
      if (filters.dateRange?.end) {
        endpoint += `${endpoint.includes('?') ? '&' : '?'}end_date=${filters.dateRange.end}`;
      }

      return this.makeRequest(endpoint);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get profit and loss statement
   */
  async getProfitAndLoss(filters: CompanyFilters): Promise<any> {
    try {
      let endpoint = '/v1/profit-loss';
      
      if (filters.dateRange?.start) {
        endpoint += `?start_date=${filters.dateRange.start}`;
      }
      if (filters.dateRange?.end) {
        endpoint += `${endpoint.includes('?') ? '&' : '?'}end_date=${filters.dateRange.end}`;
      }

      return this.makeRequest(endpoint);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get accounts receivable
   */
  async getAccountsReceivable(filters: CompanyFilters): Promise<any> {
    try {
      let endpoint = '/v1/accounts-receivable';
      
      if (filters.dateRange?.start) {
        endpoint += `?start_date=${filters.dateRange.start}`;
      }
      if (filters.dateRange?.end) {
        endpoint += `${endpoint.includes('?') ? '&' : '?'}end_date=${filters.dateRange.end}`;
      }

      return this.makeRequest(endpoint);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get accounts payable
   */
  async getAccountsPayable(filters: CompanyFilters): Promise<any> {
    try {
      let endpoint = '/v1/accounts-payable';
      
      if (filters.dateRange?.start) {
        endpoint += `?start_date=${filters.dateRange.start}`;
      }
      if (filters.dateRange?.end) {
        endpoint += `${endpoint.includes('?') ? '&' : '?'}end_date=${filters.dateRange.end}`;
      }

      return this.makeRequest(endpoint);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get journal entries
   */
  async getJournalEntries(filters: CompanyFilters): Promise<SiigoJournalEntry[]> {
    try {
      let endpoint = '/v1/journal-entries';
      
      if (filters.dateRange?.start) {
        endpoint += `?start_date=${filters.dateRange.start}`;
      }
      if (filters.dateRange?.end) {
        endpoint += `${endpoint.includes('?') ? '&' : '?'}end_date=${filters.dateRange.end}`;
      }

      const response = await this.makeRequest<{ results: SiigoJournalEntry[] }>(endpoint);
      return response.results || [];
    } catch (error) {
      return [];
    }
  }
}

/**
 * Create SIIGO client for a specific company
 */
export async function createSiigoClient(companyId: string): Promise<SiigoClient> {
  try {
    // Get company SIIGO configuration from database
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        siigoUsername: true,
        siigoAccessKey: true,
        siigoPartnerId: true,
      },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    if (!company.siigoUsername || !company.siigoAccessKey) {
      throw new Error('SIIGO configuration not found for this company. Please configure SIIGO credentials in company settings.');
    }

    // Decrypt the access key
    const accessKey = decrypt(company.siigoAccessKey);

    return new SiigoClient({
      username: company.siigoUsername,
      accessKey,
      partnerId: company.siigoPartnerId || 'GrupoIP3Dashboard',
    });
  } catch (error) {
    throw error;
  }
}
