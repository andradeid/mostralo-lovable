import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Phone, 
  Share2, 
  Calendar,
  Palette,
  Loader2,
  Upload
} from 'lucide-react';
import { useStoreDigitalCards } from '@/hooks/useStoreDigitalCards';
import { DigitalCardPreview } from '@/components/digital-card/DigitalCardPreview';
import type { CardFormData, CardTheme } from '@/types/digitalCard';
import { toast } from 'sonner';

const themeOptions: { value: CardTheme; label: string; preview: string }[] = [
  { value: 'dark', label: 'Escuro', preview: 'bg-zinc-900' },
  { value: 'light', label: 'Claro', preview: 'bg-white border' },
  { value: 'orange', label: 'Laranja', preview: 'bg-orange-500' },
  { value: 'gradient', label: 'Gradiente', preview: 'bg-gradient-to-br from-purple-600 to-pink-500' },
];

export default function StoreDigitalCardEditorPage() {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const { cards, storeData, loading, saving, updateCard, updatePhoto } = useStoreDigitalCards();

  const card = useMemo(() => {
    return cards.find(c => c.id === cardId);
  }, [cards, cardId]);

  const [formData, setFormData] = useState<Partial<CardFormData> & {
    inherit_store_data: boolean;
    booking_enabled: boolean;
    booking_button_text: string;
  }>({
    name: '',
    title: '',
    company: '',
    headline: '',
    bio: '',
    whatsapp: '',
    phone: '',
    email: '',
    website: '',
    instagram: '',
    linkedin: '',
    facebook: '',
    tiktok: '',
    youtube: '',
    cta_text: '',
    cta_url: '',
    custom_links: [],
    stats_text: '',
    theme: 'dark',
    accent_color: '#f97316',
    show_qr_code: true,
    show_mostralo_badge: true,
    slug: '',
    inherit_store_data: true,
    booking_enabled: true,
    booking_button_text: 'Agendar Horário',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Carregar dados do cartão existente
  useEffect(() => {
    if (card) {
      setFormData({
        name: card.name || '',
        title: card.title || '',
        company: card.company || '',
        headline: card.headline || '',
        bio: card.bio || '',
        whatsapp: card.whatsapp || '',
        phone: card.phone || '',
        email: card.email || '',
        website: card.website || '',
        instagram: card.instagram || '',
        linkedin: card.linkedin || '',
        facebook: card.facebook || '',
        tiktok: card.tiktok || '',
        youtube: card.youtube || '',
        cta_text: card.cta_text || '',
        cta_url: card.cta_url || '',
        custom_links: card.custom_links || [],
        stats_text: card.stats_text || '',
        theme: card.theme || 'dark',
        accent_color: card.accent_color || '#f97316',
        show_qr_code: card.show_qr_code ?? true,
        show_mostralo_badge: card.show_mostralo_badge ?? true,
        slug: card.slug || '',
        inherit_store_data: card.inherit_store_data ?? true,
        booking_enabled: card.booking_enabled ?? true,
        booking_button_text: card.booking_button_text || 'Agendar Horário',
      });
      setPhotoPreview(card.photo_url || card.professional?.photo_url || null);
    }
  }, [card]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!cardId) return;

    // Upload foto se houver nova
    if (photoFile) {
      await updatePhoto(cardId, photoFile);
    }

    const success = await updateCard(cardId, formData);
    if (success) {
      navigate('/dashboard/cartoes-equipe');
    }
  };

  // Gerar URL de agendamento
  const bookingUrl = useMemo(() => {
    if (!storeData?.slug || !card?.professional_id) return undefined;
    return `/agendar/${storeData.slug}?profissional=${card.professional_id}`;
  }, [storeData?.slug, card?.professional_id]);

  // Dados para preview (mescla dados herdados)
  const previewData: Partial<CardFormData> = useMemo(() => {
    const baseData = formData.inherit_store_data && storeData
      ? {
          ...formData,
          company: formData.company || storeData.name,
          whatsapp: formData.whatsapp || storeData.whatsapp || '',
          phone: formData.phone || storeData.phone || '',
          website: formData.website || storeData.website || '',
          instagram: formData.instagram || storeData.instagram || '',
          facebook: formData.facebook || storeData.facebook || '',
        }
      : formData;

    return {
      ...baseData,
      booking_enabled: formData.booking_enabled,
      booking_button_text: formData.booking_button_text,
    };
  }, [formData, storeData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cartão não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/cartoes-equipe')}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/cartoes-equipe')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Cartão</h1>
            <p className="text-muted-foreground">{card.name}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulário */}
        <div className="space-y-4">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="info" className="text-xs">
                <User className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Info</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="text-xs">
                <Phone className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Contato</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="text-xs">
                <Share2 className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Redes</span>
              </TabsTrigger>
              <TabsTrigger value="booking" className="text-xs">
                <Calendar className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Agenda</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="text-xs">
                <Palette className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Visual</span>
              </TabsTrigger>
            </TabsList>

            {/* Aba Informações */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações do Profissional</CardTitle>
                  <CardDescription>Dados que aparecem no cartão</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Foto */}
                  <div className="space-y-2">
                    <Label>Foto</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-muted overflow-hidden">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <label className="cursor-pointer">
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoChange}
                        />
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Alterar foto
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      placeholder="Nome do profissional"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cargo / Especialidade</Label>
                    <Input
                      value={formData.title}
                      onChange={e => handleInputChange('title', e.target.value)}
                      placeholder="Ex: Cabeleireiro, Barbeiro, Manicure"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Frase de destaque</Label>
                    <Input
                      value={formData.headline}
                      onChange={e => handleInputChange('headline', e.target.value)}
                      placeholder="Ex: Especialista em cortes modernos"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea
                      value={formData.bio}
                      onChange={e => handleInputChange('bio', e.target.value)}
                      placeholder="Conte um pouco sobre o profissional..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Slug (URL do cartão)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">/c/</span>
                      <Input
                        value={formData.slug}
                        onChange={e => handleInputChange('slug', e.target.value)}
                        placeholder="nome-profissional"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Contato */}
            <TabsContent value="contact" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações de Contato</CardTitle>
                  <CardDescription>Canais para os clientes entrarem em contato</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Herdar dados da loja</p>
                      <p className="text-xs text-muted-foreground">
                        Usa telefone, WhatsApp e redes da loja automaticamente
                      </p>
                    </div>
                    <Switch
                      checked={formData.inherit_store_data}
                      onCheckedChange={v => handleInputChange('inherit_store_data', v)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input
                      value={formData.whatsapp}
                      onChange={e => handleInputChange('whatsapp', e.target.value)}
                      placeholder={formData.inherit_store_data && storeData?.whatsapp ? `Herdado: ${storeData.whatsapp}` : '5511999999999'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={formData.phone}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      placeholder={formData.inherit_store_data && storeData?.phone ? `Herdado: ${storeData.phone}` : '(11) 99999-9999'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input
                      value={formData.website}
                      onChange={e => handleInputChange('website', e.target.value)}
                      placeholder={formData.inherit_store_data && storeData?.website ? `Herdado: ${storeData.website}` : 'https://...'}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Redes Sociais */}
            <TabsContent value="social" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Redes Sociais</CardTitle>
                  <CardDescription>Links para redes sociais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Instagram</Label>
                    <Input
                      value={formData.instagram}
                      onChange={e => handleInputChange('instagram', e.target.value)}
                      placeholder="@usuario"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Facebook</Label>
                    <Input
                      value={formData.facebook}
                      onChange={e => handleInputChange('facebook', e.target.value)}
                      placeholder="URL ou username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>TikTok</Label>
                    <Input
                      value={formData.tiktok}
                      onChange={e => handleInputChange('tiktok', e.target.value)}
                      placeholder="@usuario"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>YouTube</Label>
                    <Input
                      value={formData.youtube}
                      onChange={e => handleInputChange('youtube', e.target.value)}
                      placeholder="URL do canal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>LinkedIn</Label>
                    <Input
                      value={formData.linkedin}
                      onChange={e => handleInputChange('linkedin', e.target.value)}
                      placeholder="URL do perfil"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Agendamento */}
            <TabsContent value="booking" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Botão de Agendamento</CardTitle>
                  <CardDescription>
                    Configure o botão que leva o cliente para agendar com este profissional
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Mostrar botão de agendamento</p>
                      <p className="text-xs text-muted-foreground">
                        Permite que clientes agendem diretamente com este profissional
                      </p>
                    </div>
                    <Switch
                      checked={formData.booking_enabled}
                      onCheckedChange={v => handleInputChange('booking_enabled', v)}
                    />
                  </div>

                  {formData.booking_enabled && (
                    <div className="space-y-2">
                      <Label>Texto do botão</Label>
                      <Input
                        value={formData.booking_button_text}
                        onChange={e => handleInputChange('booking_button_text', e.target.value)}
                        placeholder="Agendar Horário"
                      />
                    </div>
                  )}

                  {formData.booking_enabled && storeData && (
                    <div className="p-3 bg-primary/10 rounded-lg text-sm">
                      <p className="font-medium text-primary mb-1">Preview da URL:</p>
                      <code className="text-xs">
                        /agendar/{storeData.slug}?profissional={card.professional_id}
                      </code>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Aparência */}
            <TabsContent value="appearance" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Aparência</CardTitle>
                  <CardDescription>Personalize o visual do cartão</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tema</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {themeOptions.map(theme => (
                        <button
                          key={theme.value}
                          type="button"
                          onClick={() => handleInputChange('theme', theme.value)}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            formData.theme === theme.value 
                              ? 'border-primary' 
                              : 'border-transparent hover:border-muted-foreground/20'
                          }`}
                        >
                          <div className={`w-full h-8 rounded ${theme.preview} mb-1`} />
                          <span className="text-xs">{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Cor de destaque</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.accent_color}
                        onChange={e => handleInputChange('accent_color', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={formData.accent_color}
                        onChange={e => handleInputChange('accent_color', e.target.value)}
                        className="w-28"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Mostrar QR Code</p>
                      <p className="text-xs text-muted-foreground">Exibe QR code para salvar contato</p>
                    </div>
                    <Switch
                      checked={formData.show_qr_code}
                      onCheckedChange={v => handleInputChange('show_qr_code', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Badge Mostralo</p>
                      <p className="text-xs text-muted-foreground">Exibe "Powered by MOSTRALO"</p>
                    </div>
                    <Switch
                      checked={formData.show_mostralo_badge}
                      onCheckedChange={v => handleInputChange('show_mostralo_badge', v)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="max-h-[600px] overflow-y-auto rounded-lg">
                <DigitalCardPreview
                  data={previewData}
                  photoUrl={photoPreview}
                  bookingUrl={formData.booking_enabled ? bookingUrl : undefined}
                  className="scale-90 origin-top"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
