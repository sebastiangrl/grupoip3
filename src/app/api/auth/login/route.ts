import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, createAuthToken, setAuthCookie } from '@/lib/auth'
import { getSubdomainFromHeaders, isDevelopment } from '@/lib/subdomain'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, subdomain: bodySubdomain } = body

    // Validar datos requeridos
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y password son requeridos' },
        { status: 400 }
      )
    }

    // Obtener subdominio desde headers o body (para desarrollo)
    let subdomain = getSubdomainFromHeaders(request.headers)
    
    // En desarrollo, usar el subdominio del body si no hay en headers
    if (isDevelopment() && !subdomain && bodySubdomain) {
      subdomain = bodySubdomain
    }

    if (!subdomain) {
      return NextResponse.json(
        { success: false, error: 'No se pudo determinar la empresa' },
        { status: 400 }
      )
    }

    // Autenticar usuario
    const user = await authenticateUser(email, password, subdomain)
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Credenciales inválidas o usuario no encontrado para esta empresa' 
        },
        { status: 401 }
      )
    }

    // Crear token y establecer cookie
    const token = createAuthToken(user)
    await setAuthCookie(token)

    // Retornar datos del usuario (sin password)
    const { password: _, ...userWithoutPassword } = user
    
    return NextResponse.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userWithoutPassword,
        company: user.company
      }
    })

  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
