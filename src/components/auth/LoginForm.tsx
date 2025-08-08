'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password es requerido'),
  subdomain: z.string().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  subdomain?: string
  companyName?: string
}

export default function LoginForm({ subdomain, companyName }: LoginFormProps) {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      subdomain: subdomain || '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const success = await login(data.email, data.password, data.subdomain || subdomain)
      
      if (success) {
        window.location.href = '/dashboard'
      } else {
        setError('Credenciales inválidas o usuario no encontrado para esta empresa')
      }
    } catch (err) {
      setError('Error interno del servidor. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#2D5AA0] to-[#1E3A8A] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo y header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-white p-3 shadow-lg">
            <div className="h-full w-full rounded-full bg-[#2D5AA0]" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
            {companyName ? `Acceso a ${companyName}` : 'Iniciar Sesión'}
          </h2>
          <p className="mt-2 text-sm text-blue-100">
            Sistema Contable GrupoIP3
          </p>
        </div>

        {/* Formulario */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl text-gray-900">
              Bienvenido
            </CardTitle>
            <CardDescription className="text-center">
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <Input
                label="Email"
                type="email"
                placeholder="tu@email.com"
                {...register('email')}
                error={errors.email?.message}
                disabled={isLoading}
              />

              {/* Password */}
              <div className="relative">
                <Input
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-8 h-5 w-5 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Subdomain (solo en desarrollo) */}
              {process.env.NODE_ENV === 'development' && !subdomain && (
                <Input
                  label="Empresa (Desarrollo)"
                  placeholder="fukubar"
                  {...register('subdomain')}
                  error={errors.subdomain?.message}
                  disabled={isLoading}
                  helper="En desarrollo: fukubar, grupopance, etc."
                />
              )}

              {/* Error message */}
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>

              {/* Información adicional */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  ¿Problemas para acceder?{' '}
                  <a href="mailto:soporte@grupoip3.com" className="text-[#2D5AA0] hover:underline">
                    Contacta soporte
                  </a>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-blue-100">
          <p>© 2025 GrupoIP3. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}
