import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createSiigoClient } from '@/lib/siigo/client';

// POST /api/siigo/test-connection - Probar conexión SIIGO
export async function POST() {
  console.log('🔧 POST /api/siigo/test-connection - Starting connection test...');
  
  try {
    const session = await getCurrentSession();
    if (!session?.isAuthenticated) {
      console.log('🔧 Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔧 Testing SIIGO connection for company:', session.user.companyId);

    // Try to create and authenticate with SIIGO
    try {
      const siigoClient = await createSiigoClient(session.user.companyId);
      await siigoClient.authenticate();
      
      console.log('✅ SIIGO connection test successful');
      
      return NextResponse.json({
        success: true,
        message: 'Conexión exitosa con SIIGO API',
        data: {
          status: 'connected',
          timestamp: new Date().toISOString()
        }
      });
    } catch (siigoError) {
      console.error('❌ SIIGO connection test failed:', siigoError);
      
      // Check if it's an authentication error
      if (siigoError instanceof Error && siigoError.message.includes('Auth failed')) {
        return NextResponse.json({
          success: false,
          error: 'Credenciales SIIGO inválidas. Verifique su usuario y access key.',
          details: siigoError.message
        }, { status: 400 });
      }
      
      // Check if it's a rate limit error
      if (siigoError instanceof Error && siigoError.message.includes('429')) {
        return NextResponse.json({
          success: false,
          error: 'Límite de peticiones excedido. Intente nuevamente en unos segundos.',
          details: siigoError.message
        }, { status: 429 });
      }
      
      // Generic SIIGO error
      return NextResponse.json({
        success: false,
        error: 'Error conectando con SIIGO API',
        details: siigoError instanceof Error ? siigoError.message : 'Error desconocido'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in SIIGO connection test:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
