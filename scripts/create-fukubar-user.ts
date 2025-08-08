import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createFukubarUser() {
  console.log('🏢 Creando empresa Fukubar...')

  // Crear empresa Fukubar
  const fukubar = await prisma.company.upsert({
    where: { subdomain: 'fukubar' },
    update: {},
    create: {
      name: 'Fukubar',
      subdomain: 'fukubar',
      slug: 'fukubar',
      primaryColor: '#2D5AA0',
      secondaryColor: '#FF6B35',
      isActive: true,
    },
  })

  console.log('✅ Empresa Fukubar creada:', fukubar.name, 'ID:', fukubar.id)

  // Hash del password
  const passwordHash = await bcrypt.hash('123456', 12)

  // Crear usuario Ximena
  const user = await prisma.user.upsert({
    where: {
      email_companyId: {
        email: 'Ximenaagredo22@gmail.com',
        companyId: fukubar.id,
      },
    },
    update: {
      password: passwordHash,
      firstName: 'Ximena',
      lastName: 'Agredo',
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      email: 'Ximenaagredo22@gmail.com',
      password: passwordHash,
      firstName: 'Ximena',
      lastName: 'Agredo',
      companyId: fukubar.id,
      role: UserRole.ADMIN,
      isActive: true,
    },
  })

  console.log('✅ Usuario creado exitosamente:')
  console.log('📧 Email:', user.email)
  console.log('👤 Nombre:', user.firstName, user.lastName)
  console.log('🔑 Role:', user.role)
  console.log('🏢 Empresa:', fukubar.name)
  console.log('🆔 User ID:', user.id)

  console.log('\n🎉 ¡Listo! Ximena puede hacer login en fukubar.grupoip3.com')
}

createFukubarUser()
  .catch((e) => {
    console.error('❌ Error creando usuario:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
