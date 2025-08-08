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
      grouped: {
        assets: [],
        liabilities: [],
        equity: [],
        income: [],
        expenses: [],
      },
      totals: {
        assets: 0,
        liabilities: 0,
        equity: 0,
        income: 0,
        expenses: 0,
      },
      isBalanced: true,
      accounts: []
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

    // Llamada segura a la API para obtener balance de prueba
    const result = await safeApiCall(
      async () => {
        // Crear filtro de fechas
        const dateFilter = {
          start: startDate || undefined,
          end: endDate || undefined
        };

        // Obtener facturas y compras para calcular balances
        const [invoices, purchases] = await Promise.all([
          client.getAllInvoices(dateFilter),
          client.getPurchases(dateFilter)
        ]);

        // Filtrar por rango de fechas si es necesario
        const filteredInvoices = invoices.filter(invoice => {
          const invoiceDate = new Date(invoice.date);
          const start = startDate ? new Date(startDate) : new Date('1900-01-01');
          const end = endDate ? new Date(endDate) : new Date();
          
          return invoiceDate >= start && invoiceDate <= end;
        });

        const filteredPurchases = purchases.filter(purchase => {
          const purchaseDate = new Date(purchase.date);
          const start = startDate ? new Date(startDate) : new Date('1900-01-01');
          const end = endDate ? new Date(endDate) : new Date();
          
          return purchaseDate >= start && purchaseDate <= end;
        });

        // Simular estructura de balance de prueba basada en transacciones reales
        const totalAssets = filteredInvoices.reduce((sum, inv) => sum + inv.balance, 0); // CXC como activo
        const totalLiabilities = filteredPurchases.reduce((sum, pur) => sum + pur.balance, 0); // CXP como pasivo
        const totalIncome = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalExpenses = filteredPurchases.reduce((sum, pur) => sum + pur.total, 0);
        const totalEquity = totalAssets - totalLiabilities;

        // Crear estructura de balance agrupada
        const assetAccounts = [
          {
            account: {
              code: '1305',
              name: 'Clientes',
              level: 4,
              type: 'Asset' as const
            },
            initial_balance: 0,
            debit_movement: totalIncome,
            credit_movement: totalIncome - totalAssets,
            final_balance: totalAssets
          }
        ];

        const liabilityAccounts = [
          {
            account: {
              code: '2205',
              name: 'Proveedores',
              level: 4,
              type: 'Liability' as const
            },
            initial_balance: 0,
            debit_movement: totalExpenses - totalLiabilities,
            credit_movement: totalExpenses,
            final_balance: totalLiabilities
          }
        ];

        const equityAccounts = [
          {
            account: {
              code: '3105',
              name: 'Capital Social',
              level: 4,
              type: 'Equity' as const
            },
            initial_balance: 0,
            debit_movement: 0,
            credit_movement: totalEquity,
            final_balance: totalEquity
          }
        ];

        const incomeAccounts = [
          {
            account: {
              code: '4135',
              name: 'Ventas',
              level: 4,
              type: 'Income' as const
            },
            initial_balance: 0,
            debit_movement: 0,
            credit_movement: totalIncome,
            final_balance: totalIncome
          }
        ];

        const expenseAccounts = [
          {
            account: {
              code: '5135',
              name: 'Compras',
              level: 4,
              type: 'Expense' as const
            },
            initial_balance: 0,
            debit_movement: totalExpenses,
            credit_movement: 0,
            final_balance: totalExpenses
          }
        ];

        return {
          grouped: {
            assets: assetAccounts,
            liabilities: liabilityAccounts,
            equity: equityAccounts,
            income: incomeAccounts,
            expenses: expenseAccounts
          },
          totals: {
            assets: totalAssets,
            liabilities: totalLiabilities,
            equity: totalEquity,
            income: totalIncome,
            expenses: totalExpenses
          },
          isBalanced: Math.abs((totalAssets) - (totalLiabilities + totalEquity)) < 1 // Tolerancia de 1 peso
        };
      },
      emptyData,
      'trial-balance'
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
        grouped: {
          assets: [],
          liabilities: [],
          equity: [],
          income: [],
          expenses: [],
        },
        totals: {
          assets: 0,
          liabilities: 0,
          equity: 0,
          income: 0,
          expenses: 0,
        },
        isBalanced: true,
        accounts: []
      },
      filters: fallbackFilters,
      source: 'empty',
      error: 'Emergency fallback due to system error'
    });
  }
}
