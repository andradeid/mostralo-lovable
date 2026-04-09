import { useState, useEffect, useRef } from "react";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { useLegacyPageByStore, useSaveLegacyPage } from "@/hooks/useLegacyPage";
import { LegacyPageRenderer } from "@/components/legacy-page/LegacyPageRenderer";
import type { LegacyPageData, LegacyInfoCard, LegacyActionButton } from "@/types/legacyPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Save, Plus, Trash2, Eye, Loader2, ExternalLink, Copy, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_PAGE: Partial<LegacyPageData> = {
  store_name: '',
  subtitle: '',
  logo_url: '',
  slug: '',
  is_active: true,
  background_gradient: '135deg, #ff758c, #ff7eb3, #667eea',
  card_border_color: '#ff7eb3',
  logo_border_color: '#ff7eb3',
  info_cards: [
    { icon: '⏱️', label: 'TEMPO DE ENTREGA', value: '30-50 minutos' },
    { icon: '💰', label: 'PAGAMENTO', value: 'Dinheiro, Pix, Cartão' },
    { icon: '🎉', label: 'ESPECIALIDADES', value: 'Diversos produtos' },
  ],
  action_buttons: [
    { type: 'primary', label: '🛒 VER CARDÁPIO COMPLETO', url: '', color: '#ff758c' },
    { type: 'whatsapp', label: '💬 FAZER PEDIDO POR WHATSAPP', url: '', color: '#25D366' },
  ],
  confetti_enabled: false,
  particles_enabled: false,
  bubbles_enabled: false,
  snow_enabled: false,
  animated_gradient_enabled: false,
  og_title: '',
  og_description: '',
  og_image: '',
  footer_text: '',
};

const MAX_LOGO_SIZE = 1 * 1024 * 1024; // 1MB

export default function LegacyPageEditor() {
  const { storeId: validatedStoreId } = useStoreAccess();
  const { data: existingPage, isLoading } = useLegacyPageByStore(validatedStoreId);
  const saveMutation = useSaveLegacyPage();
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ogImageInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Partial<LegacyPageData>>(DEFAULT_PAGE);

  useEffect(() => {
    if (existingPage) {
      setForm(existingPage);
    }
  }, [existingPage]);

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Logo upload
  const handleLogoUpload = async (file: File) => {
    if (!validatedStoreId) return;

    if (file.size > MAX_LOGO_SIZE) {
      toast({ title: "Arquivo muito grande", description: "A logo deve ter no máximo 1MB.", variant: "destructive" });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ title: "Arquivo inválido", description: "Envie apenas imagens (JPG, PNG, WebP).", variant: "destructive" });
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${validatedStoreId}/legacy-logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('store-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('store-assets')
        .getPublicUrl(fileName);

      updateField('logo_url', data.publicUrl);
      toast({ title: "Logo enviada com sucesso!" });
    } catch (error) {
      console.error('Erro ao fazer upload da logo:', error);
      toast({ title: "Erro no upload", description: "Não foi possível enviar a imagem.", variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  // OG Image upload
  const handleOgImageUpload = async (file: File) => {
    if (!validatedStoreId) return;
    if (file.size > 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "A imagem deve ter no máximo 1MB.", variant: "destructive" });
      return;
    }
    setUploadingOgImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${validatedStoreId}/legacy-og-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('store-assets')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage
        .from('store-assets')
        .getPublicUrl(fileName);
      updateField('og_image', data.publicUrl);
      toast({ title: "Imagem OG enviada com sucesso!" });
    } catch (error) {
      console.error('Erro ao fazer upload da imagem OG:', error);
      toast({ title: "Erro no upload", description: "Não foi possível enviar a imagem.", variant: "destructive" });
    } finally {
      setUploadingOgImage(false);
    }
  };

  const removeLogo = () => {
    updateField('logo_url', '');
  };

  // Info cards helpers
  const addInfoCard = () => {
    const cards = [...(form.info_cards || []), { icon: '📌', label: 'NOVO ITEM', value: 'Descrição' }];
    updateField('info_cards', cards);
  };

  const updateInfoCard = (idx: number, field: keyof LegacyInfoCard, value: string) => {
    const cards = [...(form.info_cards || [])];
    cards[idx] = { ...cards[idx], [field]: value };
    updateField('info_cards', cards);
  };

  const removeInfoCard = (idx: number) => {
    updateField('info_cards', (form.info_cards || []).filter((_, i) => i !== idx));
  };

  // Action buttons helpers
  const addButton = () => {
    const btns = [...(form.action_buttons || []), { type: 'secondary' as const, label: 'Novo Botão', url: '', color: '#333333' }];
    updateField('action_buttons', btns);
  };

  const updateButton = (idx: number, field: keyof LegacyActionButton, value: string) => {
    const btns = [...(form.action_buttons || [])];
    btns[idx] = { ...btns[idx], [field]: value };
    updateField('action_buttons', btns);
  };

  const removeButton = (idx: number) => {
    updateField('action_buttons', (form.action_buttons || []).filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!validatedStoreId) return;
    if (!form.slug?.trim()) {
      toast({ title: "Preencha o slug da página", variant: "destructive" });
      return;
    }
    saveMutation.mutate({
      ...form,
      store_id: validatedStoreId,
      id: existingPage?.id,
    } as any);
  };

  const publicUrl = form.slug ? `${window.location.origin}/p/${form.slug}` : '';

  const copyUrl = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      toast({ title: "Link copiado!" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Preview mode (fullscreen)
  if (showPreview) {
    return (
      <div className="relative min-h-screen">
        <Button
          onClick={() => setShowPreview(false)}
          className="fixed top-2 right-2 z-50 text-xs sm:text-sm"
          variant="secondary"
          size="sm"
        >
          ← Voltar ao Editor
        </Button>
        <LegacyPageRenderer page={form as LegacyPageData} isPreview />
      </div>
    );
  }

  return (
    <div className="px-2 py-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">LinkCard (legacy)</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Personalize sua página de landing pública</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="flex-1 sm:flex-none">
            <Eye className="w-4 h-4 mr-1.5" /> Preview
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending} className="flex-1 sm:flex-none">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
            Salvar
          </Button>
          <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
            <a href="https://www.restaurantlogin.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-1.5" /> Configurar Cardápio
            </a>
          </Button>
        </div>
      </div>

      {/* Link público */}
      {publicUrl && (
        <Card className="border-primary/20 bg-primary/5 mb-4 md:mb-6">
          <CardContent className="py-2.5 px-3 sm:px-4 flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">Link público:</span>
            <code className="text-xs sm:text-sm bg-background px-1.5 py-0.5 rounded flex-1 truncate min-w-0">{publicUrl}</code>
            <Button size="icon" variant="ghost" onClick={copyUrl} className="h-7 w-7 shrink-0">
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => window.open(publicUrl, '_blank')} className="h-7 w-7 shrink-0">
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Layout: Editor + Phone Mockup */}
      <div className="flex gap-6 items-start">
        {/* Editor (lado esquerdo) */}
        <div className="flex-1 min-w-0 w-full max-w-3xl">
          <Tabs defaultValue="content" className="space-y-3 sm:space-y-4">
            <TabsList className="flex flex-wrap h-auto gap-1 p-1 w-full">
              <TabsTrigger value="content" className="flex-1 min-w-[70px] text-xs sm:text-sm px-2 py-1.5">Conteúdo</TabsTrigger>
              <TabsTrigger value="appearance" className="flex-1 min-w-[70px] text-xs sm:text-sm px-2 py-1.5">Aparência</TabsTrigger>
              <TabsTrigger value="info" className="flex-1 min-w-[70px] text-xs sm:text-sm px-2 py-1.5">Informações</TabsTrigger>
              <TabsTrigger value="buttons" className="flex-1 min-w-[70px] text-xs sm:text-sm px-2 py-1.5">Botões</TabsTrigger>
              <TabsTrigger value="effects" className="flex-1 min-w-[70px] text-xs sm:text-sm px-2 py-1.5">Efeitos</TabsTrigger>
              <TabsTrigger value="seo" className="flex-1 min-w-[70px] text-xs sm:text-sm px-2 py-1.5">SEO</TabsTrigger>
            </TabsList>

            {/* Tab: Conteúdo */}
            <TabsContent value="content">
              <Card>
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-4"><CardTitle className="text-base sm:text-lg">Conteúdo da Página</CardTitle></CardHeader>
                <CardContent className="space-y-4 px-3 sm:px-6">
                  <div className="space-y-2">
                    <Label>Slug (URL)</Label>
                    <Input
                      value={form.slug || ''}
                      onChange={e => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="minha-loja"
                    />
                    <p className="text-xs text-muted-foreground">Será acessível em /p/{form.slug || 'minha-loja'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={form.is_active ?? true}
                      onCheckedChange={v => updateField('is_active', v)}
                    />
                    <Label>Página ativa</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome da loja</Label>
                    <Input value={form.store_name || ''} onChange={e => updateField('store_name', e.target.value)} placeholder="Casa de Kit Festas" />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtítulo</Label>
                    <Input value={form.subtitle || ''} onChange={e => updateField('subtitle', e.target.value)} placeholder="Sua festa perfeita! 🎈" />
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label>Logo da loja</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                        e.target.value = '';
                      }}
                    />
                    {form.logo_url ? (
                      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <img
                          src={form.logo_url}
                          alt="Logo da loja"
                          className="w-16 h-16 rounded-full object-cover border-2 border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{form.logo_url.split('/').pop()}</p>
                          <p className="text-xs text-muted-foreground">Logo carregada</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingLogo}
                          >
                            {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={removeLogo}>
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                      >
                        {uploadingLogo ? (
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Clique ou arraste para enviar a logo</p>
                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WebP • Máximo 1MB</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Texto do rodapé</Label>
                    <Input value={form.footer_text || ''} onChange={e => updateField('footer_text', e.target.value)} placeholder="Clique no botão acima para ver o cardápio" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Aparência */}
            <TabsContent value="appearance">
              <Card>
                <CardHeader><CardTitle>Aparência Visual</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    // Parse gradient string into parts
                    const gradientStr = form.background_gradient || '135deg, #ff758c, #ff7eb3, #667eea';
                    const parts = gradientStr.split(',').map((s: string) => s.trim());
                    const hasDeg = parts[0]?.includes('deg');
                    const angle = hasDeg ? parseInt(parts[0]) || 135 : 135;
                    const colors = hasDeg ? parts.slice(1) : parts;
                    const isGradient = colors.length > 1;

                    const buildGradient = (newAngle: number, newColors: string[]) => {
                      if (newColors.length <= 1) {
                        updateField('background_gradient', newColors[0] || '#ff758c');
                      } else {
                        updateField('background_gradient', `${newAngle}deg, ${newColors.join(', ')}`);
                      }
                    };

                    const updateColor = (index: number, value: string) => {
                      const newColors = [...colors];
                      newColors[index] = value;
                      buildGradient(angle, newColors);
                    };

                    const toggleGradient = () => {
                      if (isGradient) {
                        buildGradient(angle, [colors[0] || '#ff758c']);
                      } else {
                        buildGradient(angle, [colors[0] || '#ff758c', '#667eea']);
                      }
                    };

                    const addColor = () => {
                      if (colors.length < 4) {
                        buildGradient(angle, [...colors, '#ffffff']);
                      }
                    };

                    const removeColor = (index: number) => {
                      if (colors.length > 2) {
                        const newColors = colors.filter((_: string, i: number) => i !== index);
                        buildGradient(angle, newColors);
                      }
                    };

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Tipo de fundo</Label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => { if (isGradient) toggleGradient(); }}
                              className={`px-3 py-1.5 text-xs rounded-l-md border transition-colors ${!isGradient ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}
                            >
                              Cor sólida
                            </button>
                            <button
                              type="button"
                              onClick={() => { if (!isGradient) toggleGradient(); }}
                              className={`px-3 py-1.5 text-xs rounded-r-md border border-l-0 transition-colors ${isGradient ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}
                            >
                              Gradiente
                            </button>
                          </div>
                        </div>

                        {/* Preview */}
                        <div
                          className="w-full h-16 rounded-lg border border-border shadow-inner"
                          style={{
                            background: isGradient
                              ? `linear-gradient(${angle}deg, ${colors.join(', ')})`
                              : colors[0]
                          }}
                        />

                        {/* Color pickers */}
                        <div className="space-y-3">
                          {colors.map((color: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-3">
                              <input
                                type="color"
                                value={color || '#ff758c'}
                                onChange={e => updateColor(idx, e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer border border-border"
                              />
                              <div className="flex-1">
                                <Label className="text-xs text-muted-foreground mb-1 block">
                                  {!isGradient ? 'Cor de fundo' : idx === 0 ? 'Cor inicial' : idx === colors.length - 1 ? 'Cor final' : `Cor ${idx + 1}`}
                                </Label>
                                <Input
                                  value={color}
                                  onChange={e => updateColor(idx, e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </div>
                              {isGradient && colors.length > 2 && (
                                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeColor(idx)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add color + angle */}
                        {isGradient && (
                          <div className="flex items-center justify-between">
                            {colors.length < 4 && (
                              <Button type="button" size="sm" variant="outline" onClick={addColor}>
                                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar cor
                              </Button>
                            )}
                            <div className="flex items-center gap-2">
                              <Label className="text-xs whitespace-nowrap">Ângulo</Label>
                              <Input
                                type="number"
                                min={0}
                                max={360}
                                value={angle}
                                onChange={e => buildGradient(parseInt(e.target.value) || 0, colors)}
                                className="w-20 h-8 text-sm"
                              />
                              <span className="text-xs text-muted-foreground">°</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cor da borda da logo</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={form.logo_border_color || '#ff7eb3'}
                          onChange={e => updateField('logo_border_color', e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input value={form.logo_border_color || ''} onChange={e => updateField('logo_border_color', e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cor da borda do card</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={form.card_border_color || '#ff7eb3'}
                          onChange={e => updateField('card_border_color', e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input value={form.card_border_color || ''} onChange={e => updateField('card_border_color', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Informações */}
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Info Cards</CardTitle>
                    <Button size="sm" variant="outline" onClick={addInfoCard}>
                      <Plus className="w-4 h-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(form.info_cards || []).map((card, idx) => (
                    <div key={idx} className="flex gap-2 items-start p-3 bg-muted/50 rounded-lg">
                      <Input
                        value={card.icon}
                        onChange={e => updateInfoCard(idx, 'icon', e.target.value)}
                        className="w-16 text-center"
                        placeholder="📌"
                      />
                      <div className="flex-1 space-y-2">
                        <Input
                          value={card.label}
                          onChange={e => updateInfoCard(idx, 'label', e.target.value)}
                          placeholder="LABEL"
                          className="text-xs"
                        />
                        <Input
                          value={card.value}
                          onChange={e => updateInfoCard(idx, 'value', e.target.value)}
                          placeholder="Valor"
                        />
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => removeInfoCard(idx)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {(form.info_cards || []).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum info card. Clique em "Adicionar" para criar.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Botões */}
            <TabsContent value="buttons">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Botões de Ação</CardTitle>
                    <Button size="sm" variant="outline" onClick={addButton}>
                      <Plus className="w-4 h-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(form.action_buttons || []).map((btn, idx) => (
                    <div key={idx} className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex gap-2 items-center">
                        <select
                          value={btn.type}
                          onChange={e => updateButton(idx, 'type', e.target.value)}
                          className="px-2 py-1.5 rounded border bg-background text-sm"
                        >
                          <option value="primary">Principal</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="secondary">Secundário</option>
                          <option value="embed">Embed HTML</option>
                        </select>
                        {btn.type !== 'embed' && (
                          <input
                            type="color"
                            value={btn.color || '#ff758c'}
                            onChange={e => updateButton(idx, 'color', e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer"
                          />
                        )}
                        <Button size="icon" variant="ghost" onClick={() => removeButton(idx)} className="ml-auto">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      {btn.type === 'embed' ? (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Cole o código HTML do widget (ex: GloriaFood, iFood, etc.)
                            </Label>
                            <textarea
                              value={btn.embed_html || ''}
                              onChange={e => updateButton(idx, 'embed_html', e.target.value)}
                              placeholder={'<!-- Cole aqui o código embed -->\n<span class="glf-button" data-glf-cuid="..." data-glf-ruid="...">Peça Agora!</span>\n<script src="https://..." defer async></script>'}
                              className="w-full min-h-[100px] px-3 py-2 rounded-md border bg-background text-sm font-mono resize-y"
                            />
                          </div>

                          {/* Texto do botão */}
                          <div>
                            <Label className="text-xs text-muted-foreground">Texto do botão (substitui o texto padrão do widget)</Label>
                            <Input
                              value={btn.embed_button_text || ''}
                              onChange={e => updateButton(idx, 'embed_button_text', e.target.value)}
                              placeholder="Ex: Peça Agora!, Ver Cardápio, Fazer Pedido..."
                            />
                          </div>

                          {/* Personalização visual do botão embed */}
                          <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                            <Label className="text-xs font-semibold">🎨 Personalizar aparência</Label>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Cor de fundo</Label>
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="color"
                                    value={btn.embed_bg_color || '#ff6b35'}
                                    onChange={e => updateButton(idx, 'embed_bg_color', e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer border"
                                  />
                                  <Input
                                    value={btn.embed_bg_color || ''}
                                    onChange={e => updateButton(idx, 'embed_bg_color', e.target.value)}
                                    placeholder="#ff6b35"
                                    className="flex-1 h-8 text-xs"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Cor do texto</Label>
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="color"
                                    value={btn.embed_text_color || '#ffffff'}
                                    onChange={e => updateButton(idx, 'embed_text_color', e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer border"
                                  />
                                  <Input
                                    value={btn.embed_text_color || ''}
                                    onChange={e => updateButton(idx, 'embed_text_color', e.target.value)}
                                    placeholder="#ffffff"
                                    className="flex-1 h-8 text-xs"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Tamanho fonte</Label>
                                <Input
                                  value={btn.embed_font_size || ''}
                                  onChange={e => updateButton(idx, 'embed_font_size', e.target.value)}
                                  placeholder="16px"
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Padding</Label>
                                <Input
                                  value={btn.embed_padding || ''}
                                  onChange={e => updateButton(idx, 'embed_padding', e.target.value)}
                                  placeholder="15px"
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Borda arredondada</Label>
                                <Input
                                  value={btn.embed_border_radius || ''}
                                  onChange={e => updateButton(idx, 'embed_border_radius', e.target.value)}
                                  placeholder="40px"
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : btn.type === 'whatsapp' ? (
                        <div className="space-y-3">
                          <Input
                            value={btn.label}
                            onChange={e => updateButton(idx, 'label', e.target.value)}
                            placeholder="💬 FAZER PEDIDO POR WHATSAPP"
                          />
                          <div>
                            <Label className="text-xs text-muted-foreground">Número do WhatsApp (com DDD)</Label>
                            <Input
                              value={btn.whatsapp_phone || ''}
                              onChange={e => {
                                const phone = e.target.value.replace(/\D/g, '');
                                const msg = btn.whatsapp_message || '';
                                const btns = [...(form.action_buttons || [])];
                                btns[idx] = {
                                  ...btns[idx],
                                  whatsapp_phone: phone,
                                  url: `https://api.whatsapp.com/send/?phone=55${phone}&text=${encodeURIComponent(msg)}&type=phone_number&app_absent=0`,
                                };
                                setForm(prev => ({ ...prev, action_buttons: btns }));
                              }}
                              placeholder="556199990000"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Mensagem automática</Label>
                            <Textarea
                              value={btn.whatsapp_message || ''}
                              onChange={e => {
                                const msg = e.target.value;
                                const phone = btn.whatsapp_phone || '';
                                const btns = [...(form.action_buttons || [])];
                                btns[idx] = {
                                  ...btns[idx],
                                  whatsapp_message: msg,
                                  url: `https://api.whatsapp.com/send/?phone=55${phone}&text=${encodeURIComponent(msg)}&type=phone_number&app_absent=0`,
                                };
                                setForm(prev => ({ ...prev, action_buttons: btns }));
                              }}
                              placeholder="Olá! Gostaria de fazer um pedido. Vi o cardápio online."
                              className="min-h-[60px]"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            📱 O link será gerado automaticamente: wa.me/55{btn.whatsapp_phone || '...'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <Input
                            value={btn.label}
                            onChange={e => updateButton(idx, 'label', e.target.value)}
                            placeholder="Texto do botão"
                          />
                          <Input
                            value={btn.url}
                            onChange={e => updateButton(idx, 'url', e.target.value)}
                            placeholder="https://..."
                          />
                        </>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Efeitos */}
            <TabsContent value="effects">
              <Card>
                <CardHeader><CardTitle>Efeitos Visuais</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={form.confetti_enabled ?? false}
                      onCheckedChange={v => updateField('confetti_enabled', v)}
                    />
                    <div>
                      <Label>Efeito de confete 🎉</Label>
                      <p className="text-xs text-muted-foreground">Exibe animação de confete ao abrir a página</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Switch
                      checked={form.particles_enabled ?? false}
                      onCheckedChange={v => updateField('particles_enabled', v)}
                    />
                    <div>
                      <Label>Partículas flutuantes ✨</Label>
                      <p className="text-xs text-muted-foreground">Pequenos brilhos flutuando suavemente pelo fundo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Switch
                      checked={form.bubbles_enabled ?? false}
                      onCheckedChange={v => updateField('bubbles_enabled', v)}
                    />
                    <div>
                      <Label>Bolhas animadas 🫧</Label>
                      <p className="text-xs text-muted-foreground">Bolhas coloridas subindo suavemente pelo fundo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Switch
                      checked={form.snow_enabled ?? false}
                      onCheckedChange={v => updateField('snow_enabled', v)}
                    />
                    <div>
                      <Label>Neve / Pétalas ❄️</Label>
                      <p className="text-xs text-muted-foreground">Flocos de neve ou pétalas caindo suavemente</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Switch
                      checked={form.animated_gradient_enabled ?? false}
                      onCheckedChange={v => updateField('animated_gradient_enabled', v)}
                    />
                    <div>
                      <Label>Gradiente animado 🌈</Label>
                      <p className="text-xs text-muted-foreground">O fundo gradiente se movimenta criando um efeito hipnótico</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: SEO */}
            <TabsContent value="seo">
              <Card>
                <CardHeader><CardTitle>Compartilhamento (OG Tags)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {/* Link para compartilhamento com OG tags */}
                  {form.slug && (
                    <div className="p-4 rounded-lg bg-accent/30 border border-accent space-y-2">
                      <Label className="text-sm font-semibold">🔗 Link para compartilhar nas redes sociais</Label>
                      <p className="text-xs text-muted-foreground">Use este link ao compartilhar no WhatsApp, Facebook, Instagram, etc. Ele garante que a imagem e descrição apareçam corretamente.</p>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={`https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/og-meta?slug=${form.slug}`}
                          className="text-xs bg-background"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(`https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/og-meta?slug=${form.slug}`);
                            toast.success('Link copiado!');
                          }}
                        >
                          Copiar
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Título (og:title)</Label>
                    <Input value={form.og_title || ''} onChange={e => updateField('og_title', e.target.value)} placeholder="Faça seu pedido agora!" />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição (og:description)</Label>
                    <Textarea value={form.og_description || ''} onChange={e => updateField('og_description', e.target.value)} placeholder="Saiba mais sobre..." rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Imagem (og:image)</Label>
                    <input
                      ref={ogImageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleOgImageUpload(file);
                        e.target.value = '';
                      }}
                    />
                    {form.og_image ? (
                      <div className="flex items-center gap-2">
                        <img src={form.og_image} alt="OG Image" className="h-20 w-auto rounded border border-border object-cover" />
                        <div className="flex flex-col gap-1">
                          <Button size="sm" variant="outline" onClick={() => ogImageInputRef.current?.click()} disabled={uploadingOgImage}>
                            {uploadingOgImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => updateField('og_image', '')}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => ogImageInputRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleOgImageUpload(file);
                        }}
                      >
                        {uploadingOgImage ? (
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Clique ou arraste para enviar a imagem</p>
                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WebP • Máximo 1MB</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Phone Mockup (lado direito - visível apenas em telas grandes) */}
        <div className="hidden lg:block sticky top-6 flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center mb-3">Preview em tempo real</p>
          <div
            className="relative mx-auto"
            style={{ width: 320, height: 640 }}
          >
            {/* Phone frame */}
            <div
              className="absolute inset-0 rounded-[40px] bg-[#1a1a1a] shadow-2xl"
              style={{ padding: '12px 10px' }}
            >
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-[#1a1a1a] rounded-b-2xl z-20" />
              {/* Screen */}
              <div className="w-full h-full rounded-[30px] overflow-hidden bg-white relative">
                <div className="w-full h-full overflow-y-auto" style={{ transform: 'scale(0.55)', transformOrigin: 'top left', width: '182%', height: '182%' }}>
                  <LegacyPageRenderer page={form as LegacyPageData} isPreview />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
