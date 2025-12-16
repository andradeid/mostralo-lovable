import { useState, useEffect } from 'react';
import { AlertTriangle, X, Eye, Phone, Building2, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StaleLead {
  id: string;
  name: string;
  company_name: string;
  phone: string;
  city: string;
  status: string;
  updated_at: string;
  daysStale: number;
}

interface LeadRemindersAlertProps {
  onLeadClick?: (leadId: string) => void;
  salespersonId?: string;
}

export function LeadRemindersAlert({ onLeadClick, salespersonId }: LeadRemindersAlertProps) {
  const [staleLeads, setStaleLeads] = useState<StaleLead[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStaleLeads();
  }, [salespersonId]);

  const fetchStaleLeads = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('leads')
        .select('id, name, company_name, phone, city, status, updated_at')
        .in('status', ['new', 'contacted', 'qualified'])
        .order('updated_at', { ascending: true });

      if (salespersonId) {
        query = query.eq('salesperson_id', salespersonId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const now = new Date();
      const stale = (data || [])
        .map(lead => ({
          ...lead,
          daysStale: differenceInDays(now, new Date(lead.updated_at))
        }))
        .filter(lead => lead.daysStale >= 3)
        .sort((a, b) => b.daysStale - a.daysStale);

      setStaleLeads(stale);
    } catch (error) {
      console.error('Erro ao buscar leads parados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || staleLeads.length === 0 || isDismissed) {
    return null;
  }

  const urgentCount = staleLeads.filter(l => l.daysStale >= 7).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'contacted': return 'bg-yellow-500';
      case 'qualified': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Novo';
      case 'contacted': return 'Contactado';
      case 'qualified': return 'Qualificado';
      default: return status;
    }
  };

  const getStaleBadge = (daysStale: number) => {
    if (daysStale >= 7) {
      return <Badge className="bg-red-500 text-white animate-pulse text-[10px] md:text-xs h-5">URGENTE! ({daysStale}d)</Badge>;
    }
    if (daysStale >= 5) {
      return <Badge className="bg-orange-500 text-white text-[10px] md:text-xs h-5">Alerta ({daysStale}d)</Badge>;
    }
    return <Badge className="bg-yellow-500 text-black text-[10px] md:text-xs h-5">Atenção ({daysStale}d)</Badge>;
  };

  return (
    <Card className="mb-4 md:mb-6 border-amber-500/50 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-red-500/10">
      <CardContent className="p-3 md:p-4">
        {/* Header Responsivo */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-full bg-amber-500/20 shrink-0">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm md:text-lg flex flex-wrap items-center gap-1 md:gap-2">
                <span>⚠️ {staleLeads.length} lead{staleLeads.length > 1 ? 's' : ''}</span>
                {urgentCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse text-[10px] md:text-xs">
                    {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Sem atualização há +3 dias
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 md:h-8 text-xs"
            >
              <Eye className="h-3.5 w-3.5 md:mr-1" />
              <span className="hidden sm:inline">{isExpanded ? 'Ocultar' : 'Ver todos'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="h-7 md:h-8 w-7 md:w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Lista Expandida */}
        {isExpanded && (
          <ScrollArea className="mt-3 md:mt-4 max-h-64">
            <div className="space-y-2">
              {staleLeads.map((lead) => (
                <div
                  key={lead.id}
                  className={`p-2 md:p-3 rounded-lg border cursor-pointer transition-colors ${
                    lead.daysStale >= 7 
                      ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20' 
                      : lead.daysStale >= 5
                        ? 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20'
                        : 'bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/10'
                  }`}
                  onClick={() => onLeadClick?.(lead.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getStatusColor(lead.status)}`} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1 md:gap-2">
                          <span className="font-medium text-xs md:text-sm truncate">{lead.name}</span>
                          {getStaleBadge(lead.daysStale)}
                        </div>
                        {/* Info em coluna no mobile */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 text-[10px] md:text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1 truncate">
                            <Building2 className="h-3 w-3 shrink-0" />
                            {lead.company_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            {formatDistanceToNow(new Date(lead.updated_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Botões */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline" className="text-[10px] hidden sm:inline-flex h-5">
                        {getStatusLabel(lead.status)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          const formattedPhone = lead.phone.replace(/\D/g, '');
                          window.open(`https://wa.me/55${formattedPhone}`, '_blank');
                        }}
                      >
                        <Phone className="h-4 w-4 text-green-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Preview quando fechado */}
        {!isExpanded && staleLeads.length > 0 && (
          <div className="mt-2 md:mt-3 flex flex-wrap gap-1.5 md:gap-2">
            {staleLeads.slice(0, 3).map((lead) => (
              <div
                key={lead.id}
                className="flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-background/50 border cursor-pointer hover:bg-background/80"
                onClick={() => onLeadClick?.(lead.id)}
              >
                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${
                  lead.daysStale >= 7 ? 'bg-red-500 animate-pulse' : 
                  lead.daysStale >= 5 ? 'bg-orange-500' : 'bg-yellow-500'
                }`} />
                <span className="text-xs md:text-sm font-medium truncate max-w-[80px] md:max-w-none">{lead.name}</span>
                <span className="text-[10px] md:text-xs text-muted-foreground">({lead.daysStale}d)</span>
              </div>
            ))}
            {staleLeads.length > 3 && (
              <span className="text-xs md:text-sm text-muted-foreground self-center">
                +{staleLeads.length - 3} mais...
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
