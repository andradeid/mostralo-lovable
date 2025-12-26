import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza telefone brasileiro para formato CANÔNICO (11 dígitos com 9)
 * Garante que "6194009368" e "61994009368" sejam tratados como o mesmo número
 */
export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  
  // Remover DDI 55 se presente
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.substring(2);
  }
  
  // Remover 0 à esquerda do DDD se presente
  if (digits.startsWith('0') && digits.length === 12) {
    digits = digits.substring(1);
  }
  
  // Se tem 10 dígitos, adicionar o 9 após o DDD
  if (digits.length === 10) {
    digits = digits.substring(0, 2) + '9' + digits.substring(2);
  }
  
  return digits;
}

export function formatPhone(phone: string): string {
  const numbers = phone.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/\s-$/, '');
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/\s-$/, '');
}

// Máscara para telefone brasileiro (com DDD) - mais completa
export function formatBrazilianPhone(phone: string): string {
  const numbers = phone.replace(/\D/g, '').slice(0, 11);
  
  if (numbers.length === 0) return '';
  if (numbers.length <= 2) {
    return `(${numbers}`;
  }
  if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }
  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  // 11 dígitos (celular com 9)
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

// Máscara genérica para telefone internacional
export function formatInternationalPhone(phone: string): string {
  const numbers = phone.replace(/\D/g, '').slice(0, 15);
  // Agrupa a cada 4 dígitos para facilitar leitura
  return numbers.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

// Formatação de moeda brasileira (BRL)
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
