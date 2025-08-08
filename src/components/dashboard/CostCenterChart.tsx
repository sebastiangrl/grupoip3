'use client';

import { Card } from '@/components/ui/Card';
import { PGMetrics } from '@/hooks/use-pg-metrics';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

interface CostCenterChartProps {
  data: PGMetrics['salesByCostCenter'];
  formatCurrency: (amount: number) => string;
}

export function CostCenterChart({ data, formatCurrency }: CostCenterChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center mb-6">
          <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
            <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Ventas por Centro de Costo</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">No hay datos de centros de costo disponibles</p>
        </div>
      </Card>
    );
  }

  // Usar tonos de azul y gris para consistencia
  const colors = [
    'bg-blue-600',
    'bg-blue-500',
    'bg-blue-400',
    'bg-gray-600',
    'bg-gray-500',
    'bg-gray-400'
  ];

  const maxSales = Math.max(...data.map(d => d.sales));

  return (
    <Card className="p-6">
      <div className="flex items-center mb-6">
        <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
          <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Ventas por Centro de Costo</h3>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.costCenter} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className={`w-3 h-3 ${colors[index % colors.length]} rounded-full mr-3`}></div>
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {item.costCenter === 'Sin asignar' ? 'Sin asignar' : item.costCenter}
                  </span>
                  <div className="text-xs text-gray-500">
                    {item.invoices?.toLocaleString() || 0} facturas
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {formatCurrency(item.sales)}
                </div>
                <div className="text-xs text-gray-500">
                  {item.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
            
            {/* Barra de progreso */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`${colors[index % colors.length]} h-2 rounded-full transition-all duration-300`}
                style={{ 
                  width: `${(item.sales / maxSales) * 100}%`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Resumen total */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            {data.length} centros de costo
          </span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(data.reduce((sum, item) => sum + item.sales, 0))}
          </span>
        </div>
      </div>

      {/* Distribución simplificada */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Distribución</h4>
        <div className="space-y-1">
          {data.slice(0, 3).map((item, index) => (
            <div key={item.costCenter} className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <div className={`w-2 h-2 ${colors[index % colors.length]} rounded-full mr-2`}></div>
                <span className="text-gray-600 truncate">
                  {item.costCenter === 'Sin asignar' ? 'Sin asignar' : item.costCenter}
                </span>
              </div>
              <span className="font-medium text-gray-900">
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          ))}
          {data.length > 3 && (
            <div className="text-xs text-gray-400 mt-1">
              +{data.length - 3} más
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
