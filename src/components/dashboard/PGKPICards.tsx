'use client';

import { Card } from '@/components/ui/Card';
import { PGMetrics } from '@/hooks/use-pg-metrics';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface PGKPICardsProps {
  metrics: PGMetrics;
  formatCurrency: (amount: number) => string;
  formatPercentage: (value: number) => string;
}

export function PGKPICards({ metrics, formatCurrency, formatPercentage }: PGKPICardsProps) {
  const kpis = [
    {
      title: 'Ventas Totales',
      value: formatCurrency(metrics.totalSales),
      icon: CurrencyDollarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      subtitle: `${metrics.totalInvoices.toLocaleString()} facturas`,
    },
    {
      title: 'Ganancia Neta',
      value: formatCurrency(metrics.netProfit),
      icon: ArrowTrendingUpIcon,
      color: metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: metrics.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50',
      subtitle: `Margen: ${formatPercentage(metrics.profitMargin)}`,
    },
    {
      title: 'Total Impuestos',
      value: formatCurrency(metrics.totalTaxes),
      icon: BuildingLibraryIcon,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      subtitle: `${formatPercentage((metrics.totalTaxes / metrics.totalSales) * 100)} de ventas`,
    },
    {
      title: 'Promedio Factura',
      value: formatCurrency(metrics.averageInvoice),
      icon: ChartBarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      subtitle: 'Ticket promedio',
    },
    {
      title: 'Retenciones',
      value: formatCurrency(metrics.totalRetentions),
      icon: DocumentTextIcon,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      subtitle: `${formatPercentage((metrics.totalRetentions / metrics.totalSales) * 100)} de ventas`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpis.map((kpi, index) => (
        <Card key={index} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              {kpi.title}
            </p>
            <div className={`h-8 w-8 ${kpi.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
          </div>
          
          <div>
            <p className="text-lg lg:text-xl font-bold text-gray-900 mb-1 truncate">
              {kpi.value}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {kpi.subtitle}
            </p>
          </div>
          
          {/* Indicator bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === 1 && metrics.netProfit >= 0 ? 'bg-green-500' :
                  index === 1 && metrics.netProfit < 0 ? 'bg-red-500' :
                  'bg-blue-500'
                }`}
                style={{ 
                  width: index === 1 ? // Ganancia Neta
                    `${Math.min(Math.abs(metrics.profitMargin), 100)}%` :
                    index === 2 ? // Impuestos
                    `${Math.min((metrics.totalTaxes / metrics.totalSales) * 100, 100)}%` :
                    index === 4 ? // Retenciones
                    `${Math.min((metrics.totalRetentions / metrics.totalSales) * 100, 100)}%` :
                    '75%' // Valor por defecto para otros KPIs
                }}
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
