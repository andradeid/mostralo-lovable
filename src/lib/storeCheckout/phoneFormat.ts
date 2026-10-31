/** Telefone do cliente no formato da tela: (61) 99400-9368.
 *  O cadastro guarda com o 55 do Brasil (5561994009368); na tela ele sai. */
export function formatCustomerPhone(value: string): string {
  let numbers = value.replace(/\D/g, '');
  if (numbers.length >= 12 && numbers.startsWith('55')) numbers = numbers.slice(2);
  numbers = numbers.slice(0, 11);
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}
