import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSubdomainFromHeaders, isDevelopment } from '@/lib/subdomain'
import { getCurrentSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import LoginForm from '@/components/auth/LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Verificar si ya está autenticado
  const session = await getCurrentSession()
  if (session) {
    redirect('/dashboard')
  }

  // Obtener parámetros de búsqueda
  const params = await searchParams
  
  // Obtener subdominio
  const headersList = await headers()
  let subdomain = getSubdomainFromHeaders(headersList)
  
  // En desarrollo, usar subdomain de query params si no hay en headers
  if (isDevelopment() && !subdomain && params.subdomain) {
    subdomain = Array.isArray(params.subdomain) ? params.subdomain[0] : params.subdomain
  }

  let company = null
  if (subdomain) {
    // Buscar información de la empresa
    company = await prisma.company.findUnique({
      where: { 
        subdomain: subdomain,
        isActive: true
      }
    })

    if (!company) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Empresa no encontrada</h1>
            <p className="mt-2 text-gray-600">
              La empresa "{subdomain}" no existe o está inactiva.
            </p>
          </div>
        </div>
      )
    }
  }

  return (
    <LoginForm 
      subdomain={subdomain || undefined} 
      companyName={company?.name || undefined}
    />
  )
}
