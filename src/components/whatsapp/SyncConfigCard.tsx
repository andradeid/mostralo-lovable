import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, RefreshCw, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SyncConfig {
  id: string;
  auto_sync_enabled: boolean;
  sync_interval_hours: number;
  last_sync_at: string | null;
  next_sync_at: string | null;
  sync_contacts: boolean;
  sync_groups: boolean;
}

interface SyncConfigCardProps {
  storeId: string;
  instance: {
    instance_name: string;
  };
}

export function SyncConfigCard({ storeId, instance }: SyncConfigCardProps) {
  const [config, setConfig] = useState<SyncConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, [storeId]);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_sync_config')
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setConfig(data || {
        id: '',
        auto_sync_enabled: false,
        sync_interval_hours: 24,
        last_sync_at: null,
        next_sync_at: null,
        sync_contacts: true,
        sync_groups: true,
      });
    } catch (error) {
      console.error('Erro ao buscar config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updates: Partial<SyncConfig>) => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const newConfig = { ...config, ...updates };

      const response = await supabase.functions.invoke('whatsapp-contacts', {
        body: {
          action: 'updateSyncConfig',
          store_id: storeId,
          auto_sync_enabled: newConfig.auto_sync_enabled,
          sync_interval_hours: newConfig.sync_interval_hours,
          sync_contacts: newConfig.sync_contacts,
          sync_groups: newConfig.sync_groups,
        },
      });

      if (response.error) throw response.error;

      setConfig(response.data.config);
      toast.success('Configuração atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao atualizar configuração');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Auto-Sincronização
          </CardTitle>
          {config?.auto_sync_enabled ? (
            <Badge variant="default" className="bg-green-500">Ativo</Badge>
          ) : (
            <Badge variant="secondary">Desativado</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          {/* Toggle principal */}
          <div className="flex items-center gap-3">
            <Switch
              checked={config?.auto_sync_enabled || false}
              onCheckedChange={(checked) => handleUpdate({ auto_sync_enabled: checked })}
              disabled={saving}
            />
            <Label className="cursor-pointer">
              {config?.auto_sync_enabled ? 'Sincronização automática ativa' : 'Ativar sincronização automática'}
            </Label>
          </div>

          {/* Intervalo */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Intervalo</Label>
            <Select
              value={String(config?.sync_interval_hours || 24)}
              onValueChange={(value) => handleUpdate({ sync_interval_hours: parseInt(value) })}
              disabled={saving || !config?.auto_sync_enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">A cada 1 hora</SelectItem>
                <SelectItem value="6">A cada 6 horas</SelectItem>
                <SelectItem value="12">A cada 12 horas</SelectItem>
                <SelectItem value="24">A cada 24 horas</SelectItem>
                <SelectItem value="48">A cada 48 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Última sincronização */}
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Última sincronização</Label>
            <p className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {config?.last_sync_at 
                ? format(new Date(config.last_sync_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                : 'Nunca'
              }
            </p>
          </div>

          {/* Próxima sincronização */}
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Próxima sincronização</Label>
            <p className="text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              {config?.next_sync_at && config?.auto_sync_enabled
                ? format(new Date(config.next_sync_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                : '-'
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
