import { User, Company, UserRole } from '@prisma/client'

export interface AuthUser extends User {
  company: Company
}

export interface SessionData {
  user: AuthUser
  isAuthenticated: boolean
}

export interface LoginCredentials {
  email: string
  password: string
  subdomain: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface DashboardData {
  totalSales: number
  totalInvoices: number
  averageTicket: number
  pendingReceivables: number
  overdueReceivables: number
  totalPayables: number
  overduePayables: number
}

export interface SiigoCredentials {
  username: string
  accessKey: string
  partnerId?: string
}

export type UserPermissions = {
  canViewDashboards: boolean
  canViewPG: boolean
  canViewCXC: boolean
  canViewCXP: boolean
  canViewBalance: boolean
  canManageUsers: boolean
  canManageCompany: boolean
  canViewReports: boolean
  canExportData: boolean
}

export const getRolePermissions = (role: UserRole): UserPermissions => {
  const basePermissions: UserPermissions = {
    canViewDashboards: false,
    canViewPG: false,
    canViewCXC: false,
    canViewCXP: false,
    canViewBalance: false,
    canManageUsers: false,
    canManageCompany: false,
    canViewReports: false,
    canExportData: false,
  }

  switch (role) {
    case 'ADMIN':
      return {
        canViewDashboards: true,
        canViewPG: true,
        canViewCXC: true,
        canViewCXP: true,
        canViewBalance: true,
        canManageUsers: true,
        canManageCompany: true,
        canViewReports: true,
        canExportData: true,
      }

    case 'MANAGER':
      return {
        ...basePermissions,
        canViewDashboards: true,
        canViewPG: true,
        canViewCXC: true,
        canViewCXP: true,
        canViewBalance: true,
        canViewReports: true,
        canExportData: true,
      }

    case 'ACCOUNTANT':
      return {
        ...basePermissions,
        canViewDashboards: true,
        canViewPG: true,
        canViewCXC: true,
        canViewCXP: true,
        canViewBalance: true,
        canViewReports: true,
      }

    case 'VIEWER':
      return {
        ...basePermissions,
        canViewDashboards: true,
        canViewPG: true,
        canViewCXC: true,
        canViewCXP: true,
        canViewBalance: true,
      }

    default:
      return basePermissions
  }
}
