/**
 * Trunca endereços para exibição compacta
 * @param address - Endereço completo
 * @param maxLength - Tamanho máximo (padrão: 30)
 * @returns Endereço truncado
 */
export function truncateAddress(address: string, maxLength: number = 30): string {
  if (!address) return '';
  
  // Pega só a primeira parte antes da vírgula
  const mainPart = address.split(',')[0].trim();
  
  if (mainPart.length <= maxLength) return mainPart;
  
  return mainPart.substring(0, maxLength - 3) + '...';
}

/**
 * Formata número do pedido para exibição compacta
 * @param orderNumber - Número do pedido original
 * @returns Número formatado com #
 */
export function formatOrderNumber(orderNumber: string): string {
  if (!orderNumber) return '';
  
  // Remove o # se existir
  const cleaned = orderNumber.replace('#', '');
  
  // Se for muito longo (timestamp), pega apenas os últimos 6 dígitos
  if (cleaned.length > 8) {
    return '#' + cleaned.slice(-6);
  }
  
  // Retorna com # no início
  return '#' + cleaned;
}

/**
 * Extrai o primeiro nome do cliente e capitaliza corretamente
 * @param fullName - Nome completo do cliente
 * @returns Primeiro nome capitalizado
 */
export function getFirstName(fullName: string): string {
  if (!fullName) return '';
  
  // Pega o primeiro nome
  const firstName = fullName.split(' ')[0].trim();
  
  // Capitaliza corretamente (primeira letra maiúscula, resto minúscula)
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
}
