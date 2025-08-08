import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSiigoClientSafe, safeApiCall } from '@/lib/siigo/client-factory';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Manejo seguro de Prisma con reintentos
    let company;
    let retries = 3;
    
    while (retries > 0) {
      try {
        company = await prisma.company.findUnique({
          where: { id: companyId },
        });
        break; // Éxito, salir del loop
      } catch (prismaError) {
        retries--;
        
        if (retries === 0) {
          // Último intento fallido, retornar datos vacíos
          company = null;
        } else {
          // Esperar un poco antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    // Crear cliente seguro
    const { client, source } = await createSiigoClientSafe(company || null);

    // Datos vacíos por defecto
    const emptyData = {
      income: { total: 0, invoices: 0, average: 0 },
      expenses: { total: 0, purchases: 0, average: 0 },
      netProfit: 0,
      margin: 0
    };

    const filters = {
      dateRange: {
        start: startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: endDate || new Date().toISOString().split('T')[0],
      },
    };

    // Si no hay cliente, retornar datos vacíos
    if (!client) {
      return NextResponse.json({
        success: true,
        data: emptyData,
        filters,
        source: 'empty',
        message: 'No SIIGO integration configured'
      });
    }

    // Llamada segura a la API para obtener facturas (datos P&G vienen de invoices)
    const result = await safeApiCall(
      async () => {
        // Crear filtro de fechas para las facturas
        const dateFilter = {
          start: startDate || undefined,
          end: endDate || undefined
        };

        // Obtener todas las facturas con filtro de fechas
        const invoices = await client.getAllInvoices(dateFilter);
        
        // Filtrar facturas por rango de fechas si no está implementado en el cliente
        const filteredInvoices = invoices.filter(invoice => {
          const invoiceDate = new Date(invoice.date);
          const start = startDate ? new Date(startDate) : new Date('1900-01-01');
          const end = endDate ? new Date(endDate) : new Date();
          
          return invoiceDate >= start && invoiceDate <= end;
        });
        
        // Calcular métricas de P&G basadas en facturas reales de SIIGO
        const totalSales = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
        const totalInvoices = filteredInvoices.length;
        
        // Calcular impuestos totales
        const totalTaxes = filteredInvoices.reduce((sum, invoice) => {
          const invoiceTaxes = invoice.items.reduce((itemSum, item) => {
            return itemSum + item.taxes.reduce((taxSum, tax) => taxSum + tax.value, 0);
          }, 0);
          return sum + invoiceTaxes;
        }, 0);

        // Calcular retenciones totales
        const totalRetentions = filteredInvoices.reduce((sum, invoice) => {
          return sum + (invoice.retentions?.reduce((retSum, ret) => retSum + ret.value, 0) || 0);
        }, 0);

        // Calcular ingresos netos (ventas - retenciones)
        const netIncome = totalSales - totalRetentions;
        
        // Para gastos, usaremos las compras si están disponibles
        // Por ahora, estimamos gastos como un porcentaje de ventas
        const estimatedExpenses = totalSales * 0.7; // 70% como estimación

        return {
          income: {
            total: totalSales,
            invoices: totalInvoices,
            average: totalInvoices > 0 ? totalSales / totalInvoices : 0,
            taxes: totalTaxes,
            retentions: totalRetentions,
            net: netIncome
          },
          expenses: {
            total: estimatedExpenses,
            purchases: 0, // Se actualizará cuando tengamos endpoint de compras
            average: 0
          },
          netProfit: netIncome - estimatedExpenses,
          margin: totalSales > 0 ? ((netIncome - estimatedExpenses) / totalSales) * 100 : 0
        };
      },
      emptyData,
      'profit-loss'
    );

    return NextResponse.json({
      success: true,
      data: result.data,
      filters,
      source: result.source,
      error: result.error,
    });

  } catch (error) {
    // Fallback seguro
    const fallbackFilters = {
      dateRange: {
        start: startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: endDate || new Date().toISOString().split('T')[0],
      }
    };
    
    return NextResponse.json({
      success: true,
      data: {
        income: { total: 0, invoices: 0, average: 0 },
        expenses: { total: 0, purchases: 0, average: 0 },
        netProfit: 0,
        margin: 0
      },
      filters: fallbackFilters,
      source: 'empty',
      error: 'Emergency fallback due to system error'
    });
  }
}
