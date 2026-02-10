import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PlatformConfig {
  id: string;
  google_ads_id: string | null;
  google_ads_conversion_label: string | null;
  facebook_pixel_id: string | null;
  google_analytics_id: string | null;
}

export function PlatformTrackingConfig() {
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    google_ads_id: "",
    google_ads_conversion_label: "",
    facebook_pixel_id: "",
    google_analytics_id: "",
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_marketing_config")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setConfig(data);
        setForm({
          google_ads_id: data.google_ads_id || "",
          google_ads_conversion_label: data.google_ads_conversion_label || "",
          facebook_pixel_id: data.facebook_pixel_id || "",
          google_analytics_id: data.google_analytics_id || "",
        });
      }
    } catch (err) {
      console.error("Erro ao buscar config:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        google_ads_id: form.google_ads_id || null,
        google_ads_conversion_label: form.google_ads_conversion_label || null,
        facebook_pixel_id: form.facebook_pixel_id || null,
        google_analytics_id: form.google_analytics_id || null,
      };

      if (config?.id) {
        const { error } = await supabase
          .from("platform_marketing_config")
          .update(payload)
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("platform_marketing_config")
          .insert(payload);
        if (error) throw error;
      }

      toast({
        title: "Configurações salvas!",
        description: "Os IDs de tracking da plataforma foram atualizados.",
      });
      fetchConfig();
    } catch (err) {
      console.error("Erro ao salvar:", err);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Estes IDs são usados nas <strong>landing pages da plataforma</strong> (como /especial, página inicial, etc.).
          Para configurar tracking de uma loja específica, acesse as configurações da loja.
        </AlertDescription>
      </Alert>

      {/* Google Ads */}
      <Card>
        <CardHeader>
          <CardTitle>Google Ads</CardTitle>
          <CardDescription>
            Configure o ID de conversão do Google Ads para rastrear cadastros e compras vindos dos anúncios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google_ads_id">Google Ads Conversion ID</Label>
            <Input
              id="google_ads_id"
              placeholder="AW-XXXXXXXXXX"
              value={form.google_ads_id}
              onChange={(e) => setForm({ ...form, google_ads_id: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Encontre em: Google Ads → Ferramentas → Conversões → Tag do Google
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="google_ads_label">Conversion Label</Label>
            <Input
              id="google_ads_label"
              placeholder="AbCdEfGhIjKlMn"
              value={form.google_ads_conversion_label}
              onChange={(e) => setForm({ ...form, google_ads_conversion_label: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Label da ação de conversão específica que deseja rastrear.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Facebook Pixel */}
      <Card>
        <CardHeader>
          <CardTitle>Facebook Pixel</CardTitle>
          <CardDescription>
            Configure o Pixel do Facebook/Meta para rastrear conversões de anúncios do Facebook e Instagram.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
            <Input
              id="facebook_pixel_id"
              placeholder="XXXXXXXXXXXXXXXX"
              value={form.facebook_pixel_id}
              onChange={(e) => setForm({ ...form, facebook_pixel_id: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Encontre em: Meta Business Suite → Eventos → Pixel → Configurações
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Google Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Google Analytics</CardTitle>
          <CardDescription>
            Configure o Google Analytics para acompanhar métricas de acesso das landing pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google_analytics_id">Google Analytics ID (GA4)</Label>
            <Input
              id="google_analytics_id"
              placeholder="G-XXXXXXXXXX"
              value={form.google_analytics_id}
              onChange={(e) => setForm({ ...form, google_analytics_id: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Encontre em: Google Analytics → Admin → Fluxos de dados → ID de medição
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Salvar Configurações
      </Button>
    </div>
  );
}
