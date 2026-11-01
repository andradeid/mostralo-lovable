// Copiar para a área de transferência e formatar data (movidos da MasterWhatsAppPage sem mudança).
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const copyToClipboard = (text: string | null | undefined) => {
  if (text) {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  }
};

export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Não disponível';
  try {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return 'Data inválida';
  }
};
