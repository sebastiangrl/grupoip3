'use client'

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FormSkeleton, CardSkeleton, Skeleton } from '@/components/ui/Skeleton';

interface SiigoConfig {
  id: string;
  name: string;
  siigoUsername?: string;
  siigoPartnerId?: string;
  hasAccessKey: boolean;
}

export default function SiigoConfigPage() {
  const [config, setConfig] = useState<SiigoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    accessKey: '',
    partnerId: '',
  });
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/siigo/config');
      
      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        // Si es 401, es problema de autenticación
        if (response.status === 401) {
          setMessage({ 
            type: 'error', 
            text: 'Sesión expirada. Por favor, inicie sesión nuevamente.' 
          });
          return;
        }
        
        // Para otros errores, tratar de leer el cuerpo si es posible
        let errorText = 'Error desconocido';
        try {
          const errorData = await response.json();
          errorText = errorData.error || `Error ${response.status}`;
        } catch {
          errorText = `Error ${response.status}: ${response.statusText}`;
        }
        
        setMessage({ type: 'error', text: errorText });
        return;
      }

      // Verificar si la respuesta tiene contenido JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setMessage({ type: 'error', text: 'Respuesta inválida del servidor' });
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        setConfig(result.data);
        setFormData({
          username: result.data.siigoUsername || '',
          accessKey: '',
          partnerId: result.data.siigoPartnerId || 'GrupoIP3Dashboard',
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al cargar configuración' });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.username || !formData.accessKey) {
      setMessage({ type: 'error', text: 'Usuario y Access Key son requeridos' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/siigo/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (result.warning) {
          setMessage({ 
            type: 'error', 
            text: `⚠️ ${result.message}` 
          });
        } else {
          setMessage({ type: 'success', text: '✅ Configuración guardada exitosamente' });
        }
        await fetchConfig(); // Refresh config
      } else {
        // Mostrar error específico del servidor
        const errorMessage = result.error || `Error ${response.status}: ${response.statusText}`;
        setMessage({ type: 'error', text: errorMessage });
        
        // Si es 401, sugerir limpiar sesiones
        if (response.status === 401) {
          setMessage({ 
            type: 'error', 
            text: 'Sesión expirada o inválida. Use el botón "Limpiar Sesiones" y vuelva a iniciar sesión.' 
          });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}` });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config?.hasAccessKey) {
      setMessage({ type: 'error', text: 'Primero debe guardar las credenciales' });
      return;
    }

    setTesting(true);
    setMessage(null);

    try {
      // Use the dedicated test endpoint
      const response = await fetch('/api/siigo/test-connection', {
        method: 'POST'
      });
      
      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ type: 'success', text: '✅ ' + result.message });
      } else {
        // Show specific error from server
        const errorMessage = result.error || 'Error al probar la conexión';
        setMessage({ type: 'error', text: '❌ ' + errorMessage });
        
        // Show additional details in console for debugging
        if (result.details && process.env.NODE_ENV === 'development') {
          console.error('SIIGO connection test details:', result.details);
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Error de conexión al probar SIIGO' });
    } finally {
      setTesting(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('¿Está seguro de que desea eliminar la configuración de SIIGO?')) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/siigo/config', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Configuración eliminada exitosamente' });
        setFormData({ username: '', accessKey: '', partnerId: 'GrupoIP3Dashboard' });
        await fetchConfig();
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al eliminar la configuración' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al eliminar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <Skeleton height={36} width="300px" className="mb-2" />
          <Skeleton height={20} width="500px" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Form Skeleton */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton height={24} width="200px" />
              </CardHeader>
              <CardContent>
                <FormSkeleton />
              </CardContent>
            </Card>
          </div>

          {/* Help & Status Skeleton */}
          <div>
            <Card>
              <CardHeader>
                <Skeleton height={24} width="180px" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Status indicator */}
                  <div className="flex items-center">
                    <Skeleton variant="circular" width={12} height={12} className="mr-3" />
                    <Skeleton height={16} width="150px" />
                  </div>

                  {/* Instructions section */}
                  <div className="pt-4 border-t border-gray-200">
                    <Skeleton height={20} width="200px" className="mb-2" />
                    <div className="space-y-1">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} height={16} width={`${80 + index * 5}%`} />
                      ))}
                    </div>
                  </div>

                  {/* Security section */}
                  <div className="pt-4 border-t border-gray-200">
                    <Skeleton height={20} width="100px" className="mb-2" />
                    <Skeleton height={16} width="90%" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración SIIGO</h1>
        <p className="text-gray-700 mt-2">
          Configure las credenciales de SIIGO para acceder a los datos contables en tiempo real.
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Credenciales SIIGO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario SIIGO
                </label>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese su usuario de SIIGO"
                />
              </div>

              <div>
                <label htmlFor="accessKey" className="block text-sm font-medium text-gray-700 mb-2">
                  Access Key
                </label>
                <div className="relative">
                  <input
                    id="accessKey"
                    type={showAccessKey ? "text" : "password"}
                    value={formData.accessKey}
                    onChange={(e) => setFormData({ ...formData, accessKey: e.target.value })}
                    className="w-full px-3 py-2 pr-10 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={config?.hasAccessKey ? "••••••••••••••••" : "Ingrese su Access Key de SIIGO"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessKey(!showAccessKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showAccessKey ? (
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L15 15M21 3l-6.878 6.878" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="partnerId" className="block text-sm font-medium text-gray-700 mb-2">
                  Partner ID (Opcional)
                </label>
                <input
                  id="partnerId"
                  type="text"
                  value={formData.partnerId}
                  onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                  className="w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="GrupoIP3Dashboard"
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  variant="primary"
                  className="flex-1"
                >
                  {saving ? <LoadingSpinner size="sm" /> : 'Guardar Configuración'}
                </Button>

                {config?.hasAccessKey && (
                  <Button
                    onClick={handleTest}
                    disabled={testing}
                    variant="secondary"
                    className="bg-green-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 font-medium"
                  >
                    {testing ? <LoadingSpinner size="sm" /> : 'Probar Conexión'}
                  </Button>
                )}
              </div>

              {config?.hasAccessKey && (
                <Button
                  onClick={handleRemove}
                  disabled={saving}
                  variant="outline"
                  className="w-full text-red-600 border-red-300 hover:bg-red-50"
                >
                  Eliminar Configuración
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Help & Status */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Estado de la Integración</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-3 ${
                    config?.hasAccessKey ? 'bg-green-400' : 'bg-gray-300'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    config?.hasAccessKey ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {config?.hasAccessKey ? 'Credenciales configuradas' : 'Sin configurar'}
                  </span>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">¿Cómo obtener las credenciales?</h4>
                  <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                    <li>Ingrese a su cuenta de SIIGO</li>
                    <li>Vaya a Configuración → API</li>
                    <li>Genere un nuevo Access Key</li>
                    <li>Copie las credenciales aquí</li>
                  </ol>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Seguridad</h4>
                  <p className="text-sm text-gray-700">
                    Las credenciales se almacenan de forma segura y encriptada en nuestra base de datos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
