import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  try {
    await clearAuthCookie()
    
    return NextResponse.json({
      success: true,
      message: 'Logout exitoso'
    })
  } catch (error) {
    console.error('Error en logout:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
