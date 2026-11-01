// Selo de status da conexão (era getStatusBadge na WhatsAppInstancePage).
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export function getStatusBadge(status: string) {
  switch (status) {
    case 'connected':
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Conectado</Badge>;
    case 'connecting':
      return <Badge className="bg-yellow-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Conectando</Badge>;
    case 'banned':
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Banido</Badge>;
    default:
      return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Desconectado</Badge>;
  }
}
