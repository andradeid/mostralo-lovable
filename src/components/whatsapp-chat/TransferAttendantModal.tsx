import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, UserCheck, Circle } from 'lucide-react';

interface Attendant {
  user_id: string;
  full_name: string | null;
  email: string | null;
  is_online: boolean;
}

interface TransferAttendantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  storeId: string;
  currentAssignedTo: string | null;
  onTransferred?: () => void;
}

export function TransferAttendantModal({
  open,
  onOpenChange,
  conversationId,
  storeId,
  currentAssignedTo,
  onTransferred,
}: TransferAttendantModalProps) {
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetchAttendants();
  }, [open, storeId]);

  const fetchAttendants = async () => {
    setLoading(true);
    try {
      // Buscar atendentes e store_admins da loja
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('store_id', storeId)
        .in('role', ['attendant', 'store_admin']);

      if (rolesError || !roles) {
        console.error('Erro ao buscar roles:', rolesError);
        setLoading(false);
        return;
      }

      // Também buscar owner da loja
      const { data: store } = await supabase
        .from('stores')
        .select('owner_id')
        .eq('id', storeId)
        .single();

      const userIds = [...new Set([
        ...roles.map(r => r.user_id),
        ...(store?.owner_id ? [store.owner_id] : []),
      ])];

      if (userIds.length === 0) {
        setAttendants([]);
        setLoading(false);
        return;
      }

      // Buscar perfis
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, last_sign_in_at')
        .in('id', userIds);

      if (profilesError || !profiles) {
        console.error('Erro ao buscar perfis:', profilesError);
        setLoading(false);
        return;
      }

      // Considerar "online" quem teve login nas últimas 2 horas
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const list: Attendant[] = profiles.map(p => ({
        user_id: p.id,
        full_name: p.full_name,
        email: p.email,
        is_online: !!p.last_sign_in_at && p.last_sign_in_at > twoHoursAgo,
      }));

      // Ordenar: online primeiro, depois por nome
      list.sort((a, b) => {
        if (a.is_online !== b.is_online) return a.is_online ? -1 : 1;
        return (a.full_name || '').localeCompare(b.full_name || '');
      });

      setAttendants(list);
    } catch (err) {
      console.error('Erro ao carregar atendentes:', err);
    }
    setLoading(false);
  };

  const handleTransfer = async (targetUserId: string) => {
    setTransferring(targetUserId);
    try {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({ assigned_to: targetUserId })
        .eq('id', conversationId);

      if (error) {
        toast.error(`Erro ao transferir: ${error.message}`);
        return;
      }

      const attendant = attendants.find(a => a.user_id === targetUserId);
      toast.success(`Atendimento transferido para ${attendant?.full_name || 'atendente'}`);
      onOpenChange(false);
      onTransferred?.();
    } catch (err) {
      toast.error('Erro inesperado ao transferir atendimento');
    } finally {
      setTransferring(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transferir Atendimento</DialogTitle>
          <DialogDescription>
            Selecione o atendente para assumir esta conversa
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[300px] overflow-y-auto space-y-1 mt-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : attendants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum atendente encontrado para esta loja
            </p>
          ) : (
            attendants.map(att => {
              const isCurrent = att.user_id === currentAssignedTo;
              const initials = (att.full_name || att.email || '??').slice(0, 2).toUpperCase();

              return (
                <button
                  key={att.user_id}
                  disabled={isCurrent || !!transferring}
                  onClick={() => handleTransfer(att.user_id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="relative">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <Circle
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${
                        att.is_online
                          ? 'text-green-500 fill-green-500'
                          : 'text-muted-foreground/40 fill-muted-foreground/40'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {att.full_name || att.email || 'Sem nome'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {att.is_online ? 'Online' : 'Offline'}
                      {isCurrent && ' • Atendente atual'}
                    </p>
                  </div>

                  {isCurrent ? (
                    <UserCheck className="w-4 h-4 text-primary shrink-0" />
                  ) : transferring === att.user_id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
