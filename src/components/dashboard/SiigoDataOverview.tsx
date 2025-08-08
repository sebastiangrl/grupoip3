import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSiigoData } from '@/hooks/use-siigo-data';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { DashboardSkeleton, ModuleSkeleton } from '@/components/ui/DashboardSkeleton';
import Link from 'next/link';

export function SiigoDataOverview() {
  const {
    profitLoss,
    accountsReceivable,
    accountsPayable,
    trialBalance,
    isLoading,
    loadingStates,
    error,
    dateRange,
    setDateRange,
    fetchAllData,
    formatCurrency,
    formatPercentage,
    hasData,
    lastUpdated,
    noSiigoConfig,
    checkingConfig,
    checkSiigoConfig,
  } = useSiigoData();

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
    return <DashboardSkeleton />;
  }

  // Mostrar mensaje de configuración SIIGO
  if (noSiigoConfig) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="md:col-span-2 lg:col-span-4 p-12">
          <div className="text-center">
            <div className="text-blue-500 mb-6">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Configuración SIIGO Requerida</h3>
            <p className="text-gray-700 mb-8 max-w-2xl mx-auto text-lg">
              Para mostrar datos contables en tiempo real, necesita configurar las credenciales de SIIGO. 
              Una vez configurado, podrá ver informes de P&G, CXC, CXP y Balance de Prueba.
            </p>
            <div className="space-y-4">
              <Link href="/dashboard/siigo-config">
                <Button variant="primary" className="px-8 py-3 text-lg">
                  Configurar SIIGO
                </Button>
              </Link>
              <div className="pt-2">
                <Button 
                  onClick={checkSiigoConfig} 
                  variant="secondary" 
                  className="text-sm"
                >
                  ¿Ya configuraste? Verificar
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                ¿No tiene credenciales? Contáctenos para obtener ayuda.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="md:col-span-2 lg:col-span-4 p-6">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.186-.833-2.956 0L3.857 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error cargando datos de SIIGO</h3>
            <p className="text-gray-700 mb-4">{error}</p>
            <Button onClick={fetchAllData} variant="primary">
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header con filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Contable</h2>
          <p className="text-gray-700 mt-1">Datos en tiempo real desde SIIGO</p>
          {hasData && lastUpdated && (
            <p className="text-sm text-gray-600 mt-2">
              Última actualización: {lastUpdated}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="startDate" className="text-sm font-medium text-gray-800">Desde:</label>
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
          <Button onClick={fetchAllData} variant="primary" disabled={isLoading} className="px-6">
            {isLoading ? <LoadingSpinner size="sm" /> : 'Actualizar'}
          </Button>
        </div>
      </div>      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* P&G */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Ganancia Neta</p>
            <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          {loadingStates.profitLoss ? (
            <ModuleSkeleton title="P&G" />
          ) : profitLoss ? (
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {formatCurrency(profitLoss.netProfit)}
              </p>
              <p className="text-sm text-gray-700">
                Margen: <span className="font-medium">{formatPercentage(profitLoss.margin)}</span>
              </p>
            </div>
          ) : (
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
          )}
        </Card>

        {/* CXC */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Cuentas por Cobrar</p>
            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
          </div>
          {loadingStates.accountsReceivable ? (
            <ModuleSkeleton title="CXC" />
          ) : accountsReceivable ? (
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {formatCurrency(accountsReceivable.total)}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">{accountsReceivable.count}</span> facturas pendientes
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-gray-300 mb-2">
                  <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Sin datos</p>
              </div>
            </div>
          )}
        </Card>

        {/* CXP */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Cuentas por Pagar</p>
            <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          {loadingStates.accountsPayable ? (
            <ModuleSkeleton title="CXP" />
          ) : accountsPayable ? (
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {formatCurrency(accountsPayable.total)}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">{accountsPayable.count}</span> pagos pendientes
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-gray-300 mb-2">
                  <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Sin datos</p>
              </div>
            </div>
          )}
        </Card>

        {/* Balance */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Balance</p>
            <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          {loadingStates.trialBalance ? (
            <ModuleSkeleton title="Balance" />
          ) : trialBalance ? (
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {formatCurrency(trialBalance.totals.assets)}
              </p>
              <p className={`text-sm font-medium ${trialBalance.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                {trialBalance.isBalanced ? '✓ Balanceado' : '✗ Desbalanceado'}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-gray-300 mb-2">
                  <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Sin datos</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Resumen detallado */}
      {(hasData || loadingStates.accountsReceivable) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Deudores */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-6">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Top Deudores</h3>
            </div>
            {loadingStates.accountsReceivable ? (
              <ModuleSkeleton title="Cargando deudores..." />
            ) : accountsReceivable?.topDebtors && accountsReceivable.topDebtors.length > 0 ? (
              <div className="space-y-4">
                {accountsReceivable.topDebtors.slice(0, 5).map((debtor, index) => (
                  <div key={debtor.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{debtor.name}</p>
                        <p className="text-sm text-gray-700">{debtor.count} facturas</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(debtor.total)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-gray-300 mb-2">
                    <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Sin deudores</p>
                </div>
              </div>
            )}
          </Card>

          {/* Aging de Cartera */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-6">
              <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Aging de Cartera</h3>
            </div>
            {loadingStates.accountsReceivable ? (
              <ModuleSkeleton title="Cargando aging..." />
            ) : accountsReceivable?.aging ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-green-400 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">Corriente (0-30 días)</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(accountsReceivable.aging.current)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-yellow-400 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">31-60 días</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(accountsReceivable.aging.days30)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-orange-400 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">61-90 días</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(accountsReceivable.aging.days60)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-red-400 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">+90 días</span>
                  </div>
                  <span className="font-semibold text-red-600">{formatCurrency(accountsReceivable.aging.days90)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-gray-300 mb-2">
                    <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Sin aging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {!hasData && !isLoading && (
        <Card className="p-12 text-center">
          <div className="text-gray-300 mb-6">
            <svg className="mx-auto h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No hay datos disponibles</h3>
          <p className="text-gray-700 mb-6 max-w-md mx-auto">
            Configure la integración con SIIGO para ver los datos contables en tiempo real.
          </p>
          <Button onClick={fetchAllData} variant="primary" className="px-8 py-3">
            Cargar Datos
          </Button>
        </Card>
      )}
    </div>
  );
}
