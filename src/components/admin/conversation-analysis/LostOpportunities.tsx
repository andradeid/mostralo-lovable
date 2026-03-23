import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LostOpportunity {
  id: string;
  contact_name: string | null;
  phone_number: string;
  valor_estimado: number;
  motivo_sem_fechamento: string | null;
  resumo_comercial: string | null;
  last_message_at: string | null;
  confidence_score: number;
}

interface LostOpportunitiesProps {
  opportunities: LostOpportunity[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
}

export function LostOpportunities({ opportunities }: LostOpportunitiesProps) {
  if (opportunities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Oportunidades Perdidas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[120px] text-muted-foreground text-sm">
          Nenhuma oportunidade perdida identificada
        </CardContent>
      </Card>
    );
  }

  const totalLost = opportunities.reduce((s, o) => s + (o.valor_estimado || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Oportunidades Perdidas
          </CardTitle>
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">
            {formatCurrency(totalLost)} em potencial
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {opportunities.slice(0, 10).map((opp) => (
            <div
              key={opp.id}
              className="flex items-start gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {opp.contact_name || opp.phone_number}
                  </p>
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] shrink-0">
                    {opp.confidence_score}%
                  </Badge>
                </div>
                {opp.motivo_sem_fechamento && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {opp.motivo_sem_fechamento}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {opp.phone_number}
                  </span>
                  {opp.last_message_at && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(opp.last_message_at)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-amber-600 flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  {formatCurrency(opp.valor_estimado)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
