import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { getCurrentSession } from '@/lib/auth';

// GET /api/siigo/config - Obtener configuración SIIGO
export async function GET() {
  console.log('🔧 GET /api/siigo/config - Starting...');
  
  try {
    const session = await getCurrentSession();
    console.log('🔧 Session result:', {
      hasSession: !!session,
      isAuthenticated: session?.isAuthenticated,
      userId: session?.user?.id,
      companyId: session?.user?.companyId
    });
    
    if (!session?.isAuthenticated) {
      console.log('🔧 Authentication failed, returning 401');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Intentar obtener company con reintentos
    let company = null;
    let retries = 3;
    
    while (retries > 0 && !company) {
      try {
        company = await prisma.company.findUnique({
          where: { id: session.user.companyId },
          select: {
            id: true,
            name: true,
            siigoUsername: true,
            siigoPartnerId: true,
            siigoAccessKey: true, // Need this to check if configured
          },
        });
        break;
      } catch (prismaError) {
        retries--;
        console.warn(`Company query retry ${3 - retries}/3:`, prismaError);
        
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: company.id,
        name: company.name,
        siigoUsername: company.siigoUsername,
        siigoPartnerId: company.siigoPartnerId,
        hasAccessKey: !!company.siigoAccessKey, // Indicate if configured
      }
    });
  } catch (error) {
    console.error('Error fetching SIIGO config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SIIGO configuration' },
      { status: 500 }
    );
  }
}

// POST /api/siigo/config - Configurar credenciales SIIGO
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { username, accessKey, partnerId } = await request.json();

    if (!username || !accessKey) {
      return NextResponse.json(
        { error: 'Username and access key are required' },
        { status: 400 }
      );
    }

    // Encrypt the access key before storing
    const encryptedAccessKey = encrypt(accessKey);

    // Intentar actualizar company con reintentos
    let updatedCompany = null;
    let retries = 3;
    
    while (retries > 0 && !updatedCompany) {
      try {
        updatedCompany = await prisma.company.update({
          where: { id: session.user.companyId },
          data: {
            siigoUsername: username,
            siigoAccessKey: encryptedAccessKey,
            siigoPartnerId: partnerId || 'GrupoIP3Dashboard',
          },
          select: {
            id: true,
            name: true,
            siigoUsername: true,
            siigoPartnerId: true,
          },
        });
        break;
      } catch (prismaError) {
        retries--;
        console.warn(`Company update retry ${3 - retries}/3:`, prismaError);
        
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          throw prismaError;
        }
      }
    }

    // Test the connection
    try {
      const { createSiigoClient } = await import('@/lib/siigo/client');
      const siigoClient = await createSiigoClient(session.user.companyId);
      await siigoClient.authenticate();
      
      console.log(`✅ SIIGO credentials validated for ${updatedCompany?.name}`);
    } catch (testError) {
      console.warn(`⚠️ SIIGO credentials saved but connection test failed:`, testError);
      
      // Return warning but don't fail the save
      return NextResponse.json({
        success: true,
        message: 'Credenciales guardadas, pero la conexión con SIIGO falló. Verifique que sean correctas.',
        warning: true,
        data: updatedCompany,
        testError: testError instanceof Error ? testError.message : 'Error de conexión'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'SIIGO configuration saved successfully',
      data: updatedCompany,
    });
  } catch (error) {
    console.error('Error saving SIIGO config:', error);
    return NextResponse.json(
      { error: 'Failed to save SIIGO configuration' },
      { status: 500 }
    );
  }
}

// DELETE /api/siigo/config - Eliminar configuración SIIGO
export async function DELETE() {
  try {
    const session = await getCurrentSession();
    if (!session?.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Intentar eliminar configuración con reintentos
    let retries = 3;
    
    while (retries > 0) {
      try {
        await prisma.company.update({
          where: { id: session.user.companyId },
          data: {
            siigoUsername: null,
            siigoAccessKey: null,
            siigoPartnerId: null,
          },
        });
        break;
      } catch (prismaError) {
        retries--;
        console.warn(`Company delete retry ${3 - retries}/3:`, prismaError);
        
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          throw prismaError;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'SIIGO configuration removed successfully',
    });
  } catch (error) {
    console.error('Error removing SIIGO config:', error);
    return NextResponse.json(
      { error: 'Failed to remove SIIGO configuration' },
      { status: 500 }
    );
  }
}
