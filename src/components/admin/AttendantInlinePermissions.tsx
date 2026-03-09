import { useState, useEffect, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ATTENDANT_PERMISSIONS, PERMISSION_MODULE_MAP, type PermissionKey } from '@/hooks/useAttendantPermissions';
import { useStoreModules } from '@/hooks/useStoreModules';
import { Loader2 } from 'lucide-react';

interface AttendantInlinePermissionsProps {
  userId: string;
  storeId: string;
}

interface PermissionRecord {
  id: string;
  permission_key: string;
  is_enabled: boolean;
}

export function AttendantInlinePermissions({ userId, storeId }: AttendantInlinePermissionsProps) {
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const { hasModule } = useStoreModules(storeId);

  const fetchPermissions = useCallback(async () => {
    const { data, error } = await supabase
      .from('attendant_permissions')
      .select('id, permission_key, is_enabled')
      .eq('user_id', userId)
      .eq('store_id', storeId);

    if (!error) setPermissions(data || []);
    setLoading(false);
  }, [userId, storeId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Filtrar permissões com base nos módulos ativos da loja
  const availablePermissions = ATTENDANT_PERMISSIONS.filter(p => {
    const requiredModule = PERMISSION_MODULE_MAP[p.key];
    if (!requiredModule) return true;
    return hasModule(requiredModule);
  });

  const isEnabled = (key: string): boolean => {
    const perm = permissions.find(p => p.permission_key === key);
    return perm ? perm.is_enabled : true; // Default: liberado
  };

  const handleToggle = async (key: PermissionKey, checked: boolean) => {
    setSavingKey(key);
    try {
      const existing = permissions.find(p => p.permission_key === key);

      if (existing) {
        const { error } = await supabase
          .from('attendant_permissions')
          .update({ is_enabled: checked, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('attendant_permissions')
          .insert({
            user_id: userId,
            store_id: storeId,
            permission_key: key,
            is_enabled: checked,
          });
        if (error) throw error;
      }

      await fetchPermissions();
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      toast.error('Erro ao atualizar permissão');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1 mt-2">
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">Carregando permissões...</span>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {availablePermissions.map(perm => {
          const enabled = isEnabled(perm.key);
          const isSaving = savingKey === perm.key;

          return (
            <Tooltip key={perm.key}>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(perm.key, !enabled);
                  }}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Badge
                    variant={enabled ? 'default' : 'outline'}
                    className={`text-[10px] h-5 px-1.5 transition-colors select-none ${
                      enabled
                        ? 'bg-primary/15 text-primary border-primary/30 hover:bg-primary/25'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {isSaving ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin mr-0.5" />
                    ) : (
                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${enabled ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                    )}
                    {perm.label}
                  </Badge>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>{perm.description}</p>
                <p className="text-muted-foreground mt-0.5">
                  Clique para {enabled ? 'bloquear' : 'liberar'}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
