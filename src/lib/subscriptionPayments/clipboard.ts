import { toast } from "sonner";

// Helper para copiar texto
export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success('ID copiado!');
};
