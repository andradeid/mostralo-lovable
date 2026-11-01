// Formatação da tela Pagamento Online da loja (conta EFI e PIX de teste).
// Funções puras: mesma regra que ficava dentro da StoreOnlinePaymentPage.

export type EfiDocumentType = 'cpf' | 'cnpj';

// Documento salvo, mascarado para exibição (CPF ou CNPJ)
export const formatDisplayDocument = (docNumber: string | null, docType: string | null) => {
  if (!docNumber) return 'Não informado';
  const cleaned = docNumber.replace(/\D/g, '');
  if (docType === 'cnpj') {
    return cleaned
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
  return cleaned
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const formatAccountNumber = (value: string) => {
  return value.replace(/\D/g, '').slice(0, 10);
};

export const formatCPF = (value: string) => {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  return cleaned
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const formatCNPJ = (value: string) => {
  const cleaned = value.replace(/\D/g, '').slice(0, 14);
  return cleaned
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

// Máscara do campo de documento conforme o tipo escolhido
export const formatDocumentByType = (value: string, efiDocumentType: EfiDocumentType) => {
  return efiDocumentType === 'cpf' ? formatCPF(value) : formatCNPJ(value);
};

export const formatCurrency = (value: string) => {
  const num = parseFloat(value.replace(',', '.'));
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
