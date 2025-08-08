'use client';

import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Interfaces para métricas P&G
export interface PGMetrics {
  // Métricas principales
  totalSales: number;
  totalInvoices: number;
  averageInvoice: number;
  totalTaxes: number;
  totalRetentions: number;
  netProfit: number;
  profitMargin: number;
  
  // Datos para gráficos
  monthlySales: Array<{
    month: string;
    sales: number;
    invoices: number;
    taxes: number;
    netProfit: number;
  }>;
  
  // Top productos
  topProducts: Array<{
    code: string;
    description: string;
    quantity: number;
    revenue: number;
    percentage: number;
  }>;
  
  // Ventas por centro de costo
  salesByCostCenter: Array<{
    costCenter: string;
    sales: number;
    percentage: number;
    invoices: number;
  }>;
  
  // Análisis de impuestos
  taxBreakdown: Array<{
    taxName: string;
    totalAmount: number;
    percentage: number;
  }>;
  
  // Comparación año anterior (si hay datos)
  yearOverYear?: {
    salesGrowth: number;
    profitGrowth: number;
    volumeGrowth: number;
  };
}

// Hook principal para métricas P&G
export function usePGMetrics(
  invoices: any[] | null,
  dateRange: { start: string; end: string }
): PGMetrics | null {
  return useMemo(() => {
    if (!invoices || invoices.length === 0) return null;

    // Filtrar facturas por rango de fechas
    const filteredInvoices = invoices.filter(invoice => {
      if (!dateRange.start || !dateRange.end) return true;
      
      const invoiceDate = parseISO(invoice.date);
      const startDate = parseISO(dateRange.start);
      const endDate = parseISO(dateRange.end);
      
      return isWithinInterval(invoiceDate, { start: startDate, end: endDate });
    });

    // 1. Métricas básicas
    const totalSales = filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalInvoices = filteredInvoices.length;
    const averageInvoice = totalInvoices > 0 ? totalSales / totalInvoices : 0;

    // 2. Cálculo de impuestos
    const totalTaxes = filteredInvoices.reduce((sum, invoice) => {
      if (!invoice.items) return sum;
      
      const invoiceTaxes = invoice.items.reduce((itemSum: number, item: any) => {
        if (!item.taxes) return itemSum;
        return itemSum + item.taxes.reduce((taxSum: number, tax: any) => taxSum + (tax.value || 0), 0);
      }, 0);
      
      return sum + invoiceTaxes;
    }, 0);

    // 3. Cálculo de retenciones
    const totalRetentions = filteredInvoices.reduce((sum, invoice) => {
      if (!invoice.retentions) return sum;
      return sum + invoice.retentions.reduce((retSum: number, ret: any) => retSum + (ret.value || 0), 0);
    }, 0);

    // 4. Ganancia neta y margen
    const netProfit = totalSales - totalTaxes - totalRetentions;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    // 5. Datos mensuales
    const monthlyMap = new Map<string, {
      sales: number;
      invoices: number;
      taxes: number;
      retentions: number;
    }>();

    filteredInvoices.forEach(invoice => {
      const month = format(parseISO(invoice.date), 'yyyy-MM', { locale: es });
      const current = monthlyMap.get(month) || { sales: 0, invoices: 0, taxes: 0, retentions: 0 };

      // Calcular impuestos de esta factura
      const invoiceTaxes = invoice.items?.reduce((sum: number, item: any) => {
        return sum + (item.taxes?.reduce((taxSum: number, tax: any) => taxSum + (tax.value || 0), 0) || 0);
      }, 0) || 0;

      // Calcular retenciones de esta factura
      const invoiceRetentions = invoice.retentions?.reduce((sum: number, ret: any) => sum + (ret.value || 0), 0) || 0;

      monthlyMap.set(month, {
        sales: current.sales + (invoice.total || 0),
        invoices: current.invoices + 1,
        taxes: current.taxes + invoiceTaxes,
        retentions: current.retentions + invoiceRetentions,
      });
    });

    const monthlySales = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        sales: data.sales,
        invoices: data.invoices,
        taxes: data.taxes,
        netProfit: data.sales - data.taxes - data.retentions,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 6. Top productos
    const productMap = new Map<string, {
      code: string;
      description: string;
      quantity: number;
      revenue: number;
    }>();

    filteredInvoices.forEach(invoice => {
      if (!invoice.items) return;
      
      invoice.items.forEach((item: any) => {
        const key = `${item.code || 'SIN_CODIGO'}-${item.description || 'Sin descripción'}`;
        const current = productMap.get(key) || {
          code: item.code || 'SIN_CODIGO',
          description: item.description || 'Sin descripción',
          quantity: 0,
          revenue: 0,
        };

        productMap.set(key, {
          ...current,
          quantity: current.quantity + (item.quantity || 0),
          revenue: current.revenue + (item.total || 0),
        });
      });
    });

    const topProducts = Array.from(productMap.values())
      .map(product => ({
        ...product,
        percentage: totalSales > 0 ? (product.revenue / totalSales) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // 7. Ventas por centro de costo
    const costCenterMap = new Map<string, { sales: number; invoices: number }>();

    filteredInvoices.forEach(invoice => {
      const costCenter = invoice.cost_center?.toString() || 'Sin asignar';
      const current = costCenterMap.get(costCenter) || { sales: 0, invoices: 0 };

      costCenterMap.set(costCenter, {
        sales: current.sales + (invoice.total || 0),
        invoices: current.invoices + 1,
      });
    });

    const salesByCostCenter = Array.from(costCenterMap.entries())
      .map(([costCenter, data]) => ({
        costCenter,
        sales: data.sales,
        invoices: data.invoices,
        percentage: totalSales > 0 ? (data.sales / totalSales) * 100 : 0,
      }))
      .sort((a, b) => b.sales - a.sales);

    // 8. Desglose de impuestos
    const taxMap = new Map<string, number>();

    filteredInvoices.forEach(invoice => {
      if (!invoice.items) return;
      
      invoice.items.forEach((item: any) => {
        if (!item.taxes) return;
        
        item.taxes.forEach((tax: any) => {
          const taxName = tax.name || 'Impuesto sin nombre';
          const current = taxMap.get(taxName) || 0;
          taxMap.set(taxName, current + (tax.value || 0));
        });
      });
    });

    const taxBreakdown = Array.from(taxMap.entries())
      .map(([taxName, totalAmount]) => ({
        taxName,
        totalAmount,
        percentage: totalTaxes > 0 ? (totalAmount / totalTaxes) * 100 : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      totalSales,
      totalInvoices,
      averageInvoice,
      totalTaxes,
      totalRetentions,
      netProfit,
      profitMargin,
      monthlySales,
      topProducts,
      salesByCostCenter,
      taxBreakdown,
    };
  }, [invoices, dateRange]);
}

// Hook para comparar períodos
export function usePGComparison(
  currentMetrics: PGMetrics | null,
  previousInvoices: any[] | null
): {
  salesGrowth: number;
  profitGrowth: number;
  volumeGrowth: number;
} | null {
  return useMemo(() => {
    if (!currentMetrics || !previousInvoices) return null;

    // Calcular métricas del período anterior
    const prevTotalSales = previousInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const prevTotalInvoices = previousInvoices.length;

    const prevTotalTaxes = previousInvoices.reduce((sum, invoice) => {
      if (!invoice.items) return sum;
      
      const invoiceTaxes = invoice.items.reduce((itemSum: number, item: any) => {
        if (!item.taxes) return itemSum;
        return itemSum + item.taxes.reduce((taxSum: number, tax: any) => taxSum + (tax.value || 0), 0);
      }, 0);
      
      return sum + invoiceTaxes;
    }, 0);

    const prevTotalRetentions = previousInvoices.reduce((sum, invoice) => {
      if (!invoice.retentions) return sum;
      return sum + invoice.retentions.reduce((retSum: number, ret: any) => retSum + (ret.value || 0), 0);
    }, 0);

    const prevNetProfit = prevTotalSales - prevTotalTaxes - prevTotalRetentions;

    // Calcular crecimiento
    const salesGrowth = prevTotalSales > 0 ? ((currentMetrics.totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;
    const profitGrowth = prevNetProfit > 0 ? ((currentMetrics.netProfit - prevNetProfit) / prevNetProfit) * 100 : 0;
    const volumeGrowth = prevTotalInvoices > 0 ? ((currentMetrics.totalInvoices - prevTotalInvoices) / prevTotalInvoices) * 100 : 0;

    return {
      salesGrowth,
      profitGrowth,
      volumeGrowth,
    };
  }, [currentMetrics, previousInvoices]);
}
