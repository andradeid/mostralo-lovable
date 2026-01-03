import { useState, useEffect, useRef } from 'react';
import { 
  User, Phone, Mail, Globe, Instagram, Linkedin, Facebook, 
  Palette, Link2, Plus, Trash2, Upload, Youtube, Loader2, Eye, EyeOff
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { DigitalCardPreview } from './DigitalCardPreview';
import { useDigitalCard } from '@/hooks/useDigitalCard';
import type { CardFormData, CardTheme, CustomLink } from '@/types/digitalCard';

const THEMES: { value: CardTheme; label: string; preview: string }[] = [
  { value: 'dark', label: 'Escuro', preview: 'bg-zinc-900' },
  { value: 'light', label: 'Claro', preview: 'bg-gray-100' },
  { value: 'orange', label: 'Laranja', preview: 'bg-gradient-to-r from-orange-500 to-amber-500' },
  { value: 'gradient', label: 'Gradiente', preview: 'bg-gradient-to-r from-purple-600 to-indigo-600' },
];

const ACCENT_COLORS = [
  '#f97316', // Orange
  '#ef4444', // Red
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f59e0b', // Amber
];

interface DigitalCardEditorProps {
  ownerType?: 'salesperson' | 'admin';
}

export function DigitalCardEditor({ ownerType = 'salesperson' }: DigitalCardEditorProps) {
  const { card, loading, saving, saveCard, updatePhoto, toggleActive, generateSlug } = useDigitalCard();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState<CardFormData>({
    name: '',
    title: '',
    company: 'MOSTRALO',
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
    cta_text: 'Fale Comigo',
    cta_url: '',
    custom_links: [],
    stats_text: '',
    theme: 'dark',
    accent_color: '#f97316',
    show_qr_code: true,
    show_mostralo_badge: true,
    slug: '',
  });

  useEffect(() => {
    if (card) {
      setFormData({
        name: card.name || '',
        title: card.title || '',
        company: card.company || 'MOSTRALO',
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
        cta_text: card.cta_text || 'Fale Comigo',
        cta_url: card.cta_url || '',
        custom_links: card.custom_links || [],
        stats_text: card.stats_text || '',
        theme: card.theme || 'dark',
        accent_color: card.accent_color || '#f97316',
        show_qr_code: card.show_qr_code ?? true,
        show_mostralo_badge: card.show_mostralo_badge ?? true,
        slug: card.slug || '',
      });
    }
  }, [card]);

  const updateField = <K extends keyof CardFormData>(field: K, value: CardFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNameChange = (name: string) => {
    updateField('name', name);
    if (!card?.slug) {
      updateField('slug', generateSlug(name));
    }
  };

  const addCustomLink = () => {
    const newLink: CustomLink = {
      id: crypto.randomUUID(),
      icon: 'link',
      label: '',
      url: '',
    };
    updateField('custom_links', [...formData.custom_links, newLink]);
  };

  const updateCustomLink = (id: string, field: keyof CustomLink, value: string) => {
    const updated = formData.custom_links.map(link =>
      link.id === id ? { ...link, [field]: value } : link
    );
    updateField('custom_links', updated);
  };

  const removeCustomLink = (id: string) => {
    updateField('custom_links', formData.custom_links.filter(link => link.id !== id));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await updatePhoto(file);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      return;
    }
    await saveCard(formData, ownerType);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Editor */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Editor do Cartão</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {previewMode ? 'Editar' : 'Preview'}
            </Button>
          </div>
        </div>

        {(!previewMode || window.innerWidth >= 1024) && (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="contact">Contato</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="style">Estilo</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Foto */}
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-20 h-20 rounded-full bg-muted flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {card?.photo_url ? (
                        <img src={card.photo_url} alt="Foto" className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!card}
                      >
                        {card ? 'Alterar Foto' : 'Salve primeiro para adicionar foto'}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">JPG ou PNG, max 2MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Seu nome completo"
                      />
                    </div>

                    <div>
                      <Label htmlFor="title">Título / Cargo</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder="Ex: Consultor de Vendas"
                      />
                    </div>

                    <div>
                      <Label htmlFor="company">Empresa</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => updateField('company', e.target.value)}
                        placeholder="MOSTRALO"
                      />
                    </div>

                    <div>
                      <Label htmlFor="headline">Headline</Label>
                      <Input
                        id="headline"
                        value={formData.headline}
                        onChange={(e) => updateField('headline', e.target.value)}
                        placeholder="Especialista em Delivery + Marketing"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => updateField('bio', e.target.value)}
                        placeholder="Uma breve descrição sobre você..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="stats">Estatística Destacada</Label>
                      <Input
                        id="stats"
                        value={formData.stats_text}
                        onChange={(e) => updateField('stats_text', e.target.value)}
                        placeholder="Ex: +100 lojistas atendidos"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Contatos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => updateField('whatsapp', e.target.value)}
                      placeholder="11999999999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="11999999999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://seusite.com"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Instagram className="w-4 h-4" />
                      Redes Sociais
                    </h4>

                    <div>
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        value={formData.instagram}
                        onChange={(e) => updateField('instagram', e.target.value)}
                        placeholder="@seuusuario"
                      />
                    </div>

                    <div>
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={formData.linkedin}
                        onChange={(e) => updateField('linkedin', e.target.value)}
                        placeholder="seuusuario"
                      />
                    </div>

                    <div>
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        value={formData.facebook}
                        onChange={(e) => updateField('facebook', e.target.value)}
                        placeholder="seuusuario"
                      />
                    </div>

                    <div>
                      <Label htmlFor="youtube">YouTube</Label>
                      <Input
                        id="youtube"
                        value={formData.youtube}
                        onChange={(e) => updateField('youtube', e.target.value)}
                        placeholder="@seucanal"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="links" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Link2 className="w-5 h-5" />
                    CTA Principal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cta_text">Texto do Botão</Label>
                    <Input
                      id="cta_text"
                      value={formData.cta_text}
                      onChange={(e) => updateField('cta_text', e.target.value)}
                      placeholder="Fale Comigo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cta_url">URL de Destino</Label>
                    <Input
                      id="cta_url"
                      value={formData.cta_url}
                      onChange={(e) => updateField('cta_url', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Links Customizados
                    </span>
                    <Button size="sm" variant="outline" onClick={addCustomLink}>
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.custom_links.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum link customizado. Clique em "Adicionar" para criar.
                    </p>
                  ) : (
                    formData.custom_links.map((link) => (
                      <div key={link.id} className="flex items-center gap-2">
                        <Input
                          value={link.label}
                          onChange={(e) => updateCustomLink(link.id, 'label', e.target.value)}
                          placeholder="Título do link"
                          className="flex-1"
                        />
                        <Input
                          value={link.url}
                          onChange={(e) => updateCustomLink(link.id, 'url', e.target.value)}
                          placeholder="https://..."
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeCustomLink(link.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="style" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Aparência
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-3 block">Tema</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {THEMES.map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => updateField('theme', theme.value)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            formData.theme === theme.value 
                              ? 'border-primary ring-2 ring-primary/20' 
                              : 'border-muted hover:border-muted-foreground/30'
                          }`}
                        >
                          <div className={`w-full h-12 rounded-md mb-2 ${theme.preview}`} />
                          <span className="text-sm font-medium">{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block">Cor de Destaque</Label>
                    <div className="flex flex-wrap gap-2">
                      {ACCENT_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => updateField('accent_color', color)}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            formData.accent_color === color 
                              ? 'border-foreground scale-110' 
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Mostrar QR Code</Label>
                        <p className="text-xs text-muted-foreground">Exibir QR code no cartão</p>
                      </div>
                      <Switch
                        checked={formData.show_qr_code}
                        onCheckedChange={(checked) => updateField('show_qr_code', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Badge Mostralo</Label>
                        <p className="text-xs text-muted-foreground">Exibir "Powered by MOSTRALO"</p>
                      </div>
                      <Switch
                        checked={formData.show_mostralo_badge}
                        onCheckedChange={(checked) => updateField('show_mostralo_badge', checked)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="slug">URL do Cartão</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">/c/</span>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="seu-slug"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Ações */}
        <div className="flex gap-3">
          <Button 
            onClick={handleSave} 
            disabled={saving || !formData.name.trim()}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              card ? 'Salvar Alterações' : 'Criar Cartão'
            )}
          </Button>

          {card && (
            <Button variant="outline" onClick={toggleActive}>
              {card.is_active ? 'Desativar' : 'Ativar'}
            </Button>
          )}
        </div>

        {card && (
          <div className="p-4 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">Link do seu cartão:</p>
            <code className="text-primary">
              {window.location.origin}/c/{card.slug}
            </code>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className={`sticky top-6 ${previewMode || window.innerWidth >= 1024 ? 'block' : 'hidden lg:block'}`}>
        <h3 className="text-lg font-semibold mb-4 text-center">Preview</h3>
        <DigitalCardPreview 
          data={formData} 
          photoUrl={card?.photo_url}
        />
      </div>
    </div>
  );
}
