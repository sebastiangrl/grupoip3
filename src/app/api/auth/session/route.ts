import { NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getCurrentSession()
    
    if (!session) {
      return NextResponse.json({
        success: false,
        isAuthenticated: false
      })
    }

    // Retornar datos del usuario (sin password)
    const { password: _, ...userWithoutPassword } = session.user
    
    return NextResponse.json({
      success: true,
      isAuthenticated: true,
      data: {
        user: userWithoutPassword,
        company: session.user.company
      }
    })
  } catch (error) {
    console.error('Error obteniendo sesión:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
