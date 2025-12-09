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
  const alertCount = staleLeads.filter(l => l.daysStale >= 5 && l.daysStale < 7).length;

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
      return <Badge className="bg-red-500 text-white animate-pulse">URGENTE! ({daysStale}d)</Badge>;
    }
    if (daysStale >= 5) {
      return <Badge className="bg-orange-500 text-white">Alerta ({daysStale}d)</Badge>;
    }
    return <Badge className="bg-yellow-500 text-black">Atenção ({daysStale}d)</Badge>;
  };

  return (
    <Card className="mb-6 border-amber-500/50 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-red-500/10">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                ⚠️ {staleLeads.length} lead{staleLeads.length > 1 ? 's' : ''} precisa{staleLeads.length > 1 ? 'm' : ''} de follow-up!
                {urgentCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                Leads sem atualização há mais de 3 dias. Faça contato agora!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {isExpanded ? 'Ocultar' : 'Ver todos'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isExpanded && (
          <ScrollArea className="mt-4 max-h-64">
            <div className="space-y-2">
              {staleLeads.map((lead) => (
                <div
                  key={lead.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    lead.daysStale >= 7 
                      ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20' 
                      : lead.daysStale >= 5
                        ? 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20'
                        : 'bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/10'
                  }`}
                  onClick={() => onLeadClick?.(lead.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(lead.status)}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{lead.name}</span>
                          {getStaleBadge(lead.daysStale)}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {lead.company_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {lead.city}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(lead.updated_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getStatusLabel(lead.status)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
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

        {!isExpanded && staleLeads.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {staleLeads.slice(0, 3).map((lead) => (
              <div
                key={lead.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 border cursor-pointer hover:bg-background/80"
                onClick={() => onLeadClick?.(lead.id)}
              >
                <div className={`w-2 h-2 rounded-full ${
                  lead.daysStale >= 7 ? 'bg-red-500 animate-pulse' : 
                  lead.daysStale >= 5 ? 'bg-orange-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm font-medium">{lead.name}</span>
                <span className="text-xs text-muted-foreground">({lead.daysStale}d)</span>
              </div>
            ))}
            {staleLeads.length > 3 && (
              <span className="text-sm text-muted-foreground self-center">
                +{staleLeads.length - 3} mais...
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
