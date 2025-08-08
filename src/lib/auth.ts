import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { AuthUser, SessionData } from './types'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-super-secret-jwt-key'
const COOKIE_NAME = 'auth-token'

/**
 * Autentica un usuario por email, password y subdominio
 */
export async function authenticateUser(
  email: string, 
  password: string, 
  subdomain: string
): Promise<AuthUser | null> {
  try {
    // Buscar la empresa por subdominio
    const company = await prisma.company.findUnique({
      where: { 
        subdomain: subdomain,
        isActive: true
      }
    })

    if (!company) {
      throw new Error('Empresa no encontrada')
    }

    // Buscar el usuario por email y empresa
    const user = await prisma.user.findUnique({
      where: {
        email_companyId: {
          email: email,
          companyId: company.id
        },
        isActive: true
      },
      include: {
        company: true
      }
    })

    if (!user) {
      throw new Error('Usuario no encontrado para esta empresa')
    }

    // Verificar password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas')
    }

    // Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    return user
  } catch (error) {
    console.error('Error en autenticación:', error)
    return null
  }
}

/**
 * Crea un token JWT para el usuario
 */
export function createAuthToken(user: AuthUser): string {
  const payload = {
    userId: user.id,
    email: user.email,
    companyId: user.companyId,
    role: user.role,
    subdomain: user.company.subdomain
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Verifica y decodifica un token JWT
 */
export function verifyAuthToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * Guarda el token de autenticación en cookies
 */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: '/'
  })
}

/**
 * Elimina el token de autenticación
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/**
 * Obtiene el token de autenticación desde cookies
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)
  return token?.value || null
}

/**
 * Obtiene la sesión actual del usuario
 */
export async function getCurrentSession(): Promise<SessionData | null> {
  try {
    const token = await getAuthToken()
    if (!token) return null

    const decoded = verifyAuthToken(token)
    if (!decoded) return null

    // Obtener datos actualizados del usuario
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        isActive: true
      },
      include: {
        company: true
      }
    })

    if (!user || !user.company.isActive) return null

    return {
      user,
      isAuthenticated: true
    }
  } catch (error) {
    console.error('Error obteniendo sesión:', error)
    return null
  }
}

/**
 * Middleware para proteger rutas - requiere autenticación
 */
export async function requireAuth(): Promise<SessionData> {
  const session = await getCurrentSession()
  
  if (!session || !session.isAuthenticated) {
    redirect('/login')
  }

  return session
}

/**
 * Middleware para verificar permisos de rol
 */
export async function requireRole(allowedRoles: string[]): Promise<SessionData> {
  const session = await requireAuth()
  
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/dashboard?error=insufficient-permissions')
  }

  return session
}

/**
 * Cierra la sesión del usuario
 */
export async function logout() {
  await clearAuthCookie()
  redirect('/login')
}
