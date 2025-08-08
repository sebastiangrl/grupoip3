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
      bySupplier: [],
      dueSoon: []
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

    // Llamada segura a la API para obtener compras (CXP)
    const result = await safeApiCall(
      async () => {
        // Crear filtro de fechas
        const dateFilter = {
          start: startDate || undefined,
          end: endDate || undefined
        };

        // Obtener compras para análisis de CXP
        const purchases = await client.getPurchases(dateFilter);
        
        // Filtrar compras por rango de fechas si es necesario
        const filteredPurchases = purchases.filter(purchase => {
          const purchaseDate = new Date(purchase.date);
          const start = startDate ? new Date(startDate) : new Date('1900-01-01');
          const end = endDate ? new Date(endDate) : new Date();
          
          return purchaseDate >= start && purchaseDate <= end;
        });
        
        // Filtrar compras con saldo pendiente
        const payablePurchases = filteredPurchases.filter(purchase => purchase.balance > 0);
        
        // Calcular totales
        const totalPayable = payablePurchases.reduce((sum, purchase) => sum + purchase.balance, 0);
        const totalCount = payablePurchases.length;

        // Agrupar por proveedor
        const supplierBalances = new Map();
        payablePurchases.forEach(purchase => {
          // Verificar que el proveedor existe antes de acceder a sus propiedades
          if (!purchase.vendor || !purchase.vendor.id) {
            return; // Saltar esta compra si no tiene proveedor válido
          }
          
          const supplierId = purchase.vendor.id;
          const current = supplierBalances.get(supplierId) || {
            name: purchase.vendor.name || 'Proveedor sin nombre',
            total: 0,
            count: 0,
            purchases: []
          };

          supplierBalances.set(supplierId, {
            ...current,
            total: current.total + purchase.balance,
            count: current.count + 1,
            purchases: [...current.purchases, purchase]
          });
        });

        // Top proveedores por saldo
        const bySupplier = Array.from(supplierBalances.entries())
          .map(([id, data]) => ({
            id,
            name: data.name,
            total: data.total,
            count: data.count
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        // Próximos vencimientos (próximos 30 días)
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        const dueSoon = payablePurchases
          .filter(purchase => {
            if (!purchase.due_date) return false;
            const dueDate = new Date(purchase.due_date);
            return dueDate >= today && dueDate <= thirtyDaysFromNow;
          })
          .map(purchase => ({
            id: purchase.id,
            supplier: {
              name: purchase.vendor.name
            },
            balance: purchase.balance,
            date: purchase.due_date
          }))
          .sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime())
          .slice(0, 10);

        return {
          total: totalPayable,
          count: totalCount,
          bySupplier,
          dueSoon
        };
      },
      emptyData,
      'accounts-payable'
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
        bySupplier: [],
        dueSoon: []
      },
      filters: fallbackFilters,
      source: 'empty',
      error: 'Emergency fallback due to system error'
    });
  }
}
