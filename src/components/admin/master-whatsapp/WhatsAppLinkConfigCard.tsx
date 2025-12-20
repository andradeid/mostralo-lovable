import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Link2, 
  Save, 
  Loader2, 
  MessageCircle, 
  Dumbbell, 
  BookOpen,
  ShoppingCart, 
  Pill, 
  Beef, 
  Store, 
  ShoppingBag,
  Leaf,
  ExternalLink
} from "lucide-react";

interface WhatsAppMessages {
  default: string;
  suplementos_landing?: string;
  suplementos_guia?: string;
  supermercados?: string;
  farmacias?: string;
  acougues?: string;
  feirantes?: string;
  lojistas?: string;
  biomundo?: string;
  [key: string]: string | undefined;
}

interface NichoConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const NICHOS: NichoConfig[] = [
  { key: 'default', label: 'Padrão', icon: <MessageCircle className="h-4 w-4" />, description: 'Mensagem usada quando não há específica' },
  { key: 'suplementos_landing', label: 'Suplementos - Landing', icon: <Dumbbell className="h-4 w-4" />, description: 'Página de conversão de suplementos' },
  { key: 'suplementos_guia', label: 'Suplementos - Guia', icon: <BookOpen className="h-4 w-4" />, description: 'Guia informativo de suplementos' },
  { key: 'supermercados', label: 'Supermercados', icon: <ShoppingCart className="h-4 w-4" />, description: 'Página para supermercados' },
  { key: 'farmacias', label: 'Farmácias', icon: <Pill className="h-4 w-4" />, description: 'Página para farmácias' },
  { key: 'acougues', label: 'Açougues', icon: <Beef className="h-4 w-4" />, description: 'Página para açougues' },
  { key: 'feirantes', label: 'Feirantes', icon: <Store className="h-4 w-4" />, description: 'Página para lojistas de feira' },
  { key: 'lojistas', label: 'Lojistas Locais', icon: <ShoppingBag className="h-4 w-4" />, description: 'Página para lojistas locais' },
  { key: 'biomundo', label: 'Bio Mundo', icon: <Leaf className="h-4 w-4" />, description: 'Proposta comercial Bio Mundo' },
];

const DEFAULT_MESSAGES: WhatsAppMessages = {
  default: 'Olá! Gostaria de saber mais sobre o Mostralo',
  suplementos_landing: 'Olá! Quero uma simulação de economia para minha loja de suplementos',
  suplementos_guia: 'Olá! Vi o guia completo e quero saber mais sobre o Mostralo para suplementos',
  supermercados: 'Olá! Tenho um supermercado e quero saber mais sobre o Mostralo',
  farmacias: 'Olá! Tenho uma farmácia e gostaria de conhecer o Mostralo',
  acougues: 'Olá! Tenho um açougue e quero saber mais sobre o Mostralo',
  feirantes: 'Oi! Sou lojista de feira e quero saber mais sobre o Mostralo',
  lojistas: 'Olá! Tenho uma loja física e quero criar minha loja online com o Mostralo',
  biomundo: 'Olá! Sou da Bio Mundo e gostaria de agendar uma apresentação do Mostralo'
};

interface Props {
  configId: string | null;
  instancePhone: string | null;
}

export function WhatsAppLinkConfigCard({ configId, instancePhone }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fallbackCountryCode, setFallbackCountryCode] = useState("+55");
  const [fallbackPhone, setFallbackPhone] = useState("");
  const [messages, setMessages] = useState<WhatsAppMessages>(DEFAULT_MESSAGES);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!configId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('master_whatsapp_config')
          .select('fallback_phone, whatsapp_messages')
          .eq('id', configId)
          .single();

        if (error) throw error;

        if (data?.fallback_phone) {
          // Extrair código do país do número
          if (data.fallback_phone.startsWith('55')) {
            setFallbackCountryCode('+55');
            setFallbackPhone(data.fallback_phone.slice(2));
          } else {
            setFallbackPhone(data.fallback_phone);
          }
        }

        if (data?.whatsapp_messages) {
          setMessages({ ...DEFAULT_MESSAGES, ...(data.whatsapp_messages as WhatsAppMessages) });
        }
      } catch (error) {
        console.error('Erro ao carregar config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [configId]);

  const handleSave = async () => {
    if (!configId) {
      toast.error('Configuração não encontrada');
      return;
    }

    setSaving(true);
    try {
      const fullFallbackPhone = fallbackPhone 
        ? fallbackCountryCode.replace('+', '') + fallbackPhone.replace(/\D/g, '')
        : null;

      const { error } = await supabase
        .from('master_whatsapp_config')
        .update({
          fallback_phone: fullFallbackPhone,
          whatsapp_messages: messages
        })
        .eq('id', configId);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const updateMessage = (key: string, value: string) => {
    setMessages(prev => ({ ...prev, [key]: value }));
  };

  const getEffectivePhone = () => {
    if (instancePhone) return instancePhone;
    if (fallbackPhone) return fallbackCountryCode.replace('+', '') + fallbackPhone.replace(/\D/g, '');
    return '5511941941427';
  };

  const getPreviewLink = (nichoKey: string) => {
    const phone = getEffectivePhone();
    const message = messages[nichoKey] || messages.default;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message || '')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Links WhatsApp por Página
        </CardTitle>
        <CardDescription>
          Configure o número de fallback e mensagens personalizadas para cada página de nicho
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status do Número */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Número Ativo:</span>
            {instancePhone ? (
              <Badge className="bg-green-500">Instância: {instancePhone}</Badge>
            ) : fallbackPhone ? (
              <Badge variant="secondary">Fallback: {fallbackCountryCode}{fallbackPhone}</Badge>
            ) : (
              <Badge variant="outline">Padrão: 5511941941427</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Prioridade: Instância conectada → Fallback → Número padrão
          </p>
        </div>

        {/* Número de Fallback */}
        <div className="space-y-2">
          <Label>Número de Fallback (quando instância desconectada)</Label>
          <div className="flex gap-2">
            <CountryCodeSelect 
              value={fallbackCountryCode} 
              onChange={setFallbackCountryCode}
            />
            <Input
              placeholder="11941941427"
              value={fallbackPhone}
              onChange={(e) => setFallbackPhone(e.target.value.replace(/\D/g, ''))}
              className="flex-1"
            />
          </div>
        </div>

        <Separator />

        {/* Mensagens por Nicho */}
        <div className="space-y-4">
          <Label className="text-base">Mensagens por Página</Label>
          
          {NICHOS.map((nicho) => (
            <div key={nicho.key} className="space-y-2 p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {nicho.icon}
                  <span className="font-medium">{nicho.label}</span>
                </div>
                <a 
                  href={getPreviewLink(nicho.key)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Testar <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground">{nicho.description}</p>
              <Textarea
                placeholder={DEFAULT_MESSAGES[nicho.key] || DEFAULT_MESSAGES.default}
                value={messages[nicho.key] || ''}
                onChange={(e) => updateMessage(nicho.key, e.target.value)}
                className="min-h-[60px] text-sm"
              />
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
