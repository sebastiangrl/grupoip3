import { redirect } from 'next/navigation'
import { getCurrentSession } from '../lib/auth'

export default async function HomePage() {
  // Verificar si hay una sesión activa
  const session = await getCurrentSession()
  
  if (session) {
    // Si está autenticado, redirigir al dashboard
    redirect('/dashboard')
  } else {
    // Si no está autenticado, redirigir al login
    redirect('/login')
  }
}
