// Sistema que maneja solo API real de SIIGO
import { Company } from '@prisma/client';
import { createSiigoClient } from './client';

export interface SiigoResponse {
  data: any;
  source: 'real' | 'empty';
  error?: string;
}

/**
 * Factory que determina si puede conectar a SIIGO o devuelve datos vacíos
 */
export async function createSiigoClientSafe(company: Company | null) {
  
  // Si no hay empresa, retornar null
  if (!company) {
    return {
      client: null,
      source: 'empty' as const,
      error: 'No company provided'
    };
  }

  // Intentar crear cliente real
  try {
    if (company.siigoUsername && company.siigoAccessKey) {
      const realClient = await createSiigoClient(company.id);
      
      // Test the connection
      await realClient.authenticate();
      
      return {
        client: realClient,
        source: 'real' as const
      };
    } else {
      return {
        client: null,
        source: 'empty' as const,
        error: 'No SIIGO credentials configured'
      };
    }
  } catch (error) {
    return {
      client: null,
      source: 'empty' as const,
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}

/**
 * Wrapper seguro para llamadas a la API - retorna datos vacíos si falla
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  emptyData: T,
  endpoint: string
): Promise<SiigoResponse> {
  try {
    const data = await apiCall();
    return {
      data,
      source: 'real'
    };
  } catch (error) {
    return {
      data: emptyData,
      source: 'empty',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
