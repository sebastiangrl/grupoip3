import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || session.user.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Verificar si la empresa tiene credenciales de SIIGO configuradas
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        siigoUsername: true,
        siigoAccessKey: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const hasCredentials = !!(company.siigoUsername && company.siigoAccessKey);

    return NextResponse.json({
      success: true,
      data: {
        companyId: company.id,
        companyName: company.name,
        hasCredentials,
        isConfigured: hasCredentials,
      },
    });

  } catch (error) {
    console.error('Error checking SIIGO status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
