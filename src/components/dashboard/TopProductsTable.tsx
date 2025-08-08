'use client';

import { Card } from '@/components/ui/Card';
import { PGMetrics } from '@/hooks/use-pg-metrics';
import { CubeIcon } from '@heroicons/react/24/outline';

interface TopProductsTableProps {
  products: PGMetrics['topProducts'];
  formatCurrency: (amount: number) => string;
  formatPercentage: (value: number) => string;
}

export function TopProductsTable({ products, formatCurrency, formatPercentage }: TopProductsTableProps) {
  if (!products || products.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center mb-6">
          <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
            <CubeIcon className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Top Productos</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">No hay datos de productos disponibles</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center mb-6">
        <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
          <CubeIcon className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Top Productos por Revenue</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                #
              </th>
              <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Producto
              </th>
              <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Cantidad
              </th>
              <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Revenue
              </th>
              <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                % del Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product, index) => (
              <tr key={`${product.code}-${index}`} className="hover:bg-gray-50">
                <td className="py-3 px-2">
                  <div className="flex items-center">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-blue-600' :
                      index === 1 ? 'bg-blue-500' :
                      index === 2 ? 'bg-blue-400' :
                      'bg-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {product.description}
                    </div>
                    {product.code && product.code !== 'SIN_CODIGO' && (
                      <div className="text-xs text-gray-500 mt-1">
                        {product.code}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {product.quantity.toLocaleString('es-CO')}
                  </div>
                </td>
                <td className="py-3 px-2 text-right">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {formatCurrency(product.revenue)}
                  </div>
                </td>
                <td className="py-3 px-2 text-right">
                  <div className="flex items-center justify-end">
                    <div className="text-xs font-medium text-gray-700 mr-2 min-w-0">
                      {formatPercentage(product.percentage)}
                    </div>
                    <div className="w-8 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(product.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumen al final */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            {products.length} productos principales
          </span>
          <span>
            {formatPercentage(products.reduce((sum, p) => sum + p.percentage, 0))} del total
          </span>
        </div>
      </div>
    </Card>
  );
}
