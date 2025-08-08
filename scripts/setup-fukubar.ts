import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupFukubarWithSiigo() {
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

    console.log('\n🎉 ¡Fukubar configurado exitosamente!');
    console.log('\n📊 Datos de acceso:');
    console.log(`🌐 URL: fukubar.grupoip3.com`);
    console.log(`👤 Email: Ximenaagredo22@gmail.com`);
    console.log(`🔐 Password: 123456`);
    console.log(`🔑 SIIGO API: Configurada`);
    console.log(`📈 Dashboards: PG, CXC, CXP, Balance`);

  } catch (error) {
    console.error('❌ Error configurando Fukubar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupFukubarWithSiigo();
