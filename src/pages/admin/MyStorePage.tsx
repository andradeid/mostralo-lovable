import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePageSEO } from '@/hooks/useSEO';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Store, Edit, Camera, Settings, ExternalLink, Eye, Copy, PauseCircle, PlayCircle, Globe, Link2, Share2, X } from 'lucide-react';
import { CreateStoreForm } from '@/components/admin/CreateStoreForm';
import { SalesChannelsCard } from '@/components/admin/store/SalesChannelsCard';
import { useNavigate } from 'react-router-dom';

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  theme_colors: any;
  created_at: string;
  business_hours: any;
}

const MyStorePage = () => {
  usePageSEO({
    title: 'Minha Loja - Mostralo | Configurações da Loja',
    description: 'Gerencie as informações da sua loja: nome, descrição, imagens, contato e muito mais. Configure sua presença digital.',
    keywords: 'configurar loja, gerenciar loja, informações loja, logo loja, capa loja'
  });

  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [uploading, setUploading] = useState({ logo: false, cover: false });
  const [isServicePaused, setIsServicePaused] = useState(false);
  const [togglingPause, setTogglingPause] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    phone: '',
    address: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { storeId: activeStoreId, isLoading: storeAccessLoading } = useStoreAccess();

  const fetchMyStore = async () => {
    if (!user) return;
    
    try {
      let query = supabase.from('stores').select('*');
      
      if (activeStoreId) {
        query = query.eq('id', activeStoreId);
      } else {
        query = query.eq('owner_id', user.id);
      }
      
      const { data, error } = await query.single();

      if (error) {
        console.error('Erro ao buscar loja:', error);
        return;
      }

      setStore(data as StoreData);
      setIsServicePaused((data.business_hours as any)?.service_paused || false);
      setFormData({
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        phone: data.phone || '',
        address: data.address || ''
      });
    } catch (error) {
      console.error('Erro ao buscar loja:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleServicePause = async () => {
    if (!store) return;
    
    setTogglingPause(true);
    try {
      const newPausedState = !isServicePaused;
      const updatedBusinessHours = {
        ...(store.business_hours || {}),
        service_paused: newPausedState
      };
      
      const { error } = await supabase
        .from('stores')
        .update({ business_hours: updatedBusinessHours })
        .eq('id', store.id);
      
      if (error) throw error;
      
      setIsServicePaused(newPausedState);
      setStore(prev => prev ? { ...prev, business_hours: updatedBusinessHours } : null);
      
      toast({
        title: newPausedState ? '⏸️ Loja fechada' : '✅ Loja aberta',
        description: newPausedState 
          ? 'Sua loja está temporariamente fechada para novos pedidos'
          : 'Sua loja está aberta e recebendo pedidos'
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status da loja',
        variant: 'destructive'
      });
    } finally {
      setTogglingPause(false);
    }
  };

  useEffect(() => {
    if (!storeAccessLoading) fetchMyStore();
  }, [user, activeStoreId, storeAccessLoading]);

  const uploadImage = async (file: File, folder: string): Promise<string> => {
    if (!user) throw new Error('Usuário não autenticado');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${folder}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('store-assets')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('store-assets')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'cover') => {
    if (!store) return;

    try {
      setUploading(prev => ({ ...prev, [type]: true }));
      const url = await uploadImage(file, `${type}s`);
      
      const { error } = await supabase
        .from('stores')
        .update({ [`${type}_url`]: url })
        .eq('id', store.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${type === 'logo' ? 'Logo' : 'Capa'} atualizado com sucesso!`
      });

      fetchMyStore();
    } catch (error: any) {
      console.error(`Erro no upload do ${type}:`, error);
      toast({
        title: "Erro",
        description: `Não foi possível enviar o ${type === 'logo' ? 'logo' : 'capa'}`,
        variant: "destructive"
      });
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const storeUrl = store ? `${window.location.origin}/loja/${store.slug}` : '';

  const copyStoreUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    toast({
      title: "Link copiado!",
      description: "O link da sua loja foi copiado para a área de transferência."
    });
  };

  const shareStoreUrl = () => {
    if (navigator.share) {
      navigator.share({ title: store?.name, url: storeUrl });
    } else {
      copyStoreUrl();
    }
  };

  const openStoreProfile = () => {
    window.open(`/loja/${store?.slug}`, '_blank');
  };

  const handleSaveChanges = async () => {
    if (!user || !store) return;

    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          phone: formData.phone || null,
          address: formData.address || null
        })
        .eq('id', store.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Informações da loja atualizadas com sucesso!"
      });

      setEditing(false);
      fetchMyStore();
    } catch (error: any) {
      console.error('Erro ao atualizar loja:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as informações",
        variant: "destructive"
      });
    }
  };

  const triggerFileUpload = (type: 'logo' | 'cover') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleImageUpload(file, type);
    };
    input.click();
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Ativa', variant: 'default' as const, color: 'bg-green-500' };
      case 'suspended':
        return { label: 'Suspensa', variant: 'outline' as const, color: 'bg-yellow-500' };
      case 'inactive':
        return { label: 'Inativa', variant: 'destructive' as const, color: 'bg-red-500' };
      default:
        return { label: status, variant: 'secondary' as const, color: 'bg-gray-500' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store && showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Minha Loja</h1>
            <p className="text-muted-foreground">Configure sua nova loja</p>
          </div>
          <Button variant="outline" onClick={() => setShowCreateForm(false)}>
            Voltar
          </Button>
        </div>
        
        <CreateStoreForm onStoreCreated={() => {
          setShowCreateForm(false);
          fetchMyStore();
        }} />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Minha Loja</h1>
            <p className="text-muted-foreground">Você ainda não possui uma loja</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="text-center py-12">
            <Store className="w-16 h-16 mx-auto text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma loja encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não possui uma loja cadastrada no sistema. Crie sua loja agora e comece a vender!
            </p>
            <Button onClick={() => setShowCreateForm(true)} size="lg">
              <Store className="w-4 h-4 mr-2" />
              Criar Minha Loja
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(store.status);

  return (
    <div className="space-y-5 sm:space-y-6 max-w-6xl">
      {/* ==================== HEADER ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-border shadow-sm">
            {store.logo_url ? (
              <AvatarImage src={store.logo_url} alt={store.name} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
              {store.name?.charAt(0)?.toUpperCase() || 'L'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{store.name}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Gerencie as informações da sua loja</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={openStoreProfile}>
            <Eye className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Ver Loja</span>
            <span className="sm:hidden">Ver</span>
          </Button>
          <Button variant="outline" size="sm" onClick={copyStoreUrl}>
            <Copy className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Copiar Link</span>
            <span className="sm:hidden">Copiar</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/store-configuration')}>
            <Settings className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Configurar</span>
            <span className="sm:hidden">Config</span>
          </Button>
          <Button size="sm" onClick={() => setEditing(!editing)} variant={editing ? 'outline' : 'default'}>
            {editing ? <X className="w-4 h-4 mr-1.5" /> : <Edit className="w-4 h-4 mr-1.5" />}
            {editing ? 'Cancelar' : 'Editar'}
          </Button>
        </div>
      </div>

      {/* ==================== STATUS DA LOJA ==================== */}
      <Card className={`border transition-all duration-300 ${
        isServicePaused 
          ? 'border-destructive/30 bg-destructive/5' 
          : 'border-emerald-500/30 bg-emerald-500/5'
      }`}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`p-2.5 sm:p-3 rounded-xl transition-colors ${
                isServicePaused 
                  ? 'bg-destructive/10' 
                  : 'bg-emerald-500/10'
              }`}>
                {isServicePaused ? (
                  <PauseCircle className="w-6 h-6 sm:w-7 sm:h-7 text-destructive" />
                ) : (
                  <PlayCircle className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />
                )}
              </div>
              <div>
                <p className={`font-semibold text-sm sm:text-base ${
                  isServicePaused ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {isServicePaused ? 'Loja Fechada' : 'Loja Aberta'}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isServicePaused 
                    ? 'Novos pedidos estão desabilitados' 
                    : 'Recebendo pedidos normalmente'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground hidden sm:block">
                {isServicePaused ? 'Abrir' : 'Fechar'}
              </span>
              <Switch
                checked={!isServicePaused}
                onCheckedChange={toggleServicePause}
                disabled={togglingPause}
                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-destructive"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==================== CANAIS DE VENDAS ==================== */}
      <SalesChannelsCard storeId={store.id} storeSlug={store.slug} />

      {/* ==================== CONTEÚDO PRINCIPAL ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Coluna esquerda - Informações */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          {/* Acesso Público */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Acesso Público</CardTitle>
                  <CardDescription className="text-xs">Compartilhe sua loja com clientes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">URL da Loja:</Label>
                <div className="flex items-center gap-2">
                  <code className="text-xs sm:text-sm bg-background px-3 py-2 rounded-md flex-1 break-all border border-border/40 font-mono">
                    {storeUrl}
                  </code>
                  <Button size="icon" variant="ghost" onClick={copyStoreUrl} className="shrink-0 h-9 w-9">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button onClick={openStoreProfile} size="sm" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar Loja
                </Button>
                <Button variant="outline" onClick={shareStoreUrl} size="sm" className="w-full">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar Link
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                <strong>Dica:</strong> Use este link para compartilhar sua loja nas redes sociais, WhatsApp ou outros canais de marketing.
              </p>
            </CardContent>
          </Card>

          {/* Informações da Loja */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Store className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Informações da Loja</CardTitle>
                  <CardDescription className="text-xs">Dados principais da sua loja</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Nome e Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium">Nome da Loja</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!editing}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slug" className="text-xs font-medium">URL da Loja</Label>
                  <Input 
                    id="slug" 
                    value={formData.slug} 
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    disabled={!editing}
                    className="h-10"
                  />
                </div>
              </div>

              <Separator className="opacity-50" />

              {/* Descrição */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-medium">Descrição</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  disabled={!editing}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Separator className="opacity-50" />

              {/* Telefone e Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-medium">Telefone</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone} 
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!editing}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Status</Label>
                  <div className="flex items-center h-10">
                    <Badge variant={statusInfo.variant} className="text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.color} mr-1.5`} />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator className="opacity-50" />

              {/* Endereço */}
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-medium">Endereço</Label>
                <Textarea 
                  id="address" 
                  value={formData.address} 
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!editing}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Botões de Ação */}
              {editing && (
                <>
                  <Separator />
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <Button onClick={handleSaveChanges} className="flex-1 sm:flex-initial">
                      Salvar Alterações
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)} className="flex-1 sm:flex-initial">
                      Cancelar
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ==================== COLUNA DIREITA - IDENTIDADE VISUAL ==================== */}
        <div className="space-y-5 sm:space-y-6">
          {/* Logo */}
          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Logo da Loja</CardTitle>
              <CardDescription className="text-xs">Imagem principal da loja</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted/50 rounded-xl flex items-center justify-center overflow-hidden border border-border/40 shadow-sm">
                {store.logo_url ? (
                  <img 
                    src={store.logo_url} 
                    alt="Logo da loja"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Camera className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground/60">Sem logo</p>
                  </div>
                )}
              </div>
              {editing && (
                <Button 
                  variant="outline" 
                  className="w-full mt-3"
                  size="sm"
                  disabled={uploading.logo}
                  onClick={() => triggerFileUpload('logo')}
                >
                  {uploading.logo ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Alterar Logo
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Capa */}
          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Imagem de Capa</CardTitle>
              <CardDescription className="text-xs">Banner da loja</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted/50 rounded-xl flex items-center justify-center overflow-hidden border border-border/40 shadow-sm">
                {store.cover_url ? (
                  <img 
                    src={store.cover_url} 
                    alt="Capa da loja"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Camera className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground/60">Sem capa</p>
                  </div>
                )}
              </div>
              {editing && (
                <Button 
                  variant="outline" 
                  className="w-full mt-3"
                  size="sm"
                  disabled={uploading.cover}
                  onClick={() => triggerFileUpload('cover')}
                >
                  {uploading.cover ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Alterar Capa
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyStorePage;
