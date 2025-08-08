'use client';

import { Card } from '@/components/ui/Card';
import { PGMetrics } from '@/hooks/use-pg-metrics';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface PGChartsProps {
  metrics: PGMetrics;
  viewMode: 'monthly' | 'quarterly' | 'yearly';
  formatCurrency: (amount: number) => string;
}

export function PGCharts({ metrics, viewMode, formatCurrency }: PGChartsProps) {
  // Procesar datos según el modo de vista
  const processedData = metrics.monthlySales.map(item => ({
    ...item,
    formattedMonth: format(parseISO(item.month + '-01'), 'MMM yyyy', { locale: es }),
  }));

  // Encontrar valores máximos para escalar gráficos
  const maxSales = Math.max(...processedData.map(d => d.sales));
  const maxProfit = Math.max(...processedData.map(d => d.netProfit));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Ventas Mensuales */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Ventas por Mes</h3>
          <div className="text-sm text-gray-600">
            Total: {formatCurrency(metrics.totalSales)}
          </div>
        </div>
        
        <div className="space-y-4">
          {processedData.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {item.formattedMonth}
                </span>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.sales)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.invoices.toLocaleString()} facturas
                  </div>
                </div>
              </div>
              
              {/* Barra de progreso */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(item.sales / maxSales) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Gráfico de Ganancia Neta */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Ganancia Neta por Mes</h3>
          <div className="text-sm text-gray-600">
            Total: {formatCurrency(metrics.netProfit)}
          </div>
        </div>
        
        <div className="space-y-4">
          {processedData.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {item.formattedMonth}
                </span>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${item.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(item.netProfit)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.netProfit > 0 ? 'Ganancia' : 'Pérdida'}
                  </div>
                </div>
              </div>
              
              {/* Barra de progreso con colores según ganancia/pérdida */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    item.netProfit >= 0 
                      ? 'bg-green-600' 
                      : 'bg-red-600'
                  }`}
                  style={{ 
                    width: `${Math.abs(item.netProfit / maxProfit) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Comparación Ventas vs Impuestos */}
      <Card className="p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Análisis de Ventas vs Impuestos</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
              <span className="text-gray-600">Ventas</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-600 rounded-full mr-2"></div>
              <span className="text-gray-600">Impuestos</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
              <span className="text-gray-600">Ganancia</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {processedData.map((item, index) => (
            <div key={index} className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {item.formattedMonth}
                </span>
                <div className="flex space-x-6 text-sm">
                  <div className="text-right">
                    <div className="text-blue-600 font-semibold text-xs">
                      {formatCurrency(item.sales)}
                    </div>
                    <div className="text-gray-500 text-xs">Ventas</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-600 font-semibold text-xs">
                      {formatCurrency(item.taxes)}
                    </div>
                    <div className="text-gray-500 text-xs">Impuestos</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold text-xs ${item.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.netProfit)}
                    </div>
                    <div className="text-gray-500 text-xs">Ganancia</div>
                  </div>
                </div>
              </div>
              
              {/* Gráfico de barras más simple */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(item.sales / maxSales) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
