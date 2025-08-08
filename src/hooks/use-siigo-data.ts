import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';

export interface DateRange {
  start: string;
  end: string;
}

export interface ProfitLossData {
  income: {
    total: number;
    invoices: number;
    average: number;
  };
  expenses: {
    total: number;
    purchases: number;
    average: number;
  };
  netProfit: number;
  margin: number;
}

export interface AccountsReceivableData {
  total: number;
  count: number;
  overdue: {
    total: number;
    count: number;
  };
  aging: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
  };
  topDebtors: Array<{
    id: string;
    name: string;
    total: number;
    count: number;
  }>;
}

export interface AccountsPayableData {
  total: number;
  count: number;
  bySupplier: Array<{
    id: string;
    name: string;
    total: number;
    count: number;
  }>;
  dueSoon: Array<{
    id: string;
    supplier: {
      name: string;
    };
    balance: number;
    date: string;
  }>;
}

export interface TrialBalanceData {
  grouped: {
    assets: Array<TrialBalanceItem>;
    liabilities: Array<TrialBalanceItem>;
    equity: Array<TrialBalanceItem>;
    income: Array<TrialBalanceItem>;
    expenses: Array<TrialBalanceItem>;
  };
  totals: {
    assets: number;
    liabilities: number;
    equity: number;
    income: number;
    expenses: number;
  };
  isBalanced: boolean;
}

export interface TrialBalanceItem {
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

export function useSiigoData() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noSiigoConfig, setNoSiigoConfig] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Estado de carga granular por módulo
  const [loadingStates, setLoadingStates] = useState({
    profitLoss: false,
    accountsReceivable: false,
    accountsPayable: false,
    trialBalance: false
  });

  // Estado por módulo
  const [profitLoss, setProfitLoss] = useState<ProfitLossData | null>(null);
  const [accountsReceivable, setAccountsReceivable] = useState<AccountsReceivableData | null>(null);
  const [accountsPayable, setAccountsPayable] = useState<AccountsPayableData | null>(null);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceData | null>(null);
  
  // Datos raw para componentes avanzados (P&G, análisis detallados)
  const [rawData, setRawData] = useState<{
    invoices: any[] | null;
    customers: any[] | null;
    purchases: any[] | null;
    products: any[] | null;
  }>({
    invoices: null,
    customers: null,
    purchases: null,
    products: null,
  });

  // Filtros globales
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1); // 1 enero del año actual
    return {
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
    };
  });

  // Verificar estado de configuración SIIGO
  const checkSiigoConfig = async () => {
    if (!user?.companyId) return;

    setCheckingConfig(true);
    try {
      const response = await fetch(`/api/siigo/status?companyId=${user.companyId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNoSiigoConfig(!result.data.hasCredentials);
        }
      }
    } catch (err) {
      // En caso de error, asumir que no hay configuración
      setNoSiigoConfig(true);
    } finally {
      setCheckingConfig(false);
    }
  };

  // Verificar configuración al cargar o cambiar de empresa
  useEffect(() => {
    if (user?.companyId) {
      checkSiigoConfig();
    }
  }, [user?.companyId]);

  const fetchData = async (endpoint: string, setState: (data: any) => void) => {
    if (!user?.companyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        companyId: user.companyId,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      const response = await fetch(`/api/siigo/${endpoint}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setState(result.data);
        setError(null);
        return result.data;
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Métodos específicos para cada módulo
  const fetchProfitLoss = () => fetchData('profit-loss', setProfitLoss);
  const fetchAccountsReceivable = () => fetchData('accounts-receivable', setAccountsReceivable);
  const fetchAccountsPayable = () => fetchData('accounts-payable', setAccountsPayable);
  const fetchTrialBalance = () => fetchData('trial-balance', setTrialBalance);

  // Fetch all data for dashboard overview - Carga optimizada con timeout
  const fetchAllData = async () => {
    if (!user?.companyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        companyId: user.companyId,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      // Carga con timeout individual por módulo
      const endpoints = [
        { name: 'profit-loss', setter: setProfitLoss, key: 'profitLoss' },
        { name: 'accounts-receivable', setter: setAccountsReceivable, key: 'accountsReceivable' },
        { name: 'accounts-payable', setter: setAccountsPayable, key: 'accountsPayable' },
        { name: 'trial-balance', setter: setTrialBalance, key: 'trialBalance' }
      ];

      // También cargar datos raw para análisis avanzados
      const rawEndpoints = [
        { name: 'invoices', key: 'invoices' },
        { name: 'customers', key: 'customers' },
        { name: 'purchases', key: 'purchases' },
        { name: 'products', key: 'products' }
      ];

      const fetchWithTimeout = async (endpoint: { name: string; setter: any; key: string }, timeoutMs = 15000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        try {
          setLoadingStates(prev => ({ ...prev, [endpoint.key]: true }));
          const startTime = Date.now();
          
          const response = await fetch(`/api/siigo/${endpoint.name}?${params}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          const endTime = Date.now();
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`⏱️ ${endpoint.name}: ${endTime - startTime}ms`);
          }

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              endpoint.setter(result.data);
            }
          }
          
          return { success: true, module: endpoint.name };
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`⏰ ${endpoint.name}: Timeout after ${timeoutMs}ms`);
            }
          } else if (process.env.NODE_ENV === 'development') {
            console.warn(`❌ ${endpoint.name} failed:`, error);
          }
          return { success: false, module: endpoint.name, error };
        } finally {
          setLoadingStates(prev => ({ ...prev, [endpoint.key]: false }));
          clearTimeout(timeoutId);
        }
      };

      // Ejecutar todos en paralelo con timeouts independientes
      const startTime = Date.now();
      const results = await Promise.allSettled(
        endpoints.map(endpoint => fetchWithTimeout(endpoint, 15000)) // 15 segundos de timeout por módulo
      );

      // También cargar datos raw en paralelo (para análisis avanzados como P&G)
      const fetchRawData = async () => {
        try {
          // NOTA: Solo cargamos datos de endpoints que existen realmente
          // Los siguientes endpoints no están implementados:
          // - /api/siigo/invoices (404)
          // - /api/siigo/customers (404)  
          // - /api/siigo/purchases (404)
          // - /api/siigo/products (404)
          
          // Por ahora, solo establecemos datos vacíos para evitar errores 404
          const newRawData = {
            invoices: null, // No disponible - endpoint no implementado
            customers: null, // No disponible - endpoint no implementado
            purchases: null, // No disponible - endpoint no implementado
            products: null, // No disponible - endpoint no implementado
          };

          setRawData(newRawData);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('❌ Failed to load raw data:', error);
          }
        }
      };

      // Cargar datos raw en paralelo
      fetchRawData();

      const totalTime = Date.now() - startTime;
      if (process.env.NODE_ENV === 'development') {
        console.log(`🏁 Total dashboard load time: ${totalTime}ms`);
        
        // Log de resultados
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;
        console.log(`📊 Load results: ${successful} successful, ${failed} failed`);
      }

      // Actualizar la fecha de última actualización
      setLastUpdated(new Date());
      
    } catch (err) {
      setError('Error cargando datos del dashboard');
    } finally {
      setIsLoading(false);
      // Limpiar todos los estados de carga
      setLoadingStates({
        profitLoss: false,
        accountsReceivable: false,
        accountsPayable: false,
        trialBalance: false
      });
    }
  };

  // Auto-fetch when date range changes (only if config exists)
  useEffect(() => {
    if (user?.companyId && !noSiigoConfig && !checkingConfig) {
      fetchAllData();
    }
  }, [user?.companyId, dateRange, noSiigoConfig, checkingConfig]);

  // Utility functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    // Data
    profitLoss,
    accountsReceivable,
    accountsPayable,
    trialBalance,
    rawData, // Datos raw para análisis avanzados

    // State
    isLoading: isLoading || checkingConfig,
    loadingStates, // Estado granular por módulo
    error,
    dateRange,
    noSiigoConfig,
    checkingConfig,

    // Actions
    setDateRange,
    fetchProfitLoss,
    fetchAccountsReceivable,
    fetchAccountsPayable,
    fetchTrialBalance,
    fetchAllData,
    checkSiigoConfig,
    
    // Utils
    formatCurrency,
    formatPercentage,
    calculateGrowth,

    // Computed values
    hasData: !!(profitLoss || accountsReceivable || accountsPayable || trialBalance),
    lastUpdated: lastUpdated ? lastUpdated.toLocaleString('es-CO') : null,
    totalLoadingModules: Object.values(loadingStates).filter(Boolean).length,
  };
}

// Hook específico para P&G
export function useProfitLoss(autoFetch = true) {
  const { profitLoss, fetchProfitLoss, isLoading, error, dateRange, setDateRange, formatCurrency, formatPercentage } = useSiigoData();

  useEffect(() => {
    if (autoFetch) {
      fetchProfitLoss();
    }
  }, [dateRange, autoFetch]);

  return {
    data: profitLoss,
    isLoading,
    error,
    dateRange,
    setDateRange,
    refresh: fetchProfitLoss,
    formatCurrency,
    formatPercentage,
  };
}

// Hook específico para CXC
export function useAccountsReceivable(autoFetch = true) {
  const { accountsReceivable, fetchAccountsReceivable, isLoading, error, dateRange, setDateRange, formatCurrency } = useSiigoData();

  useEffect(() => {
    if (autoFetch) {
      fetchAccountsReceivable();
    }
  }, [dateRange, autoFetch]);

  return {
    data: accountsReceivable,
    isLoading,
    error,
    dateRange,
    setDateRange,
    refresh: fetchAccountsReceivable,
    formatCurrency,
  };
}

// Hook específico para CXP
export function useAccountsPayable(autoFetch = true) {
  const { accountsPayable, fetchAccountsPayable, isLoading, error, dateRange, setDateRange, formatCurrency } = useSiigoData();

  useEffect(() => {
    if (autoFetch) {
      fetchAccountsPayable();
    }
  }, [dateRange, autoFetch]);

  return {
    data: accountsPayable,
    isLoading,
    error,
    dateRange,
    setDateRange,
    refresh: fetchAccountsPayable,
    formatCurrency,
  };
}

// Hook específico para Balance de Prueba
export function useTrialBalance(autoFetch = true) {
  const { trialBalance, fetchTrialBalance, isLoading, error, dateRange, setDateRange, formatCurrency } = useSiigoData();

  useEffect(() => {
    if (autoFetch) {
      fetchTrialBalance();
    }
  }, [dateRange, autoFetch]);

  return {
    data: trialBalance,
    isLoading,
    error,
    dateRange,
    setDateRange,
    refresh: fetchTrialBalance,
    formatCurrency,
  };
}
