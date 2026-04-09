import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
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
import { Save, Plus, Trash2, Eye, Loader2, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  og_title: '',
  og_description: '',
  og_image: '',
  footer_text: '',
};

export default function LegacyPageEditor() {
  const { profile } = useAuth();
  const { validatedStoreId } = useStoreAccess(profile);
  const { data: existingPage, isLoading } = useLegacyPageByStore(validatedStoreId);
  const saveMutation = useSaveLegacyPage();
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState<Partial<LegacyPageData>>(DEFAULT_PAGE);

  // Carregar dados existentes
  useEffect(() => {
    if (existingPage) {
      setForm(existingPage);
    }
  }, [existingPage]);

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
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

  // Preview mode
  if (showPreview) {
    return (
      <div className="relative">
        <Button
          onClick={() => setShowPreview(false)}
          className="fixed top-4 right-4 z-50"
          variant="secondary"
        >
          ← Voltar ao Editor
        </Button>
        <LegacyPageRenderer page={form as LegacyPageData} isPreview />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Página Legacy</h1>
          <p className="text-sm text-muted-foreground">Personalize sua página de landing pública</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-2" /> Preview
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </div>

      {/* Link público */}
      {publicUrl && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4 flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Link público:</span>
            <code className="text-sm bg-background px-2 py-1 rounded flex-1 truncate">{publicUrl}</code>
            <Button size="sm" variant="ghost" onClick={copyUrl}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => window.open(publicUrl, '_blank')}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Abas de configuração */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="buttons">Botões</TabsTrigger>
          <TabsTrigger value="effects">Efeitos</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* Tab: Conteúdo */}
        <TabsContent value="content">
          <Card>
            <CardHeader><CardTitle>Conteúdo da Página</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slug (URL)</Label>
                  <Input
                    value={form.slug || ''}
                    onChange={e => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="minha-loja"
                  />
                  <p className="text-xs text-muted-foreground">Será acessível em /p/{form.slug || 'minha-loja'}</p>
                </div>
                <div className="space-y-2 flex items-center gap-4 pt-6">
                  <Switch
                    checked={form.is_active ?? true}
                    onCheckedChange={v => updateField('is_active', v)}
                  />
                  <Label>Página ativa</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nome da loja</Label>
                <Input value={form.store_name || ''} onChange={e => updateField('store_name', e.target.value)} placeholder="Casa de Kit Festas" />
              </div>
              <div className="space-y-2">
                <Label>Subtítulo</Label>
                <Input value={form.subtitle || ''} onChange={e => updateField('subtitle', e.target.value)} placeholder="Sua festa perfeita! 🎈" />
              </div>
              <div className="space-y-2">
                <Label>URL da Logo</Label>
                <Input value={form.logo_url || ''} onChange={e => updateField('logo_url', e.target.value)} placeholder="https://..." />
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
              <div className="space-y-2">
                <Label>Gradiente de fundo</Label>
                <Input
                  value={form.background_gradient || ''}
                  onChange={e => updateField('background_gradient', e.target.value)}
                  placeholder="135deg, #ff758c, #ff7eb3, #667eea"
                />
                <p className="text-xs text-muted-foreground">Formato: ângulo, cor1, cor2, cor3</p>
              </div>
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
                    </select>
                    <input
                      type="color"
                      value={btn.color || '#ff758c'}
                      onChange={e => updateButton(idx, 'color', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <Button size="icon" variant="ghost" onClick={() => removeButton(idx)} className="ml-auto">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    value={btn.label}
                    onChange={e => updateButton(idx, 'label', e.target.value)}
                    placeholder="Texto do botão"
                  />
                  <Input
                    value={btn.url}
                    onChange={e => updateButton(idx, 'url', e.target.value)}
                    placeholder="https://... ou https://wa.me/55..."
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Efeitos */}
        <TabsContent value="effects">
          <Card>
            <CardHeader><CardTitle>Efeitos Visuais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: SEO */}
        <TabsContent value="seo">
          <Card>
            <CardHeader><CardTitle>Compartilhamento (OG Tags)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
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
                <Input value={form.og_image || ''} onChange={e => updateField('og_image', e.target.value)} placeholder="https://..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
