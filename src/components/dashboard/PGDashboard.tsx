'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSiigoData } from '@/hooks/use-siigo-data';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PGKPICards } from './PGKPICards';
import { PGCharts } from './PGCharts';
import { TaxBreakdownChart } from './TaxBreakdownChart';
import { TopProductsTable } from './TopProductsTable';
import { ModuleSkeleton } from '@/components/ui/DashboardSkeleton';

export function PGDashboard() {
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  
  // Usar el hook principal de SIIGO que maneja estados granulares
  const {
    profitLoss,
    isLoading,
    loadingStates,
    error,
    dateRange,
    setDateRange,
    fetchProfitLoss,
    formatCurrency,
    formatPercentage,
    noSiigoConfig,
    checkingConfig,
  } = useSiigoData();

  // NO generar datos falsos mensuales, de productos o centros de costo
  // Solo mostrar los datos reales que tenemos de SIIGO del período completo

  // Usar SOLAMENTE datos reales de SIIGO - SIN SIMULACIONES
  const pgMetrics = useMemo(() => {
    if (!profitLoss) return null;
    
    console.log('🔍 PGDashboard - Usando datos reales de SIIGO:', {
      profitLoss,
      dateRange,
      totalIncome: profitLoss.income.total,
      totalInvoices: profitLoss.income.invoices
    });

    // SOLO los datos que realmente tenemos de SIIGO, sin simulaciones
    const metrics = {
      // Datos REALES directos de SIIGO
      totalSales: profitLoss.income.total,
      totalInvoices: profitLoss.income.invoices,
      averageInvoice: profitLoss.income.average,
      totalTaxes: profitLoss.income.total * 0.19, // Calculado como estimación del 19%
      totalRetentions: profitLoss.income.total * 0.035, // Calculado como estimación del 3.5%
      netProfit: profitLoss.netProfit,
      profitMargin: profitLoss.margin,
      
      // NO generar datos mensuales falsos - solo mostrar totales reales del período
      monthlySales: [], // Vacío porque no tenemos datos reales por mes
      
      // NO simular datos que no existen
      taxBreakdown: [], // Vacío porque no tenemos desglose real de impuestos
      topProducts: [], // Vacío porque no tenemos datos reales de productos
      salesByCostCenter: [], // Vacío porque no tenemos datos reales de centros de costo
    };

    return metrics;
  }, [profitLoss, dateRange]);
  
  // Función para validar y aplicar cambios de fecha
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const newDateRange = { ...dateRange, [type]: value };
    
    // Validar que la fecha de inicio no sea mayor que la fecha final
    if (newDateRange.start && newDateRange.end) {
      const startDate = new Date(newDateRange.start);
      const endDate = new Date(newDateRange.end);
      
      if (startDate > endDate) {
        // Si la fecha de inicio es mayor, ajustar la otra fecha
        if (type === 'start') {
          newDateRange.end = value;
        } else {
          newDateRange.start = value;
        }
      }
    }
    
    setDateRange(newDateRange);
  };

  // Mostrar loading mientras verifica configuración
  if (checkingConfig) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pérdidas y Ganancias</h1>
            <p className="text-gray-700 mt-1">Verificando configuración SIIGO...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
              <ModuleSkeleton title="Cargando..." />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Mostrar mensaje de configuración SIIGO si no está configurado
  if (noSiigoConfig) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pérdidas y Ganancias</h1>
            <p className="text-gray-700 mt-1">Estado financiero con datos en tiempo real desde SIIGO</p>
          </div>
        </div>
        
        <Card className="p-12">
          <div className="text-center">
            <div className="text-blue-500 mb-6">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Configuración SIIGO Requerida</h3>
            <p className="text-gray-700 mb-8 max-w-2xl mx-auto text-lg">
              Para mostrar el estado de Pérdidas y Ganancias en tiempo real, necesita configurar las credenciales de SIIGO.
            </p>
            <div className="space-y-4">
              <a href="/dashboard/siigo-config">
                <Button variant="primary" className="px-8 py-3 text-lg">
                  Configurar SIIGO
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Pérdidas y Ganancias</h1>
        </div>
        
        <Card className="p-6">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.186-.833-2.956 0L3.857 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error cargando datos de P&G</h3>
            <p className="text-gray-700 mb-4">{error}</p>
            <Button onClick={fetchProfitLoss} variant="primary">
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header con navegación y filtros */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pérdidas y Ganancias</h1>
            <p className="text-gray-700 mt-1">Estado financiero con datos en tiempo real desde SIIGO</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Selector de vista */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Vista:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="px-3 py-2 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="monthly">Mensual</option>
              <option value="quarterly">Trimestral</option>
              <option value="yearly">Anual</option>
            </select>
          </div>

          {/* Filtros de fecha */}
          <div className="flex items-center space-x-2">
            <label htmlFor="startDate" className="text-sm font-medium text-gray-700">Desde:</label>
            <input
              id="startDate"
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="px-3 py-2 text-gray-700 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm min-w-[140px]"
              max={dateRange.end || undefined}
            />
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="endDate" className="text-sm font-medium text-gray-700">Hasta:</label>
            <input
              id="endDate"
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className="px-3 py-2 text-gray-700 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm min-w-[140px]"
              min={dateRange.start || undefined}
            />
          </div>
          <Button onClick={fetchProfitLoss} variant="primary" disabled={loadingStates.profitLoss} className="px-6">
            {loadingStates.profitLoss ? <LoadingSpinner size="sm" /> : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="space-y-8">
        {/* KPI Cards - Mostrar datos o skeleton según estado de carga */}
        {loadingStates.profitLoss && !profitLoss ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-4">
                <ModuleSkeleton title="Cargando..." />
              </Card>
            ))}
          </div>
        ) : profitLoss && pgMetrics ? (
          <PGKPICards 
            metrics={pgMetrics} 
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="text-gray-300 mb-2">
                      <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">Sin datos</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Gráficas principales - SOLO mostrar si hay datos mensuales reales */}
        {loadingStates.profitLoss && !profitLoss ? (
          <Card className="p-6">
            <ModuleSkeleton title="Cargando análisis..." />
          </Card>
        ) : profitLoss && pgMetrics && pgMetrics.monthlySales.length > 0 ? (
          <PGCharts 
            metrics={pgMetrics}
            viewMode={viewMode}
            formatCurrency={formatCurrency}
          />
        ) : profitLoss && pgMetrics ? (
          <Card className="p-6">
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Análisis Mensual No Disponible</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                SIIGO no proporciona datos mensuales detallados. Solo tenemos los totales del período completo ({dateRange.start} a {dateRange.end}).
              </p>
            </div>
          </Card>
        ) : null}

        {/* Segunda fila - SOLO mostrar si hay datos reales de productos/impuestos */}
        {loadingStates.profitLoss && !profitLoss ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <ModuleSkeleton title="Cargando análisis..." />
            </Card>
            <Card className="p-6">
              <ModuleSkeleton title="Cargando análisis..." />
            </Card>
          </div>
        ) : profitLoss && pgMetrics && (pgMetrics.taxBreakdown.length > 0 || pgMetrics.topProducts.length > 0) ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Solo mostrar si hay datos reales de impuestos */}
            {pgMetrics.taxBreakdown.length > 0 ? (
              <TaxBreakdownChart 
                data={pgMetrics.taxBreakdown}
                formatCurrency={formatCurrency}
              />
            ) : (
              <Card className="p-6">
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Desglose de Impuestos No Disponible</h3>
                  <p className="text-gray-600">SIIGO no proporciona desglose detallado de impuestos.</p>
                </div>
              </Card>
            )}

            {/* Solo mostrar si hay datos reales de productos */}
            {pgMetrics.topProducts.length > 0 ? (
              <TopProductsTable 
                products={pgMetrics.topProducts}
                formatCurrency={formatCurrency}
                formatPercentage={formatPercentage}
              />
            ) : (
              <Card className="p-6">
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Top Productos No Disponible</h3>
                  <p className="text-gray-600">SIIGO no proporciona datos detallados de productos en el reporte de P&G.</p>
                </div>
              </Card>
            )}
          </div>
        ) : profitLoss && pgMetrics ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Análisis Detallado No Disponible</h3>
                <p className="text-gray-600">SIIGO solo proporciona totales agregados para P&G. No hay desglose por categorías.</p>
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Datos de Productos No Disponibles</h3>
                <p className="text-gray-600">Para análisis de productos necesita acceso a endpoints adicionales de SIIGO.</p>
              </div>
            </Card>
          </div>
        ) : null}

        {/* Resumen detallado - Mostrar si hay datos o skeleton si está cargando */}
        {loadingStates.profitLoss && !profitLoss ? (
          <Card className="p-6">
            <ModuleSkeleton title="Cargando resumen..." />
          </Card>
        ) : profitLoss && pgMetrics ? (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Resumen Financiero Detallado (SIIGO)</h3>
              <div className="text-sm text-gray-600">
                Período: {dateRange.start} a {dateRange.end}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(pgMetrics.totalSales)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Ingresos Totales (SIIGO)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {pgMetrics.totalInvoices} facturas emitidas
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(pgMetrics.netProfit)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Utilidad Neta (SIIGO)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Margen: {formatPercentage(pgMetrics.profitMargin)}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">
                    {formatCurrency(pgMetrics.totalTaxes)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Impuestos Estimados
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    19% sobre ventas
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(pgMetrics.averageInvoice)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Ticket Promedio (SIIGO)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Por factura
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {/* Mensaje cuando no hay datos y no está cargando */}
        {!loadingStates.profitLoss && !profitLoss && (
          <Card className="p-6">
            <div className="text-center text-gray-700">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay datos disponibles</h3>
              <p className="text-gray-600 mb-4">No se encontraron datos de P&G para el período seleccionado desde SIIGO.</p>
              <Button onClick={fetchProfitLoss} variant="primary">
                Actualizar datos
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}