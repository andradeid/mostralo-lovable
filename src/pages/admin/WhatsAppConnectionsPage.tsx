import { MessageCircle } from "lucide-react";
import UaZapiConfigTab from "@/components/admin/whatsapp/UaZapiConfigTab";

export default function WhatsAppConnectionsPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />
          Conexões WhatsApp
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Gerencie seu provedor de API do WhatsApp (UaZapi)
        </p>
      </div>

      <UaZapiConfigTab />
    </div>
  );
}
