import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw, 
  Copy, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Star, 
  Users,
  Phone,
  Building2,
  TrendingUp,
  TrendingDown,
  Store
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { generateMarcosFollowUp } from "@/lib/callScriptGenerator";
import { generateDeliveryMarcosFollowUp } from "@/lib/callScriptGeneratorDelivery";
import type { DiagnosticAnswers, QualificationLevel } from "@/lib/diagnosticScoring";
import { ANSWER_LABELS, MARCOS_WHATSAPP } from "@/lib/diagnosticScoring";
import { NICHE_CONFIG, type BusinessNiche, type DeliveryDiagnosticAnswers } from "@/lib/diagnosticScoringDelivery";

interface Lead {
  id: string;
  name: string;
  company_name: string;
  company_phone: string;
  email: string | null;
  source: string;
  status: string;
  qualification_score: number | null;
  qualification_level: string | null;
  diagnostic_answers: Record<string, string> | null;
  created_at: string;
  contacted_at: string | null;
  business_type?: string;
  notes?: string | null;
}

export default function FollowUpQueuePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Buscar leads qualificados aguardando follow-up (ambos diagnósticos)
  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ['follow-up-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .in('source', ['diagnostico', 'diagnostico-delivery'])
        .eq('status', 'new')
        .in('qualification_level', ['elite', 'potential'])
        .order('qualification_level', { ascending: true }) // Elite primeiro
        .order('created_at', { ascending: true }); // Mais antigos primeiro

      if (error) throw error;
      return (data || []) as unknown as Lead[];
    }
  });

  // Mutation para marcar como contatado
  const markAsContacted = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('leads')
        .update({ 
          status: 'contacted',
          contacted_at: new Date().toISOString()
        })
        .eq('id', leadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-queue'] });
      toast({
        title: "Lead marcado como contatado",
        description: "O lead foi movido para a lista de contatados."
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível marcar o lead como contatado.",
        variant: "destructive"
      });
    }
  });

  // Extrair economia das notas do lead
  const extractSavings = (notes: string | null): { monthly: number; annual: number } | null => {
    if (!notes) return null;
    
    const monthlyMatch = notes.match(/R\$ ([\d.,]+)\/mês/);
    const annualMatch = notes.match(/R\$ ([\d.,]+)\/ano/);
    
    if (monthlyMatch && annualMatch) {
      return {
        monthly: parseFloat(monthlyMatch[1].replace('.', '').replace(',', '.')),
        annual: parseFloat(annualMatch[1].replace('.', '').replace(',', '.'))
      };
    }
    return null;
  };

  // Gerar mensagem baseada no tipo de diagnóstico
  const generateMessage = (lead: Lead): string => {
    if (lead.source === 'diagnostico-delivery') {
      const savings = extractSavings(lead.notes || null);
      const deliveryAnswers = lead.diagnostic_answers as unknown as DeliveryDiagnosticAnswers | null;
      
      return generateDeliveryMarcosFollowUp({
        leadName: lead.name,
        companyName: lead.company_name,
        nicho: (lead.business_type as BusinessNiche) || 'restaurante',
        answers: deliveryAnswers || { nicho: 'restaurante', dependencia: 'b', volume: 'b', desafio: 'a' },
        score: lead.qualification_score || 0,
        level: (lead.qualification_level as QualificationLevel) || 'potential',
        monthlySavings: savings?.monthly || 0,
        annualSavings: savings?.annual || 0,
        currentCommission: 0.25
      });
    }
    
    // Diagnóstico original
    const answers = lead.diagnostic_answers as unknown as DiagnosticAnswers | null;
    return generateMarcosFollowUp({
      leadName: lead.name,
      companyName: lead.company_name,
      answers: answers || { q1: 'a', q2: 'a', q3: 'a', q4: 'a' },
      score: lead.qualification_score || 0,
      level: (lead.qualification_level as QualificationLevel) || 'potential'
    });
  };

  // Gerar mensagem personalizada e copiar
  const handleCopyMessage = async (lead: Lead) => {
    const message = generateMessage(lead);

    await navigator.clipboard.writeText(message);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 2000);
    
    toast({
      title: "Mensagem copiada!",
      description: "Cole no WhatsApp para enviar."
    });
  };

  // Abrir WhatsApp com mensagem
  const handleOpenWhatsApp = (lead: Lead) => {
    const message = generateMessage(lead);

    // Formatar telefone (remover caracteres não numéricos)
    const phone = lead.company_phone.replace(/\D/g, '');
    const phoneWithCountry = phone.startsWith('55') ? phone : `55${phone}`;
    
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Identificar dores do lead baseado nas respostas
  const getLeadPains = (lead: Lead): string[] => {
    const answersRaw = lead.diagnostic_answers;
    if (!answersRaw) return [];
    
    // Diagnóstico de delivery
    if (lead.source === 'diagnostico-delivery') {
      const answers = answersRaw as unknown as DeliveryDiagnosticAnswers;
      const pains: string[] = [];
      
      if (answers.dependencia === 'a') {
        pains.push('Alta dependência de apps (>70%)');
      }
      if (answers.desafio === 'a') {
        pains.push('Quer reduzir comissões');
      }
      if (answers.desafio === 'b') {
        pains.push('Sem acesso a dados de clientes');
      }
      if (answers.desafio === 'c') {
        pains.push('Quer canal próprio de vendas');
      }
      
      return pains;
    }
    
    // Diagnóstico original
    const answers = answersRaw as unknown as DiagnosticAnswers;
    const pains: string[] = [];

    if (answers.q1 === 'b' || answers.q1 === 'c') {
      pains.push('Invisível no Google Shopping');
    }
    if (answers.q2 === 'a' || answers.q2 === 'b') {
      pains.push('Demora no atendimento WhatsApp');
    }
    if (answers.q3 === 'a' || answers.q3 === 'b') {
      pains.push('Não faz upsell/cross-sell');
    }
    if (answers.q4 === 'a' || answers.q4 === 'b') {
      pains.push('Sem automação de marketing');
    }

    return pains;
  };

  // Estatísticas
  const eliteCount = leads?.filter(l => l.qualification_level === 'elite').length || 0;
  const potentialCount = leads?.filter(l => l.qualification_level === 'potential').length || 0;
  const totalCount = leads?.length || 0;

  // Calcular tempo médio de espera
  const avgWaitTime = leads?.length 
    ? leads.reduce((acc, lead) => {
        const created = new Date(lead.created_at);
        const now = new Date();
        return acc + (now.getTime() - created.getTime());
      }, 0) / leads.length / (1000 * 60 * 60) // em horas
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fila de Follow-up</h1>
          <p className="text-muted-foreground">
            Leads qualificados aguardando seu contato
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-xs text-muted-foreground">Total Aguardando</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{eliteCount}</p>
                <p className="text-xs text-muted-foreground">Elite</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{potentialCount}</p>
                <p className="text-xs text-muted-foreground">Potencial</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{avgWaitTime.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">Tempo Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Leads */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : leads?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold">Fila zerada!</h3>
            <p className="text-muted-foreground">
              Todos os leads qualificados já foram contatados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {leads?.map((lead) => (
            <Card key={lead.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={lead.qualification_level === 'elite' ? 'default' : 'secondary'}
                      className={lead.qualification_level === 'elite' 
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-black' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }
                    >
                      {lead.qualification_level === 'elite' ? (
                        <>
                          <Star className="h-3 w-3 mr-1" />
                          ELITE
                        </>
                      ) : (
                        'POTENCIAL'
                      )}
                    </Badge>
                    <CardTitle className="text-lg">{lead.name}</CardTitle>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {formatDistanceToNow(new Date(lead.created_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Informações do Lead */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.company_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.company_phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>Score: {lead.qualification_score}/12</span>
                  </div>
                </div>

                {/* Badge de nicho para delivery */}
                {lead.source === 'diagnostico-delivery' && lead.business_type && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/20">
                      <Store className="h-3 w-3 mr-1" />
                      {NICHE_CONFIG[lead.business_type as BusinessNiche]?.label || lead.business_type}
                    </Badge>
                    {extractSavings(lead.notes || null) && (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Economia: R$ {extractSavings(lead.notes || null)?.monthly.toLocaleString('pt-BR')}/mês
                      </Badge>
                    )}
                  </div>
                )}

                {/* Dores Identificadas */}
                {lead.diagnostic_answers && (
                  <div>
                    <p className="text-sm font-medium mb-2">Dores identificadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {getLeadPains(lead).map((pain, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {pain}
                        </Badge>
                      ))}
                      {getLeadPains(lead).length === 0 && (
                        <span className="text-sm text-muted-foreground">
                          Lead bem estruturado - focar em escala
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Ações */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyMessage(lead)}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copiedId === lead.id ? 'Copiado!' : 'Copiar Mensagem'}
                  </Button>
                  
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleOpenWhatsApp(lead)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Abrir WhatsApp
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => markAsContacted.mutate(lead.id)}
                    disabled={markAsContacted.isPending}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar Contatado
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
