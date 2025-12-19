interface ExternalData {
  isTest?: boolean;
  additionalInfo?: {
    metadata?: {
      developerId?: string;
      developerEmail?: string;
      customerEmail?: string;
    };
  };
}

/**
 * Verifica se um pedido do iFood é de homologação/teste
 * Detecta pela presença de developerId no metadata ou flag isTest
 */
export function isIfoodTestOrder(externalData: unknown): boolean {
  if (!externalData || typeof externalData !== 'object') return false;
  
  const data = externalData as ExternalData;
  
  // Verificar flag direto
  if (data.isTest === true) return true;
  
  // Verificar presença de developerId no metadata (pedidos de homologação)
  if (data.additionalInfo?.metadata?.developerId) return true;
  
  return false;
}
