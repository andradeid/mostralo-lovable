import { useState, useCallback } from 'react';

/**
 * Hook para formatar input de moeda brasileira (R$)
 * Converte entrada de centavos para valor formatado
 * Ex: digitar 1990 -> R$ 19,90
 */
export function useCurrencyInput(initialValue: number = 0) {
  // Armazena o valor em centavos
  const [cents, setCents] = useState(Math.round(initialValue * 100));

  // Valor numérico real (em reais)
  const numericValue = cents / 100;

  // Valor formatado para exibição (sem R$)
  const displayValue = formatCentsToDisplay(cents);

  const handleChange = useCallback((inputValue: string) => {
    // Remove tudo que não é número
    const digits = inputValue.replace(/\D/g, '');
    
    // Converte para número (em centavos)
    const newCents = parseInt(digits, 10) || 0;
    
    setCents(newCents);
    
    return newCents / 100; // Retorna o valor em reais
  }, []);

  const setValue = useCallback((value: number) => {
    setCents(Math.round(value * 100));
  }, []);

  return {
    displayValue,
    numericValue,
    handleChange,
    setValue,
    cents
  };
}

/**
 * Formata centavos para exibição (sem símbolo da moeda)
 * Ex: 1990 -> "19,90"
 */
function formatCentsToDisplay(cents: number): string {
  if (cents === 0) return '';
  
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  
  // Formata com separador de milhar e decimal brasileiro
  const formattedReais = reais.toLocaleString('pt-BR');
  const formattedCentavos = centavos.toString().padStart(2, '0');
  
  return `${formattedReais},${formattedCentavos}`;
}

/**
 * Componente de input para uso com react-hook-form
 */
export function formatCurrencyValue(value: number): string {
  if (!value && value !== 0) return '';
  
  const cents = Math.round(value * 100);
  if (cents === 0) return '';
  
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  
  const formattedReais = reais.toLocaleString('pt-BR');
  const formattedCentavos = centavos.toString().padStart(2, '0');
  
  return `${formattedReais},${formattedCentavos}`;
}

/**
 * Parse de valor formatado para número
 */
export function parseCurrencyValue(displayValue: string): number {
  const digits = displayValue.replace(/\D/g, '');
  const cents = parseInt(digits, 10) || 0;
  return cents / 100;
}
