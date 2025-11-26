import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Camera, Store } from 'lucide-react';

const createStoreSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  slug: z.string()
    .min(3, 'URL deve ter pelo menos 3 caracteres')
    .regex(/^[a-zA-Z0-9-]+$/, 'URL deve conter apenas letras, números e hífens'),
  description: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type CreateStoreFormData = z.infer<typeof createStoreSchema>;

interface CreateStoreFormProps {
  onStoreCreated: () => void;
}

export function CreateStoreForm({ onStoreCreated }: CreateStoreFormProps) {
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<CreateStoreFormData>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      phone: '',
      address: '',
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    form.setValue('name', name);
    if (name && !form.getValues('slug')) {
      form.setValue('slug', generateSlug(name));
    }
  };

  const checkSlugExists = async (slug: string): Promise<boolean> => {
    const { data } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .single();
    
    return !!data;
  };

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

  const handleLogoUpload = async (file: File) => {
    try {
      setLogoUploading(true);
      const url = await uploadImage(file, 'logos');
      setLogoUrl(url);
      toast({
        title: "Sucesso",
        description: "Logo enviado com sucesso!"
      });
    } catch (error: any) {
      console.error('Erro no upload do logo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o logo",
        variant: "destructive"
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    try {
      setCoverUploading(true);
      const url = await uploadImage(file, 'covers');
      setCoverUrl(url);
      toast({
        title: "Sucesso",
        description: "Capa enviada com sucesso!"
      });
    } catch (error: any) {
      console.error('Erro no upload da capa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a capa",
        variant: "destructive"
      });
    } finally {
      setCoverUploading(false);
    }
  };

  const onSubmit = async (data: CreateStoreFormData) => {
    if (!user) return;

    try {
      setLoading(true);

      // Verificar se o slug já existe
      const slugExists = await checkSlugExists(data.slug);
      if (slugExists) {
        form.setError('slug', { message: 'Esta URL já está sendo usada por outra loja' });
        return;
      }

      // Verificar se o usuário já tem uma loja
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (existingStore) {
        toast({
          title: "Erro",
          description: "Você já possui uma loja cadastrada",
          variant: "destructive"
        });
        return;
      }

      // Criar a loja
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert({
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          phone: data.phone || null,
          address: data.address || null,
          logo_url: logoUrl || null,
          cover_url: coverUrl || null,
          owner_id: user.id,
          status: 'active'
        })
        .select()
        .single();

      if (storeError) throw storeError;

      // Criar configuração padrão da loja
      const { error: configError } = await supabase
        .from('store_configurations')
        .insert({
          store_id: store.id,
          primary_color: '#3B82F6',
          secondary_color: '#10B981',
          product_display_layout: 'grid'
        });

      if (configError) {
        console.error('Erro ao criar configuração:', configError);
      }

      toast({
        title: "Sucesso",
        description: "Sua loja foi criada com sucesso!"
      });

      onStoreCreated();
    } catch (error: any) {
      console.error('Erro ao criar loja:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a loja",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Store className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold">Criar Minha Loja</h2>
        <p className="text-muted-foreground">
          Configure as informações básicas da sua loja
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informações básicas */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>
                    Digite as informações principais da sua loja
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Loja *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              onChange={(e) => handleNameChange(e.target.value)}
                              placeholder="Ex: Minha Loja"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL da Loja *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="minha-loja" />
                          </FormControl>
                          <FormDescription>
                            Sua loja ficará em: {field.value ? `mostralo.com/${field.value}` : 'mostralo.com/sua-url'}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Descreva sua loja..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="(11) 99999-9999" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Digite o endereço da sua loja..."
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Upload de imagens */}
            <div className="space-y-6">
              {/* Logo */}
              <Card>
                <CardHeader>
                  <CardTitle>Logo da Loja</CardTitle>
                  <CardDescription>Tamanho recomendado: 400x400px</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-4">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="Logo"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Camera className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={logoUploading}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleLogoUpload(file);
                      };
                      input.click();
                    }}
                  >
                    {logoUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        {logoUrl ? 'Alterar Logo' : 'Enviar Logo'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Capa */}
              <Card>
                <CardHeader>
                  <CardTitle>Imagem de Capa</CardTitle>
                  <CardDescription>Tamanho recomendado: 1200x400px</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                    {coverUrl ? (
                      <img 
                        src={coverUrl} 
                        alt="Capa"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Camera className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={coverUploading}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleCoverUpload(file);
                      };
                      input.click();
                    }}
                  >
                    {coverUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        {coverUrl ? 'Alterar Capa' : 'Enviar Capa'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="min-w-32"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Loja'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}