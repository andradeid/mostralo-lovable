import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ResetDetail {
  affiliate_id: string;
  affiliate_name: string;
  reset_amount: number;
}

interface ResetHistory {
  id: string;
  reset_at: string;
  affiliates_count: number;
  total_reset_amount: number;
  executed_by: string;
  reset_details: ResetDetail[];
  notes: string | null;
}

interface ResetHistoryTableProps {
  history: ResetHistory[];
}

// Card component for mobile view
function ResetHistoryCard({ item }: { item: ResetHistory }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = item.reset_details && item.reset_details.length > 0;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header clicável */}
      <div 
        className={`p-3 flex items-center justify-between ${hasDetails ? 'cursor-pointer hover:bg-muted/50' : ''}`}
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {format(new Date(item.reset_at), "dd/MM/yyyy", { locale: ptBR })}
          </p>
          <p className="text-xs text-muted-foreground">
            às {format(new Date(item.reset_at), "HH:mm")}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-bold">R$ {Number(item.total_reset_amount).toFixed(0)}</p>
            <div className="flex items-center gap-1 justify-end">
              <Badge variant="secondary" className="text-[10px] h-4 px-1">
                {item.affiliates_count} afil.
              </Badge>
              <Badge 
                variant={item.executed_by === 'manual' ? 'outline' : 'default'} 
                className="text-[10px] h-4 px-1"
              >
                {item.executed_by === 'manual' ? 'Manual' : 'Auto'}
              </Badge>
            </div>
          </div>
          {hasDetails && (
            <ChevronDown className={`h-4 w-4 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
          )}
        </div>
      </div>

      {/* Detalhes expandíveis */}
      {isExpanded && hasDetails && (
        <div className="px-3 pb-3 pt-0 border-t bg-muted/30">
          <p className="text-xs font-medium mb-2 pt-2">Detalhes:</p>
          <div className="space-y-1">
            {item.reset_details.map((detail, idx) => (
              <div key={idx} className="flex justify-between text-xs bg-background rounded px-2 py-1.5">
                <span className="truncate">{detail.affiliate_name}</span>
                <span className="font-medium text-muted-foreground ml-2">
                  R$ {Number(detail.reset_amount).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
          {item.notes && (
            <p className="text-[10px] text-muted-foreground mt-2">
              <span className="font-medium">Obs:</span> {item.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function ResetHistoryTable({ history }: ResetHistoryTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-6 md:py-8 text-muted-foreground text-sm">
        Nenhum reset registrado ainda
      </div>
    );
  }

  return (
    <>
      {/* Mobile: Cards empilhados */}
      <div className="space-y-2 md:hidden">
        {history.map((item) => (
          <ResetHistoryCard key={item.id} item={item} />
        ))}
      </div>

      {/* Desktop: Tabela tradicional */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-center">Afiliados</TableHead>
              <TableHead className="text-right">Total Resetado</TableHead>
              <TableHead>Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item) => {
              const isExpanded = expandedRows.has(item.id);
              const hasDetails = item.reset_details && item.reset_details.length > 0;
              
              return (
                <Collapsible key={item.id} open={isExpanded} onOpenChange={() => toggleRow(item.id)} asChild>
                  <>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        {hasDetails && (
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.reset_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{item.affiliates_count}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {Number(item.total_reset_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.executed_by === 'manual' ? 'outline' : 'default'}>
                          {item.executed_by === 'manual' ? 'Manual' : 'Automático'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    
                    {hasDetails && (
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={5} className="p-0">
                            <div className="px-6 py-3">
                              <p className="text-sm font-medium mb-2">Detalhes por Afiliado:</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {item.reset_details.map((detail, idx) => (
                                  <div 
                                    key={idx} 
                                    className="flex justify-between items-center bg-background rounded px-3 py-2 text-sm"
                                  >
                                    <span className="truncate">{detail.affiliate_name}</span>
                                    <span className="font-medium text-muted-foreground ml-2">
                                      R$ {Number(detail.reset_amount).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {item.notes && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  <span className="font-medium">Observação:</span> {item.notes}
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    )}
                  </>
                </Collapsible>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
