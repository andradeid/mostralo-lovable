import { toast } from 'sonner';

/**
 * Normaliza o telefone e gera link do WhatsApp Web
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const normalizedPhone = phone.replace(/\D/g, '');
  const phoneWithCountry = normalizedPhone.startsWith('55') 
    ? normalizedPhone 
    : `55${normalizedPhone}`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneWithCountry}?text=${encodedMessage}`;
}

/**
 * Copia mensagem para a área de transferência
 */
export async function copyMessageToClipboard(message: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(message);
    toast.success('Mensagem copiada para a área de transferência!');
    return true;
  } catch (error) {
    console.error('Erro ao copiar mensagem:', error);
    toast.error('Erro ao copiar mensagem');
    return false;
  }
}

/**
 * Abre o WhatsApp Web com a mensagem preenchida
 */
export function openWhatsAppWeb(phone: string, message: string): void {
  const link = generateWhatsAppLink(phone, message);
  window.open(link, '_blank');
  toast.success('WhatsApp Web aberto em nova aba');
}
