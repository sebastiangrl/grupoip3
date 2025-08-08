'use client'

import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { CurrencyDollarIcon, DocumentTextIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline'

// Componente para KPI Cards
function KPICard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  color = 'blue' 
}: {
  title: string
  value: string
  description: string
  icon: any
  color?: 'blue' | 'green' | 'orange' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`rounded-md p-3 ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user.firstName}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Resumen del estado financiero de {user.company.name}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Ventas del Mes"
          value="$45,230,000"
          description="+12% vs mes anterior"
          icon={CurrencyDollarIcon}
          color="green"
        />
        <KPICard
          title="Facturas Pendientes"
          value="23"
          description="Por $8,450,000"
          icon={DocumentTextIcon}
          color="orange"
        />
        <KPICard
          title="Cuentas por Cobrar"
          value="$12,340,000"
          description="Cartera total"
          icon={ChartBarIcon}
          color="blue"
        />
        <KPICard
          title="Cuentas por Pagar"
          value="$6,780,000"
          description="Próximos 30 días"
          icon={UserGroupIcon}
          color="red"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ventas Mensuales</CardTitle>
            <CardDescription>
              Evolución de ventas en los últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Gráfico de ventas (Próximamente)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Cartera</CardTitle>
            <CardDescription>
              Distribución de cuentas por cobrar por antigüedad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Gráfico de cartera (Próximamente)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>
            Últimas transacciones y movimientos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { type: 'Factura', description: 'Factura #001234 creada', amount: '$1,250,000', time: 'Hace 2 horas' },
              { type: 'Pago', description: 'Pago recibido de Cliente ABC', amount: '$850,000', time: 'Hace 4 horas' },
              { type: 'Compra', description: 'Compra a Proveedor XYZ', amount: '$420,000', time: 'Ayer' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{activity.description}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{activity.amount}</p>
                  <p className="text-sm text-gray-500">{activity.type}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Tareas comunes del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <button className="flex flex-col items-center p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <DocumentTextIcon className="h-8 w-8 text-[#2D5AA0] mb-2" />
              <span className="text-sm font-medium">Nueva Factura</span>
            </button>
            <button className="flex flex-col items-center p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <CurrencyDollarIcon className="h-8 w-8 text-[#2D5AA0] mb-2" />
              <span className="text-sm font-medium">Registrar Pago</span>
            </button>
            <button className="flex flex-col items-center p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <ChartBarIcon className="h-8 w-8 text-[#2D5AA0] mb-2" />
              <span className="text-sm font-medium">Ver Reportes</span>
            </button>
            <button className="flex flex-col items-center p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <UserGroupIcon className="h-8 w-8 text-[#2D5AA0] mb-2" />
              <span className="text-sm font-medium">Gestionar Usuarios</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
