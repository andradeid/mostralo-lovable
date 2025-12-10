import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RefreshCw, Search, Users, UsersRound, Download, CheckCircle, Eye, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExtractGroupModal } from "./ExtractGroupModal";
import { GroupMembersModal } from "./GroupMembersModal";

interface Group {
  id: string;
  group_jid: string;
  name: string | null;
  description: string | null;
  picture_url: string | null;
  participants_count: number;
  is_admin: boolean;
  is_extracted: boolean;
  extracted_at: string | null;
  last_synced_at: string | null;
}

interface GroupsTabProps {
  storeId: string;
  instance: {
    instance_name: string;
    api_url: string;
    api_key: string;
  };
  onRefresh: () => void;
}

export function GroupsTab({ storeId, instance, onRefresh }: GroupsTabProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [extractModalOpen, setExtractModalOpen] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  useEffect(() => {
    fetchGroups();
  }, [storeId]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_groups')
        .select('*')
        .eq('store_id', storeId)
        .order('name', { ascending: true });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
      toast.error('Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('whatsapp-contacts', {
        body: {
          action: 'syncGroups',
          store_id: storeId,
          instance_name: instance.instance_name,
          api_url: instance.api_url,
          api_key: instance.api_key,
        },
      });

      if (response.error) throw response.error;

      toast.success(`${response.data.synced} grupos sincronizados!`);
      fetchGroups();
      onRefresh();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar grupos');
    } finally {
      setSyncing(false);
    }
  };

  const handleExtract = (group: Group) => {
    setSelectedGroup(group);
    setExtractModalOpen(true);
  };

  const handleViewMembers = (group: Group) => {
    setSelectedGroup(group);
    setMembersModalOpen(true);
  };

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Grupos ({filteredGroups.length})</CardTitle>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar Grupos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar grupos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de grupos */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UsersRound className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum grupo encontrado</p>
            <Button variant="outline" className="mt-4" onClick={handleSync}>
              Sincronizar Grupos
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredGroups.map(group => (
              <div 
                key={group.id} 
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={group.picture_url || undefined} />
                  <AvatarFallback>
                    <UsersRound className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{group.name || 'Sem nome'}</p>
                    {group.is_admin && (
                      <Badge variant="secondary" className="text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {group.is_extracted && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Extraído
                      </Badge>
                    )}
                  </div>
                  
                  {group.description && (
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {group.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{group.participants_count} participantes</span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewMembers(group)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Membros
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleExtract(group)}
                      disabled={group.is_extracted}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      {group.is_extracted ? 'Já Extraído' : 'Extrair'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {selectedGroup && (
        <>
          <ExtractGroupModal
            open={extractModalOpen}
            onOpenChange={setExtractModalOpen}
            group={selectedGroup}
            storeId={storeId}
            instance={instance}
            onSuccess={() => {
              fetchGroups();
              onRefresh();
            }}
          />

          <GroupMembersModal
            open={membersModalOpen}
            onOpenChange={setMembersModalOpen}
            group={selectedGroup}
            instance={instance}
          />
        </>
      )}
    </Card>
  );
}
