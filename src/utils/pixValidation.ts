export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

export function validatePixKey(key: string, type: PixKeyType): boolean {
  const cleanKey = key.replace(/\D/g, '');

  switch (type) {
    case 'cpf':
      return cleanKey.length === 11;
    case 'cnpj':
      return cleanKey.length === 14;
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key);
    case 'phone':
      return cleanKey.length === 10 || cleanKey.length === 11;
    case 'random':
      return key.length >= 32; // UUID format
    default:
      return false;
  }
}

export function formatPixKey(key: string, type: PixKeyType): string {
  const cleanKey = key.replace(/\D/g, '');

  switch (type) {
    case 'cpf':
      if (cleanKey.length === 11) {
        return cleanKey.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
      return key;
    case 'cnpj':
      if (cleanKey.length === 14) {
        return cleanKey.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      }
      return key;
    case 'phone':
      if (cleanKey.length === 11) {
        return cleanKey.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } else if (cleanKey.length === 10) {
        return cleanKey.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      }
      return key;
    case 'email':
    case 'random':
      return key;
    default:
      return key;
  }
}

export function maskPixKey(key: string, type: PixKeyType): string {
  if (!key) return '';
  
  if (type === 'email') {
    const [username, domain] = key.split('@');
    if (username.length > 3) {
      return username.substring(0, 3) + '***@' + domain;
    }
    return '***@' + domain;
  }
  
  if (type === 'random') {
    if (key.length > 8) {
      return key.substring(0, 4) + '...' + key.substring(key.length - 4);
    }
    return key;
  }
  
  const cleanKey = key.replace(/\D/g, '');
  if (cleanKey.length > 8) {
    return cleanKey.substring(0, 4) + '***' + cleanKey.substring(cleanKey.length - 4);
  }
  
  return key;
}

export function getPixKeyTypeName(type: PixKeyType): string {
  const names: Record<PixKeyType, string> = {
    cpf: 'CPF',
    cnpj: 'CNPJ',
    email: 'E-mail',
    phone: 'Telefone',
    random: 'Chave Aleatória'
  };
  return names[type];
}
