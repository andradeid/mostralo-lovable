// Informações da instância (token, telefone, servidor) com edição.
// JSX movido da MasterWhatsAppPage sem mudança.
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  Phone,
  Key,
  Eye,
  EyeOff,
  Copy,
  Calendar,
  Activity,
  Save,
  Globe,
} from "lucide-react";
import { copyToClipboard, formatDate } from "@/lib/masterWhatsapp/format";
import type { MasterWhatsAppPageApi } from "./types";

export function InstanceInfoSection({ wa, tests, cfg }: MasterWhatsAppPageApi) {
  const { editingConnection, setEditingConnection, editToken, setEditToken, editServerUrl, setEditServerUrl, showEditToken, setShowEditToken, savingConnection, setSavingConnection } = wa;
  const { config, updateConfig } = cfg;

  return (
    <>
    <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <Activity className="w-3.5 h-3.5" />
          Informações da Instância
        </div>
        {!editingConnection ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => {
              setEditingConnection(true);
              setEditToken(config?.evolution_instance_id || '');
              setEditServerUrl((config as any)?.server_url || '');
            }}
          >
            <Key className="w-3 h-3 mr-1" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => setEditingConnection(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="h-6 text-xs px-2"
              disabled={savingConnection}
              onClick={async () => {
                setSavingConnection(true);
                const updates: any = {};
                if (editToken !== (config?.evolution_instance_id || '')) {
                  updates.evolution_instance_id = editToken || null;
                }
                if (editServerUrl !== ((config as any)?.server_url || '')) {
                  updates.server_url = editServerUrl || null;
                }
                if (Object.keys(updates).length > 0) {
                  const ok = await updateConfig(updates);
                  if (ok) toast.success('Conexão atualizada!');
                }
                setSavingConnection(false);
                setEditingConnection(false);
              }}
            >
              {savingConnection ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
              Salvar
            </Button>
          </div>
        )}
      </div>

      {editingConnection ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Server URL (UaZapi)</Label>
            <Input
              placeholder="https://hubsac.uazapi.com"
              value={editServerUrl}
              onChange={(e) => setEditServerUrl(e.target.value)}
              className="h-8 text-xs font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Deixe vazio para usar o servidor padrão da configuração global
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Token da Instância</Label>
            <div className="relative">
              <Input
                type={showEditToken ? "text" : "password"}
                placeholder="Token da instância UaZapi"
                value={editToken}
                onChange={(e) => setEditToken(e.target.value)}
                className="h-8 text-xs font-mono pr-8"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-2"
                onClick={() => setShowEditToken(!showEditToken)}
              >
                {showEditToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 text-sm">
          {(config as any)?.server_url && (
            <div className="col-span-2 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Globe className="w-3 h-3" />
                <span className="text-xs">Server URL</span>
              </div>
              <p className="text-xs font-mono truncate">
                {(config as any).server_url}
              </p>
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Key className="w-3 h-3" />
              <span className="text-xs">Token UaZapi</span>
            </div>
            <div className="flex items-center gap-1">
              <p className="font-mono text-xs truncate">
                {config?.evolution_instance_id?.slice(0, 8) || 'N/A'}...
              </p>
              {config?.evolution_instance_id && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 w-5 p-0"
                  onClick={() => copyToClipboard(config?.evolution_instance_id)}
                >
                  <Copy className="w-2.5 h-2.5" />
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="w-3 h-3" />
              <span className="text-xs">Telefone</span>
            </div>
            <p className="text-xs font-medium">
              {config?.instance_phone || 'Não detectado'}
            </p>
          </div>
          <div className="col-span-2 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span className="text-xs">Última atualização</span>
            </div>
            <p className="text-xs font-medium">
              {formatDate(config?.updated_at)}
            </p>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
