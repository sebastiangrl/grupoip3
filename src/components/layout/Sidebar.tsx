'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { getRolePermissions } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ScaleIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: ChartBarIcon,
    permission: 'canViewDashboards',
  },
  {
    name: 'P&G',
    href: '/dashboard/pg',
    icon: CurrencyDollarIcon,
    permission: 'canViewPG',
    description: 'Pérdidas y Ganancias',
  },
  {
    name: 'CXC',
    href: '/dashboard/cxc',
    icon: DocumentTextIcon,
    permission: 'canViewCXC',
    description: 'Cuentas por Cobrar',
  },
  {
    name: 'CXP',
    href: '/dashboard/cxp',
    icon: DocumentTextIcon,
    permission: 'canViewCXP',
    description: 'Cuentas por Pagar',
  },
  {
    name: 'Balance',
    href: '/dashboard/balance',
    icon: ScaleIcon,
    permission: 'canViewBalance',
    description: 'Balance de Prueba',
  },
  {
    name: 'Usuarios',
    href: '/dashboard/users',
    icon: UserGroupIcon,
    permission: 'canManageUsers',
  },
  {
    name: 'Configuración',
    href: '/dashboard/settings',
    icon: Cog6ToothIcon,
    permission: 'canManageCompany',
  },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  if (!user) return null

  const permissions = getRolePermissions(user.role)
  const filteredNavigation = navigation.filter(item => {
    const permission = item.permission as keyof typeof permissions
    return permissions[permission]
  })

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo y empresa */}
      <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-6">
        <div className="flex items-center space-x-3">
          <div 
            className="h-8 w-8 rounded-lg"
            style={{ backgroundColor: user.company.primaryColor }}
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{user.company.name}</h2>
            <p className="text-xs text-gray-500">Sistema Contable</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-2 py-4">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center rounded-md px-2 py-2 text-sm font-medium'
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 h-6 w-6 shrink-0'
                  )}
                />
                <div>
                  <div>{item.name}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500">{item.description}</div>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* User info y logout */}
        <div className="border-t border-gray-200 p-4">
          <div className="mb-3 flex items-center">
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex items-center space-x-3">
            <div 
              className="h-8 w-8 rounded-lg"
              style={{ backgroundColor: user.company.primaryColor }}
            />
            <h1 className="text-lg font-semibold text-gray-900">{user.company.name}</h1>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div 
        className={cn(
          "relative z-50 lg:hidden",
          isMobileMenuOpen ? "block" : "hidden"
        )}
      >
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setIsMobileMenuOpen(false)} />
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button
                type="button"
                className="-m-2.5 p-2.5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
              <SidebarContent />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white">
          <SidebarContent />
        </div>
      </div>
    </>
  )
}
