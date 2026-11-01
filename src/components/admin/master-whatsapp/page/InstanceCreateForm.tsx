// Criar instância (quando ainda não existe).
// JSX movido da MasterWhatsAppPage sem mudança.
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Power } from "lucide-react";
import type { MasterWhatsAppPageApi } from "./types";

export function InstanceCreateForm({ wa, tests, cfg }: MasterWhatsAppPageApi) {
  const { instanceName, setInstanceName, loadingAction, createInstance } = wa;

  return (
    <>
    <>
      <div className="space-y-2">
        <Label>Nome da Instância</Label>
        <Input
          placeholder="ex: vendas-master"
          value={instanceName}
          onChange={(e) => setInstanceName(e.target.value)}
        />
      </div>
      <Button 
        onClick={createInstance} 
        disabled={loadingAction === 'create'}
        className="w-full"
      >
        {loadingAction === 'create' ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Power className="w-4 h-4 mr-2" />
        )}
        Criar Instância
      </Button>
    </>
    </>
  );
}
