/**
 * Utilitário para gerar URLs públicas corretas
 * Em ambiente de desenvolvimento, usa o domínio de produção
 */

export function getPublicBaseUrl(): string {
  const hostname = window.location.hostname;
  
  // Domínios de desenvolvimento do Lovable
  const devDomains = [
    'lovableproject.com',
    'gptengineer.run',
    'webcontainer.io',
    'localhost'
  ];
  
  const isDevEnvironment = devDomains.some(domain => 
    hostname.includes(domain) || hostname === 'localhost'
  );
  
  // Se está em desenvolvimento, usar o domínio de produção
  if (isDevEnvironment) {
    return 'https://mostralo.lovable.app';
  }
  
  // Em produção, usar o origin atual
  return window.location.origin;
}

export function getPublicInvoiceUrl(invoiceId: string): string {
  return `${getPublicBaseUrl()}/external-invoice/${invoiceId}`;
}
