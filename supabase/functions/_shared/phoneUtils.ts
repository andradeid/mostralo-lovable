/**
 * Utilitários para normalização de telefones brasileiros
 * Garante que números com 10 ou 11 dígitos sejam tratados como o mesmo cliente
 */

/**
 * Normaliza telefone brasileiro para formato CANÔNICO (11 dígitos com 9)
 * Exemplos:
 * - "6194009368" → "61994009368" (adiciona o 9)
 * - "61994009368" → "61994009368" (já está correto)
 * - "5561994009368" → "61994009368" (remove DDI 55)
 * - "(61) 9 4009-9368" → "61994009368" (limpa formatação)
 */
export function normalizePhoneCanonical(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  
  // Remover DDI 55 se presente no início
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.substring(2);
  }
  
  // Remover 0 à esquerda do DDD se presente
  if (digits.startsWith('0') && digits.length === 12) {
    digits = digits.substring(1);
  }
  
  // Se tem 10 dígitos, adicionar o 9 após o DDD
  // DDDs de celular no Brasil: todos os DDDs suportam o 9º dígito
  if (digits.length === 10) {
    const ddd = digits.substring(0, 2);
    const number = digits.substring(2);
    digits = ddd + '9' + number; // Adiciona o 9
  }
  
  return digits;
}

/**
 * Gera variantes de telefone para busca tolerante no banco
 * Permite encontrar o mesmo cliente independente do formato armazenado
 * 
 * Exemplos para "61994009368":
 * - "61994009368" (canônico 11 dígitos)
 * - "6194009368" (10 dígitos sem o 9)
 * - "5561994009368" (com DDI 55)
 */
export function getPhoneVariants(phone: string): string[] {
  const variants = new Set<string>();
  
  // Limpar o telefone original
  let originalClean = phone.replace(/\D/g, '');
  
  // Remover DDI 55 se presente
  if (originalClean.startsWith('55') && originalClean.length >= 12) {
    originalClean = originalClean.substring(2);
  }
  
  // Remover 0 à esquerda do DDD se presente
  if (originalClean.startsWith('0') && originalClean.length === 12) {
    originalClean = originalClean.substring(1);
  }
  
  // Versão canônica (sempre 11 dígitos)
  const canonical = normalizePhoneCanonical(phone);
  variants.add(canonical);
  
  // Versão sem o 9 (10 dígitos) - para compatibilidade com dados antigos
  if (canonical.length === 11) {
    const withoutNine = canonical.substring(0, 2) + canonical.substring(3);
    variants.add(withoutNine);
  }
  
  // Com DDI 55 (versão canônica)
  variants.add('55' + canonical);
  
  // Se original tem 10 dígitos, também gerar versão com 11
  if (originalClean.length === 10) {
    const ddd = originalClean.substring(0, 2);
    const number = originalClean.substring(2);
    const with9 = ddd + '9' + number;
    variants.add(with9);
    variants.add('55' + with9);
  }
  
  // Se original tem 11 dígitos, também gerar versão com 10
  if (originalClean.length === 11) {
    const without9 = originalClean.substring(0, 2) + originalClean.substring(3);
    variants.add(without9);
    variants.add('55' + originalClean);
  }
  
  // Adicionar original limpo também
  variants.add(originalClean);
  
  return Array.from(variants);
}

/**
 * Gera email temporário baseado no telefone normalizado
 * Sempre usa o formato canônico para garantir consistência
 */
export function generateTempEmail(phone: string): string {
  const normalized = normalizePhoneCanonical(phone);
  return `cliente_${normalized}@mostralo.me`;
}
