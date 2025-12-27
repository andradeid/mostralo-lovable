import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Save, ExternalLink, Copy, Smartphone, Palette, Home, Users, Package, CreditCard, Settings } from 'lucide-react';
import { useTotemConfig, TotemConfig } from '@/hooks/useTotemConfig';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TotemAppearancePanel } from '@/components/totem-config/TotemAppearancePanel';
import { TotemWelcomePanel } from '@/components/totem-config/TotemWelcomePanel';
import { TotemIdentificationPanel } from '@/components/totem-config/TotemIdentificationPanel';
import { TotemProductsPanel } from '@/components/totem-config/TotemProductsPanel';
import { TotemPaymentPanel } from '@/components/totem-config/TotemPaymentPanel';
import { TotemBehaviorPanel } from '@/components/totem-config/TotemBehaviorPanel';
import { TotemPreview } from '@/components/totem-config/TotemPreview';

export default function TotemConfigPage() {
  const { storeId } = useStoreAccess();
  const { config, loading, updateConfig, uploadWelcomeImage, initializeConfig } = useTotemConfig(storeId);
  const { toast } = useToast();

const [localConfig, setLocalConfig] = useState<Partial<TotemConfig>>({});
  const [saving, setSaving] = useState(false);
  const [storeInfo, setStoreInfo] = useState<{ slug: string; name: string; logo_url: string | null } | null>(null);
  const [storeColors, setStoreColors] = useState<{ primary_color: string | null; secondary_color: string | null }>({ primary_color: null, secondary_color: null });

  // Buscar info da loja e cores de personalização
  useEffect(() => {
    const fetchStoreInfo = async () => {
      if (!storeId) return;
      
      // Buscar info básica da loja
      const { data: storeData } = await supabase
        .from('stores')
        .select('slug, name, logo_url')
        .eq('id', storeId)
        .single();
      if (storeData) setStoreInfo(storeData);

      // Buscar cores de personalização da loja
      const { data: configData } = await supabase
        .from('store_configurations')
        .select('primary_color, secondary_color')
        .eq('store_id', storeId)
        .maybeSingle();
      if (configData) {
        setStoreColors({
          primary_color: configData.primary_color,
          secondary_color: configData.secondary_color
        });
      }
    };
    fetchStoreInfo();
  }, [storeId]);

  // Sincronizar config remota com local
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const handleChange = (updates: Partial<TotemConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig(localConfig);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    if (!config) {
      // Inicializar config se não existir
      await initializeConfig();
    }
    handleChange({ is_enabled: enabled });
    await updateConfig({ is_enabled: enabled });
  };

  const copyTotemUrl = () => {
    if (storeInfo?.slug) {
      const url = `${window.location.origin}/totem/${storeInfo.slug}`;
      navigator.clipboard.writeText(url);
      toast({
        title: 'Link copiado!',
        description: 'O link do totem foi copiado para a área de transferência.',
      });
    }
  };

  const openTotem = () => {
    if (storeInfo?.slug) {
      window.open(`/totem/${storeInfo.slug}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totemUrl = storeInfo?.slug ? `${window.location.origin}/totem/${storeInfo.slug}` : '';

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-primary" />
            Totem de Autoatendimento
          </h1>
          <p className="text-muted-foreground">
            Configure a aparência e comportamento do seu totem
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="totem-enabled">Totem Ativo</Label>
            <Switch
              id="totem-enabled"
              checked={localConfig.is_enabled ?? true}
              onCheckedChange={handleToggleEnabled}
            />
          </div>
        </div>
      </div>

      {/* URL do Totem */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground">Link do Totem</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-muted rounded text-sm truncate">
                  {totemUrl || 'Carregando...'}
                </code>
                <Button variant="outline" size="icon" onClick={copyTotemUrl} disabled={!storeInfo?.slug}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={openTotem} disabled={!storeInfo?.slug}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painéis de Configuração */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={['appearance']} className="w-full">
                <AccordionItem value="appearance">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Aparência
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <TotemAppearancePanel 
                      config={localConfig} 
                      onChange={handleChange}
                      storePrimaryColor={storeColors.primary_color}
                      storeSecondaryColor={storeColors.secondary_color}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="welcome">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Tela Inicial
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <TotemWelcomePanel
                      config={localConfig}
                      onChange={handleChange}
                      onUploadImage={uploadWelcomeImage}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="identification">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Identificação do Cliente
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <TotemIdentificationPanel config={localConfig} onChange={handleChange} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="products">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Produtos e Carrinho
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <TotemProductsPanel config={localConfig} onChange={handleChange} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="payment">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Pagamento
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <TotemPaymentPanel config={localConfig} onChange={handleChange} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="behavior">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Comportamento
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <TotemBehaviorPanel config={localConfig} onChange={handleChange} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="mt-6 flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <TotemPreview
                config={localConfig}
                storeLogo={storeInfo?.logo_url || undefined}
                storeName={storeInfo?.name}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
