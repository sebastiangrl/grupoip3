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
      total: 0,
      count: 0,
      overdue: {
        total: 0,
        count: 0,
      },
      aging: {
        current: 0,
        days30: 0,
        days60: 0,
        days90: 0,
      },
      topDebtors: []
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

    // Llamada segura a la API para obtener facturas y clientes (CXC)
    const result = await safeApiCall(
      async () => {
        // Crear filtro de fechas
        const dateFilter = {
          start: startDate || undefined,
          end: endDate || undefined
        };

        // Obtener facturas y clientes para análisis de CXC
        const [invoices, customers] = await Promise.all([
          client.getAllInvoices(dateFilter),
          client.getAllCustomers()
        ]);
        
        // Filtrar facturas por rango de fechas si es necesario
        const filteredInvoices = invoices.filter(invoice => {
          const invoiceDate = new Date(invoice.date);
          const start = startDate ? new Date(startDate) : new Date('1900-01-01');
          const end = endDate ? new Date(endDate) : new Date();
          
          return invoiceDate >= start && invoiceDate <= end;
        });
        
        // Filtrar facturas con saldo pendiente
        const receivableInvoices = filteredInvoices.filter(invoice => invoice.balance > 0);
        
        // Crear mapa de clientes para nombres
        const customerMap = new Map(
          customers.map(customer => [
            customer.id,
            customer.name.join(' ') || customer.identification
          ])
        );

        // Calcular totales
        const totalReceivable = receivableInvoices.reduce((sum, invoice) => sum + invoice.balance, 0);
        const totalInvoices = receivableInvoices.length;

        // Agrupar por cliente para análisis de deudores
        const customerBalances = new Map();
        receivableInvoices.forEach(invoice => {
          const customerId = invoice.customer.id;
          const current = customerBalances.get(customerId) || {
            balance: 0,
            invoices: [],
            oldestDate: new Date(invoice.date)
          };

          const invoiceDate = new Date(invoice.date);
          if (invoiceDate < current.oldestDate) {
            current.oldestDate = invoiceDate;
          }

          customerBalances.set(customerId, {
            balance: current.balance + invoice.balance,
            invoices: [...current.invoices, invoice],
            oldestDate: current.oldestDate
          });
        });

        // Calcular aging (0-30, 31-60, 61-90, 90+ días)
        const today = new Date();
        const aging = { current: 0, days30: 0, days60: 0, days90: 0 };

        customerBalances.forEach(({ balance, oldestDate }) => {
          const daysDiff = Math.floor((today.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 30) aging.current += balance;
          else if (daysDiff <= 60) aging.days30 += balance;
          else if (daysDiff <= 90) aging.days60 += balance;
          else aging.days90 += balance;
        });

        // Top deudores
        const topDebtors = Array.from(customerBalances.entries())
          .map(([customerId, data]) => ({
            id: customerId,
            name: customerMap.get(customerId) || 'Cliente Desconocido',
            total: data.balance,
            count: data.invoices.length,
            daysOverdue: Math.floor((today.getTime() - data.oldestDate.getTime()) / (1000 * 60 * 60 * 24))
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        return {
          total: totalReceivable,
          count: totalInvoices,
          overdue: {
            total: aging.days30 + aging.days60 + aging.days90,
            count: receivableInvoices.filter(inv => {
              const daysDiff = Math.floor((today.getTime() - new Date(inv.date).getTime()) / (1000 * 60 * 60 * 24));
              return daysDiff > 30;
            }).length
          },
          aging,
          topDebtors
        };
      },
      emptyData,
      'accounts-receivable'
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
        total: 0,
        count: 0,
        overdue: {
          total: 0,
          count: 0,
        },
        aging: {
          current: 0,
          days30: 0,
          days60: 0,
          days90: 0,
        },
        topDebtors: []
      },
      filters: fallbackFilters,
      source: 'empty',
      error: 'Emergency fallback due to system error'
    });
  }
}
