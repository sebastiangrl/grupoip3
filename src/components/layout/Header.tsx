'use client'

import { useAuth } from '@/hooks/use-auth'
import { BellIcon } from '@heroicons/react/24/outline'

export default function Header() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb o título de página */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Dashboard
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button
            type="button"
            className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2D5AA0] focus:ring-offset-2"
          >
            <BellIcon className="h-6 w-6" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-400 text-xs text-white flex items-center justify-center">
              3
            </span>
          </button>

          {/* User info */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-[#2D5AA0] flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
