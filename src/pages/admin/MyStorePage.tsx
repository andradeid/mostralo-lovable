import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePageSEO } from '@/hooks/useSEO';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Store, Edit, Camera, Settings, ExternalLink, Eye, Copy } from 'lucide-react';
import { CreateStoreForm } from '@/components/admin/CreateStoreForm';
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

  const fetchMyStore = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar loja:', error);
        return;
      }

      setStore(data);
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

  useEffect(() => {
    fetchMyStore();
  }, [user]);

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

  const copyStoreUrl = () => {
    const storeUrl = `${window.location.origin}/loja/${store.slug}`;
    navigator.clipboard.writeText(storeUrl);
    toast({
      title: "Link copiado!",
      description: "O link da sua loja foi copiado para a área de transferência."
    });
  };

  const openStoreProfile = () => {
    window.open(`/loja/${store.slug}`, '_blank');
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Minha Loja</h1>
          <p className="text-muted-foreground">Gerencie as informações da sua loja</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={openStoreProfile}>
            <Eye className="w-4 h-4 mr-2" />
            Ver Loja Pública
          </Button>
          <Button variant="outline" onClick={copyStoreUrl}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar Link
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard/store-configuration')}>
            <Settings className="w-4 h-4 mr-2" />
            Configurar Loja
          </Button>
          <Button onClick={() => setEditing(!editing)}>
            <Edit className="w-4 h-4 mr-2" />
            {editing ? 'Cancelar' : 'Editar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso Público</CardTitle>
              <CardDescription>Compartilhe sua loja com clientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-sm font-medium">URL da Loja:</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="text-sm bg-background px-2 py-1 rounded flex-1">
                    {window.location.origin}/loja/{store.slug}
                  </code>
                  <Button size="sm" variant="outline" onClick={copyStoreUrl}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={openStoreProfile} className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar Loja
                </Button>
                <Button variant="outline" onClick={copyStoreUrl} className="flex-1">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Compartilhar Link
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                <strong>Dica:</strong> Use este link para compartilhar sua loja nas redes sociais, WhatsApp ou outros canais de marketing.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações da Loja</CardTitle>
              <CardDescription>Dados principais da sua loja</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Loja</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!editing}
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL da Loja</Label>
                  <Input 
                    id="slug" 
                    value={formData.slug} 
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    disabled={!editing}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  disabled={!editing}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone} 
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!editing}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant={statusInfo.variant}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Textarea 
                  id="address" 
                  value={formData.address} 
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!editing}
                  rows={2}
                />
              </div>

              {editing && (
                <div className="flex space-x-2 pt-4">
                  <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Imagens */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo da Loja</CardTitle>
              <CardDescription>Imagem principal da loja</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                {store.logo_url ? (
                  <img 
                    src={store.logo_url} 
                    alt="Logo da loja"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Camera className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              {editing && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  disabled={uploading.logo}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleImageUpload(file, 'logo');
                    };
                    input.click();
                  }}
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

          <Card>
            <CardHeader>
              <CardTitle>Imagem de Capa</CardTitle>
              <CardDescription>Banner da loja</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                {store.cover_url ? (
                  <img 
                    src={store.cover_url} 
                    alt="Capa da loja"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Camera className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              {editing && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  disabled={uploading.cover}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleImageUpload(file, 'cover');
                    };
                    input.click();
                  }}
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