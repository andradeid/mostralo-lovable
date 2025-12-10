import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Search, Users, Crown, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Group {
  group_jid: string;
  name: string | null;
  participants_count: number;
}

interface Member {
  id: string;
  phoneNumber?: string;
  admin?: string;
  name?: string;
  pushName?: string;
}

interface GroupMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  instance: {
    instance_name: string;
  };
}

export function GroupMembersModal({ 
  open, 
  onOpenChange, 
  group,
  instance 
}: GroupMembersModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, group.group_jid]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      // Buscar store_id do usuário
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', session.user.id)
        .single();

      if (!store) throw new Error('Loja não encontrada');

      const response = await supabase.functions.invoke('whatsapp-contacts', {
        body: {
          action: 'fetchGroupMembers',
          store_id: store.id,
          instance_name: instance.instance_name,
          group_jid: group.group_jid,
        },
      });

      if (response.error) throw response.error;

      const participants = response.data.members?.participants || response.data.members || [];
      setMembers(participants);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
      toast.error('Erro ao carregar membros do grupo');
    } finally {
      setLoading(false);
    }
  };

  const extractPhoneFromMember = (member: Member): string | null => {
    // Primeiro, tentar o phoneNumber (contém o número real)
    if (member.phoneNumber) {
      const cleaned = member.phoneNumber
        .replace('@s.whatsapp.net', '')
        .replace('@c.us', '');
      if (/^\d{10,13}$/.test(cleaned)) {
        return cleaned;
      }
    }
    
    // Fallback para id (só se não for LID)
    if (member.id && !member.id.includes('@lid')) {
      const cleaned = member.id
        .replace('@s.whatsapp.net', '')
        .replace('@c.us', '');
      if (/^\d{10,13}$/.test(cleaned)) {
        return cleaned;
      }
    }
    
    return null;
  };

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 13) { // +55 + DDD + 9 dígitos
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    } else if (cleaned.length === 12) { // +55 + DDD + 8 dígitos
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    } else if (cleaned.length === 11) { // DDD + 9 dígitos
      return `+55 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) { // DDD + 8 dígitos
      return `+55 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const filteredMembers = members.filter(member => {
    const phone = extractPhoneFromMember(member) || '';
    const name = member.name || member.pushName || '';
    return phone.includes(searchTerm) || name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros do Grupo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">{group.name || 'Sem nome'}</p>
              <p className="text-sm text-muted-foreground">
                {members.length} membros carregados
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar membro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {filteredMembers.map((member, index) => (
                  <div 
                    key={member.id || index}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>
                        {(member.name || member.pushName || extractPhoneFromMember(member) || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {member.name || member.pushName || 'Sem nome'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {extractPhoneFromMember(member) 
                          ? formatPhoneNumber(extractPhoneFromMember(member)!)
                          : 'Número não disponível'}
                      </p>
                    </div>

                    {member.admin === 'admin' && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {member.admin === 'superadmin' && (
                      <Badge className="text-xs bg-amber-500">
                        <Crown className="h-3 w-3 mr-1" />
                        Dono
                      </Badge>
                    )}
                  </div>
                ))}

                {filteredMembers.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum membro encontrado
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
