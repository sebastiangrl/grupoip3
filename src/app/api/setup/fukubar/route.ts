import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    console.log('🚀 Configurando Fukubar con integración SIIGO...');

    // Verificar si Fukubar ya existe
    let fukubar = await prisma.company.findUnique({
      where: { subdomain: 'fukubar' },
    });

    if (!fukubar) {
      // Crear empresa Fukubar
      fukubar = await prisma.company.create({
        data: {
          name: 'Fukubar',
          subdomain: 'fukubar',
          slug: 'fukubar',
          siigoAccessKey: 'MjlhOWJhNjktYzA4NS00ZjZiLTk4MjgtNWU1ODVjYzRkMTRhOjY3Niw0VDlrL1Q=',
          primaryColor: '#2D5AA0',
          secondaryColor: '#FF6B35',
          isActive: true,
        },
      });
      console.log('✅ Empresa Fukubar creada');
    } else {
      // Actualizar con API key de SIIGO
      fukubar = await prisma.company.update({
        where: { id: fukubar.id },
        data: {
          siigoAccessKey: 'MjlhOWJhNjktYzA4NS00ZjZiLTk4MjgtNWU1ODVjYzRkMTRhOjY3Niw0VDlrL1Q=',
        },
      });
      console.log('✅ API key de SIIGO actualizada para Fukubar');
    }

    // Verificar si el usuario de prueba existe
    const existingUser = await prisma.user.findUnique({
      where: {
        email_companyId: {
          email: 'Ximenaagredo22@gmail.com',
          companyId: fukubar.id,
        },
      },
    });

    if (!existingUser) {
      // Crear usuario de prueba
      const hashedPassword = await bcrypt.hash('123456', 12);
      
      await prisma.user.create({
        data: {
          email: 'Ximenaagredo22@gmail.com',
          password: hashedPassword,
          firstName: 'Ximena',
          lastName: 'Agredo',
          companyId: fukubar.id,
          role: 'ADMIN',
          isActive: true,
        },
      });
      console.log('✅ Usuario de prueba creado para Fukubar');
    } else {
      console.log('✅ Usuario de prueba ya existe');
    }

    // Crear configuraciones de dashboard
    const dashboardTypes = ['PG', 'CXC', 'CXP', 'BALANCE'] as const;
    
    for (const type of dashboardTypes) {
      const existing = await prisma.dashboardConfig.findUnique({
        where: {
          companyId_type: {
            companyId: fukubar.id,
            type,
          },
        },
      });

      if (!existing) {
        await prisma.dashboardConfig.create({
          data: {
            companyId: fukubar.id,
            type,
            config: {
              layout: 'default',
              refreshInterval: 300000, // 5 minutos
              autoRefresh: true,
              charts: {
                enabled: true,
                defaultView: 'monthly',
              },
              filters: {
                defaultDateRange: 'currentYear',
                saveFilters: true,
              },
            },
            isActive: true,
          },
        });
        console.log(`✅ Dashboard ${type} configurado`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Fukubar configurado exitosamente',
      data: {
        company: fukubar,
        siigoConfigured: !!fukubar.siigoAccessKey,
        dashboards: dashboardTypes,
        loginCredentials: {
          url: 'fukubar.grupoip3.com',
          email: 'Ximenaagredo22@gmail.com',
          password: '123456',
        },
      },
    });

  } catch (error) {
    console.error('❌ Error configurando Fukubar:', error);
    return NextResponse.json(
      { 
        error: 'Error configurando Fukubar',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
