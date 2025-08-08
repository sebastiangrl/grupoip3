/**
 * Extrae el subdominio de una URL o host
 * Ejemplos:
 * - fukubar.grupoip3.com -> fukubar
 * - grupopance.grupoip3.com -> grupopance
 * - localhost:3000 -> null (desarrollo)
 */
export function extractSubdomain(host: string): string | null {
  // Remover puerto si existe
  const hostname = host.split(':')[0]
  
  // En desarrollo (localhost), no hay subdominio
  if (hostname === 'localhost' || hostname.startsWith('127.0.0.1') || hostname.startsWith('192.168.')) {
    return null
  }

  // Dividir por puntos
  const parts = hostname.split('.')
  
  // Si solo hay 2 partes (ejemplo.com), no hay subdominio
  if (parts.length <= 2) {
    return null
  }

  // El subdominio es la primera parte
  const subdomain = parts[0]
  
  // Verificar que no sea 'www'
  if (subdomain === 'www') {
    return null
  }

  return subdomain
}

/**
 * Obtiene el subdominio desde headers de Next.js
 */
export function getSubdomainFromHeaders(headers: Headers): string | null {
  const host = headers.get('host')
  if (!host) return null
  
  return extractSubdomain(host)
}

/**
 * Genera la URL completa para un subdominio
 */
export function buildSubdomainUrl(subdomain: string, path: string = ''): string {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'grupoip3.com'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const port = process.env.NODE_ENV === 'production' ? '' : ':3000'
  
  return `${protocol}://${subdomain}.${rootDomain}${port}${path}`
}

/**
 * Verifica si estamos en modo desarrollo
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Obtiene el subdominio para desarrollo (desde query params o cookies)
 */
export function getDevSubdomain(searchParams?: URLSearchParams): string | null {
  if (!isDevelopment()) return null
  
  // En desarrollo, podemos simular subdominios con query params
  return searchParams?.get('subdomain') || null
}
