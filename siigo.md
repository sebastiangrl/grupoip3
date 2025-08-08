# SIIGO API Integration with Next.js - Complete Guide

## 📋 Overview

This guide explains how to integrate SIIGO API v1 with Next.js for the GrupoIP3 multi-tenant accounting dashboard system. SIIGO is a Colombian ERP/accounting software that provides RESTful APIs for accessing financial data.

## 🔧 SIIGO API Configuration

### **Base Information:**
- **API Base URL:** `https://api.siigo.com`
- **API Version:** v1
- **Authentication:** Bearer Token (JWT)
- **Partner-Id Required:** Custom header for API calls
- **Rate Limits:** Standard REST API limits
- **Data Format:** JSON

### **Authentication Flow:**
1. Exchange username/access_key for JWT token
2. Use JWT token for all subsequent API calls
3. Token expires in 24 hours (86400 seconds)
4. Auto-refresh before expiration

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── siigo/
│   │   ├── client.ts           # Main SIIGO client
│   │   ├── auth.ts             # Authentication handling
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── cache.ts            # Caching mechanisms
│   │   └── utils.ts            # Helper functions
│   └── crypto.ts               # Encryption utilities
├── app/api/siigo/
│   ├── auth/route.ts           # Token management endpoint
│   ├── customers/route.ts      # Customers data endpoint
│   ├── invoices/route.ts       # Invoices data endpoint
│   ├── products/route.ts       # Products data endpoint
│   └── purchases/route.ts      # Purchases data endpoint
└── components/dashboard/
    ├── hooks/
    │   ├── use-siigo-auth.ts   # Authentication hook
    │   ├── use-siigo-data.ts   # Data fetching hook
    │   └── use-company.ts      # Company context hook
    └── providers/
        └── SiigoProvider.tsx   # Context provider
```

## 🔐 Environment Variables

```bash
# .env.local

# SIIGO API Configuration
SIIGO_API_URL=https://api.siigo.com
SIIGO_API_VERSION=v1

# Encryption for storing SIIGO credentials
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Database
DATABASE_URL=postgresql://...

# Next.js
NEXTAUTH_SECRET=your-auth-secret
NEXT_PUBLIC_APP_URL=https://grupoip3.com
```

## 📝 TypeScript Interfaces

```typescript
// lib/siigo/types.ts

export interface SiigoConfig {
  username: string;
  accessKey: string;
  partnerId: string;
  baseUrl?: string;
}

export interface SiigoAuthResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number; // 86400 seconds
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
```

## 🔧 SIIGO Client Implementation

```typescript
// lib/siigo/client.ts

import { SiigoConfig, SiigoAuthResponse, SiigoCustomer, SiigoInvoice, SiigoProduct, SiigoPaginatedResponse } from './types';
import { encrypt, decrypt } from '../crypto';

export class SiigoClient {
  private config: SiigoConfig;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private baseUrl: string;

  constructor(config: SiigoConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.siigo.com';
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
        throw new Error(`SIIGO Auth failed: ${response.status} ${response.statusText}`);
      }

      const data: SiigoAuthResponse = await response.json();
      
      this.token = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
      
      return this.token;
    } catch (error) {
      console.error('SIIGO Authentication error:', error);
      throw new Error('Failed to authenticate with SIIGO API');
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
      throw new Error(`SIIGO API error: ${response.status} ${response.statusText}`);
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
      const response = await this.getCustomers(page, 100);
      allCustomers.push(...response.results);
      
      const totalPages = Math.ceil(response.pagination.total_results / response.pagination.page_size);
      hasMore = page < totalPages;
      page++;

      // Add delay to respect rate limits
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return allCustomers;
  }

  /**
   * Get invoices with pagination
   */
  async getInvoices(page: number = 1, pageSize: number = 100): Promise<SiigoPaginatedResponse<SiigoInvoice>> {
    return this.makeRequest<SiigoPaginatedResponse<SiigoInvoice>>(
      `/v1/invoices?page=${page}&page_size=${pageSize}`
    );
  }

  /**
   * Get all invoices (handle pagination automatically)
   */
  async getAllInvoices(): Promise<SiigoInvoice[]> {
    const allInvoices: SiigoInvoice[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await this.getInvoices(page, 100);
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
        console.error(`Error fetching invoices page ${page}:`, error);
        break;
      }
    }

    return allInvoices;
  }

  /**
   * Get products
   */
  async getProducts(): Promise<SiigoProduct[]> {
    const response = await this.makeRequest<{ results: SiigoProduct[] }>('/v1/products');
    return response.results || [];
  }

  /**
   * Get purchases/vendor invoices
   */
  async getPurchases(): Promise<any[]> {
    const response = await this.makeRequest<{ results: any[] }>('/v1/purchases');
    return response.results || [];
  }
}

/**
 * Create SIIGO client for a specific company
 */
export async function createSiigoClient(companyId: string): Promise<SiigoClient> {
  // Get company SIIGO configuration from database
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      siigoUsername: true,
      siigoAccessKey: true,
      siigoPartnerId: true,
    },
  });

  if (!company || !company.siigoUsername || !company.siigoAccessKey) {
    throw new Error('SIIGO configuration not found for company');
  }

  // Decrypt the access key
  const accessKey = decrypt(company.siigoAccessKey);

  return new SiigoClient({
    username: company.siigoUsername,
    accessKey,
    partnerId: company.siigoPartnerId || 'FukubarDashboard',
  });
}
```

## 🔒 Encryption Utilities

```typescript
// lib/crypto.ts

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ALGORITHM = 'aes-256-gcm';

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 characters long');
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

## 🌐 API Routes

```typescript
// app/api/siigo/customers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createSiigoClient } from '@/lib/siigo/client';
import { getCurrentCompany } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get current company from subdomain
    const company = await getCurrentCompany(request);
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Create SIIGO client for this company
    const siigoClient = await createSiigoClient(company.id);
    
    // Fetch customers data
    const customers = await siigoClient.getAllCustomers();
    
    return NextResponse.json({
      success: true,
      data: customers,
      count: customers.length,
    });
    
  } catch (error) {
    console.error('SIIGO Customers API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch customers data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/siigo/invoices/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createSiigoClient } from '@/lib/siigo/client';
import { getCurrentCompany } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const company = await getCurrentCompany(request);
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const siigoClient = await createSiigoClient(company.id);
    const invoices = await siigoClient.getAllInvoices();
    
    return NextResponse.json({
      success: true,
      data: invoices,
      count: invoices.length,
    });
    
  } catch (error) {
    console.error('SIIGO Invoices API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch invoices data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

## ⚛️ React Hooks for Data Fetching

```typescript
// components/dashboard/hooks/use-siigo-data.ts

import { useState, useEffect } from 'react';
import { SiigoCustomer, SiigoInvoice, SiigoProduct } from '@/lib/siigo/types';

interface UseSiigoDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSiigoCustomers(): UseSiigoDataResult<SiigoCustomer[]> {
  const [data, setData] = useState<SiigoCustomer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/siigo/customers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

export function useSiigoInvoices(): UseSiigoDataResult<SiigoInvoice[]> {
  const [data, setData] = useState<SiigoInvoice[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/siigo/invoices');
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

export function useSiigoProducts(): UseSiigoDataResult<SiigoProduct[]> {
  const [data, setData] = useState<SiigoProduct[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/siigo/products');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
```

## 📊 Dashboard Components Using SIIGO Data

```typescript
// components/dashboard/PGDashboard.tsx

import { useSiigoInvoices } from './hooks/use-siigo-data';
import { KPICard } from './KPICard';
import { SalesChart } from './SalesChart';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function PGDashboard() {
  const { data: invoices, loading, error } = useSiigoInvoices();

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!invoices) return <div>No data available</div>;

  // Process data for dashboard
  const totalSales = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const totalInvoices = invoices.length;
  const averageInvoice = totalInvoices > 0 ? totalSales / totalInvoices : 0;
  
  // Calculate taxes
  const totalTaxes = invoices.reduce((sum, invoice) => {
    const invoiceTaxes = invoice.items.reduce((itemSum, item) => {
      return itemSum + item.taxes.reduce((taxSum, tax) => taxSum + tax.value, 0);
    }, 0);
    return sum + invoiceTaxes;
  }, 0);

  // Calculate retentions
  const totalRetentions = invoices.reduce((sum, invoice) => {
    return sum + (invoice.retentions?.reduce((retSum, ret) => retSum + ret.value, 0) || 0);
  }, 0);

  // Group by month for chart
  const monthlyData = invoices.reduce((acc, invoice) => {
    const month = new Date(invoice.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
    
    if (!acc[month]) {
      acc[month] = { month, sales: 0, count: 0 };
    }
    
    acc[month].sales += invoice.total;
    acc[month].count += 1;
    
    return acc;
  }, {} as Record<string, { month: string; sales: number; count: number }>);

  const chartData = Object.values(monthlyData);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Ventas Totales"
          value={totalSales}
          format="currency"
          color="green"
        />
        <KPICard
          title="Total Facturas"
          value={totalInvoices}
          format="number"
          color="blue"
        />
        <KPICard
          title="Promedio por Factura"
          value={averageInvoice}
          format="currency"
          color="orange"
        />
        <KPICard
          title="Total Impuestos"
          value={totalTaxes}
          format="currency"
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={chartData} />
        {/* Add more charts here */}
      </div>

      {/* Additional dashboard content */}
    </div>
  );
}
```

## 🔄 Caching Strategy

```typescript
// lib/siigo/cache.ts

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SiigoCache {
  private cache = new Map<string, CacheItem<any>>();
  
  set<T>(key: string, data: T, ttlMinutes: number = 30): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    });
  }
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  generateKey(companyId: string, endpoint: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${companyId}:${endpoint}:${paramString}`;
  }
}

export const siigoCache = new SiigoCache();
```

## 🚀 Usage Examples

### **1. Dashboard Component:**
```typescript
export default function Dashboard() {
  const { data: invoices, loading } = useSiigoInvoices();
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      <PGDashboard invoices={invoices} />
    </div>
  );
}
```

### **2. API Route with Caching:**
```typescript
export async function GET(request: NextRequest) {
  const company = await getCurrentCompany(request);
  const cacheKey = siigoCache.generateKey(company.id, 'customers');
  
  // Check cache first
  let customers = siigoCache.get(cacheKey);
  
  if (!customers) {
    // Fetch from SIIGO API
    const siigoClient = await createSiigoClient(company.id);
    customers = await siigoClient.getAllCustomers();
    
    // Cache for 30 minutes
    siigoCache.set(cacheKey, customers, 30);
  }
  
  return NextResponse.json({ data: customers });
}
```

## 🛡️ Error Handling

```typescript
// lib/siigo/errors.ts

export class SiigoApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string
  ) {
    super(message);
    this.name = 'SiigoApiError';
  }
}

export class SiigoAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SiigoAuthError';
  }
}

export function handleSiigoError(error: any, endpoint: string): never {
  if (error.statusCode) {
    throw new SiigoApiError(
      error.message,
      error.statusCode,
      endpoint
    );
  }
  
  throw new Error(`SIIGO API error at ${endpoint}: ${error.message}`);
}
```

## ⚡ Performance Optimization

### **1. Request Batching:**
```typescript
export class SiigoBatchClient extends SiigoClient {
  async batchFetch() {
    const [customers, invoices, products] = await Promise.all([
      this.getAllCustomers(),
      this.getAllInvoices(),
      this.getProducts(),
    ]);
    
    return { customers, invoices, products };
  }
}
```

### **2. Background Sync:**
```typescript
// app/api/siigo/sync/route.ts
export async function POST() {
  // Background job to sync SIIGO data
  const companies = await prisma.company.findMany({
    where: { isActive: true }
  });
  
  for (const company of companies) {
    try {
      const client = await createSiigoClient(company.id);
      const data = await client.batchFetch();
      
      // Cache the data
      siigoCache.set(`${company.id}:batch`, data, 60);
    } catch (error) {
      console.error(`Sync failed for company ${company.id}:`, error);
    }
  }
  
  return NextResponse.json({ success: true });
}
```

## 📝 Notes for Copilot

### **Key Points:**
1. **Authentication:** Always get fresh token before API calls
2. **Rate Limiting:** Add delays between paginated requests
3. **Error Handling:** Wrap all SIIGO calls in try-catch
4. **Caching:** Cache responses for 30 minutes to reduce API calls
5. **Multi-tenant:** Each company has separate SIIGO credentials
6. **Security:** Encrypt SIIGO access keys in database
7. **Pagination:** Handle pagination automatically for large datasets

### **Common Patterns:**
- Use hooks for data fetching in components
- API routes handle authentication and caching
- Client class manages token refresh automatically
- Error boundaries for graceful error handling

### **Development Tips:**
- Test with real SIIGO sandbox environment first
- Monitor API usage to avoid rate limits
- Cache aggressively to improve performance
- Use TypeScript for better type safety
- Implement proper error logging for debugging