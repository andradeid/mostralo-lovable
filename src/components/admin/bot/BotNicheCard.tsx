import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import { Brain, Check, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNiches } from '@/hooks/useNiches';
import { useToast } from '@/hooks/use-toast';

// Renderiza ícone Lucide dinamicamente pelo nome
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (LucideIcons as any)[name];
  if (!IconComponent) return <span className={className}>{name}</span>;
  return <IconComponent className={className} />;
}

interface BotNicheCardProps {
  storeId: string;
  disabled?: boolean;
}

export function BotNicheCard({ storeId, disabled }: BotNicheCardProps) {
  const { data: niches, isLoading: nichesLoading } = useNiches();
  const { toast } = useToast();
  const [currentNicheId, setCurrentNicheId] = useState<string | null>(null);
  const [nicheConfig, setNicheConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Buscar niche_id atual da loja
  useEffect(() => {
    if (!storeId) return;
    
    const fetchStoreNiche = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('stores')
        .select('niche_id')
        .eq('id', storeId)
        .single();
      
      setCurrentNicheId(data?.niche_id || null);
      setLoading(false);
    };
    
    fetchStoreNiche();
  }, [storeId]);

  // Buscar config do nicho selecionado
  useEffect(() => {
    if (!currentNicheId) {
      setNicheConfig(null);
      return;
    }
    
    const fetchNicheConfig = async () => {
      const { data } = await supabase
        .from('niche_ai_configs')
        .select('*, niche_ai_rules(id, rule_name, is_active)')
        .eq('niche_id', currentNicheId)
        .maybeSingle();
      
      setNicheConfig(data);
    };
    
    fetchNicheConfig();
  }, [currentNicheId]);

  const handleNicheChange = async (value: string) => {
    const nicheId = value === 'none' ? null : value;
    setSaving(true);
    
    const { error } = await supabase
      .from('stores')
      .update({ niche_id: nicheId })
      .eq('id', storeId);
    
    setSaving(false);
    
    if (error) {
      toast({
        title: 'Erro ao vincular nicho',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    
    setCurrentNicheId(nicheId);
    toast({
      title: nicheId ? 'Nicho vinculado!' : 'Nicho removido',
      description: nicheId 
        ? 'Sincronize o bot para aplicar as configurações do nicho.'
        : 'A loja não está mais vinculada a nenhum nicho de IA.',
    });
  };

  const selectedNiche = niches?.find(n => n.id === currentNicheId);
  const activeRules = nicheConfig?.niche_ai_rules?.filter((r: any) => r.is_active) || [];
  const enabledTools = nicheConfig?.enabled_tools || [];

  return (
    <Card className={disabled ? 'opacity-60 pointer-events-none' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Nicho de IA</CardTitle>
          </div>
          {currentNicheId && nicheConfig && (
            <Badge variant="secondary" className="text-xs">
              <Check className="h-3 w-3 mr-1" />
              Configurado
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Vincule esta loja a um template de nicho para configurar automaticamente o comportamento da IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select 
          value={currentNicheId || 'none'} 
          onValueChange={handleNicheChange}
          disabled={loading || nichesLoading || saving}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um nicho..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum (usar configurações manuais)</SelectItem>
            {niches?.map(niche => (
              <SelectItem key={niche.id} value={niche.id}>
                {niche.icon && <span className="mr-2">{niche.icon}</span>}
                {niche.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Resumo do nicho selecionado */}
        {currentNicheId && nicheConfig && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4 text-muted-foreground" />
              Configurações do nicho "{selectedNiche?.name}"
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">{enabledTools.length}</span> ferramenta{enabledTools.length !== 1 ? 's' : ''} ativa{enabledTools.length !== 1 ? 's' : ''}
              </div>
              <div>
                <span className="font-medium text-foreground">{activeRules.length}</span> regra{activeRules.length !== 1 ? 's' : ''} inteligente{activeRules.length !== 1 ? 's' : ''}
              </div>
              <div>
                Vision: <span className="font-medium text-foreground">{nicheConfig.vision_enabled ? 'Sim' : 'Não'}</span>
              </div>
              <div>
                Máx produtos: <span className="font-medium text-foreground">{nicheConfig.max_products_per_response || 3}</span>
              </div>
            </div>
          </div>
        )}

        {currentNicheId && !nicheConfig && !loading && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Este nicho não possui configuração de IA. Configure em Nichos de IA no painel master.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
