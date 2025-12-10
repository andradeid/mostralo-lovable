import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, UsersRound, Tags, Upload, RefreshCw, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContactsTab } from "@/components/whatsapp/ContactsTab";
import { GroupsTab } from "@/components/whatsapp/GroupsTab";
import { LabelsTab } from "@/components/whatsapp/LabelsTab";
import { ImportTab } from "@/components/whatsapp/ImportTab";
import { SyncConfigCard } from "@/components/whatsapp/SyncConfigCard";

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  api_url: string;
  api_key: string;
  status: string;
  store_id: string;
}

export default function WhatsAppContactsPage() {
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("contacts");
  const [contactsCount, setContactsCount] = useState(0);
  const [groupsCount, setGroupsCount] = useState(0);
  const [labelsCount, setLabelsCount] = useState(0);

  useEffect(() => {
    fetchStoreAndInstance();
  }, []);

  useEffect(() => {
    if (storeId) {
      fetchCounts();
    }
  }, [storeId]);

  const fetchStoreAndInstance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (store) {
        setStoreId(store.id);

        const { data: instanceData } = await supabase
          .from('whatsapp_instances')
          .select('id, instance_name, status, store_id')
          .eq('store_id', store.id)
          .eq('status', 'connected')
          .single();

        if (instanceData) {
          // Buscar config da Evolution API
          const { data: evolutionConfig } = await supabase
            .from('evolution_config')
            .select('api_url, api_key')
            .eq('is_active', true)
            .single();

          if (evolutionConfig) {
            setInstance({
              ...instanceData,
              api_url: evolutionConfig.api_url,
              api_key: evolutionConfig.api_key,
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    if (!storeId) return;

    const [contactsRes, groupsRes, labelsRes] = await Promise.all([
      supabase.from('whatsapp_contacts').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
      supabase.from('whatsapp_groups').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
      supabase.from('whatsapp_contact_labels').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
    ]);

    setContactsCount(contactsRes.count || 0);
    setGroupsCount(groupsRes.count || 0);
    setLabelsCount(labelsRes.count || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard/whatsapp')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp não conectado</CardTitle>
            <CardDescription>
              Conecte uma instância do WhatsApp para gerenciar contatos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard/whatsapp')}>
              Conectar WhatsApp
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/whatsapp')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Contatos WhatsApp</h1>
            <p className="text-muted-foreground">
              Gerencie contatos, grupos e etiquetas
            </p>
          </div>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveTab("contacts")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{contactsCount}</p>
              <p className="text-sm text-muted-foreground">Contatos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveTab("groups")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/10">
              <UsersRound className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{groupsCount}</p>
              <p className="text-sm text-muted-foreground">Grupos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveTab("labels")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/10">
              <Tags className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{labelsCount}</p>
              <p className="text-sm text-muted-foreground">Etiquetas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveTab("import")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-500/10">
              <Upload className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">Importar</p>
              <p className="text-sm text-muted-foreground">CSV ou Manual</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Config de auto-sync */}
      {storeId && <SyncConfigCard storeId={storeId} instance={instance} />}

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Contatos</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <UsersRound className="h-4 w-4" />
            <span className="hidden sm:inline">Grupos</span>
          </TabsTrigger>
          <TabsTrigger value="labels" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">Etiquetas</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-6">
          {storeId && <ContactsTab storeId={storeId} instance={instance} onRefresh={fetchCounts} />}
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          {storeId && <GroupsTab storeId={storeId} instance={instance} onRefresh={fetchCounts} />}
        </TabsContent>

        <TabsContent value="labels" className="mt-6">
          {storeId && <LabelsTab storeId={storeId} onRefresh={fetchCounts} />}
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          {storeId && <ImportTab storeId={storeId} instance={instance} onRefresh={fetchCounts} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
