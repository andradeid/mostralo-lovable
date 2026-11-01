// Selo de status da instância (era getStatusBadge na MasterWhatsAppPage).
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export function InstanceStatusBadge({ instanceStatus }: { instanceStatus: string }) {
  switch (instanceStatus) {
    case 'open':
    case 'connected':
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>;
    case 'connecting':
      return <Badge className="bg-yellow-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Conectando</Badge>;
    case 'close':
    case 'disconnected':
    default:
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Desconectado</Badge>;
  }
}
