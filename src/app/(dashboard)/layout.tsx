'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Sidebar 
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        {/* Main content area */}
        <div className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}>
          <Header />
          
          {/* Page content */}
          <main className="py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-lg shadow-sm min-h-[calc(100vh-12rem)]">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
