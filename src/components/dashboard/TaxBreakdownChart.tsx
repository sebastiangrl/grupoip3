'use client';

import { Card } from '@/components/ui/Card';
import { PGMetrics } from '@/hooks/use-pg-metrics';
import { CalculatorIcon } from '@heroicons/react/24/outline';

interface TaxBreakdownChartProps {
  data: PGMetrics['taxBreakdown'];
  formatCurrency: (amount: number) => string;
}

export function TaxBreakdownChart({ data, formatCurrency }: TaxBreakdownChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center mb-6">
          <div className="h-8 w-8 bg-gray-50 rounded-lg flex items-center justify-center mr-3">
            <CalculatorIcon className="h-5 w-5 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Desglose de Impuestos</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">No hay datos de impuestos disponibles</p>
        </div>
      </Card>
    );
  }

  // Usar solo tonos de gris y azul para consistencia
  const taxColors = [
    'bg-gray-600',
    'bg-gray-500',
    'bg-blue-600',
    'bg-blue-500',
    'bg-gray-400',
    'bg-blue-400'
  ];

  const totalTaxes = data.reduce((sum, tax) => sum + tax.totalAmount, 0);
  const maxAmount = Math.max(...data.map(tax => tax.totalAmount));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-gray-50 rounded-lg flex items-center justify-center mr-3">
            <CalculatorIcon className="h-5 w-5 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Desglose de Impuestos</h3>
        </div>
        <div className="text-sm text-gray-600">
          Total: {formatCurrency(totalTaxes)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de impuestos */}
        <div className="lg:col-span-2 space-y-4">
          {data.map((tax, index) => {
            const colorClass = taxColors[index % taxColors.length];
            
            return (
              <div key={tax.taxName} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 ${colorClass} rounded-full mr-3`}></div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {tax.taxName}
                      </span>
                      <div className="text-xs text-gray-500">
                        {tax.percentage.toFixed(1)}% del total
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(tax.totalAmount)}
                    </div>
                  </div>
                </div>
                
                {/* Barra de progreso */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${colorClass} h-2 rounded-full transition-all duration-300`}
                    style={{ 
                      width: `${(tax.totalAmount / maxAmount) * 100}%`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen estadístico */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">
                {data.length}
              </div>
              <div className="text-sm text-gray-600">
                Tipos de impuestos
              </div>
            </div>
          </div>

          {data.length > 0 && (
            <>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(data[0].totalAmount)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Impuesto principal
                  </div>
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {data[0].taxName}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-700">
                    {(data[0].percentage).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    Participación principal
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Impuestos adicionales */}
          {data.length > 1 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Otros impuestos</h4>
              <div className="space-y-2">
                {data.slice(1, 3).map((tax, index) => (
                  <div key={tax.taxName} className="flex justify-between items-center text-xs">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 ${taxColors[(index + 1) % taxColors.length]} rounded-full mr-2`}></div>
                      <span className="text-gray-600 truncate">
                        {tax.taxName}
                      </span>
                    </div>
                    <span className="font-medium text-gray-700">
                      {tax.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
              {data.length > 3 && (
                <div className="text-xs text-gray-400 mt-2">
                  +{data.length - 3} más
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900">
              {formatCurrency(totalTaxes)}
            </div>
            <div className="text-gray-500 text-xs">Total impuestos</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">
              {formatCurrency(totalTaxes / data.length)}
            </div>
            <div className="text-gray-500 text-xs">Promedio por tipo</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900 truncate">
              {data[0]?.taxName || 'N/A'}
            </div>
            <div className="text-gray-500 text-xs">Principal</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
