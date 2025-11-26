import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatCurrency } from '@/utils/driverEarnings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Bell, 
  Calendar, 
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown
} from 'lucide-react';
import { ConfirmPaymentDialog } from './ConfirmPaymentDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PaymentRequest {
  id: string;
  driver_id: string;
  earning_ids: string[];
  total_amount: number;
  notes?: string;
  requested_at: string;
}

interface PaymentRequestsCardProps {
  requests: PaymentRequest[];
  drivers: Map<string, { full_name: string; avatar_url?: string }>;
  onApprove: (requestId: string, paymentData: any) => Promise<void>;
  onReject: (requestId: string, reason?: string) => Promise<void>;
}

export function PaymentRequestsCard({
  requests,
  drivers,
  onApprove,
  onReject,
}: PaymentRequestsCardProps) {
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(requests.map(r => r.id)));
    }
    setAllExpanded(!allExpanded);
  };

  const handleApproveClick = (request: PaymentRequest) => {
    setSelectedRequest(request);
  };

  const handleRejectClick = (request: PaymentRequest) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) return;
    
    setRejectingId(selectedRequest.id);
    try {
      await onReject(selectedRequest.id, 'Solicitação rejeitada pelo gestor');
      setRejectDialogOpen(false);
      setSelectedRequest(null);
    } finally {
      setRejectingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Solicitações de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Nenhuma solicitação de pagamento pendente no momento.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary animate-pulse" />
              Solicitações de Pagamento
              <Badge variant="destructive" className="ml-2">
                {requests.length}
              </Badge>
            </div>
            
            {/* Botão Expandir/Recolher Todos */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpandAll}
              className="gap-2"
            >
              {allExpanded ? (
                <>
                  <ChevronsUpDown className="h-4 w-4" />
                  Recolher Todos
                </>
              ) : (
                <>
                  <ChevronsDownUp className="h-4 w-4" />
                  Expandir Todos
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {requests.map((request) => {
            const driver = drivers.get(request.driver_id);
            const driverName = driver?.full_name || 'Entregador';
            const driverInitials = driverName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const isExpanded = expandedIds.has(request.id);

            return (
              <Collapsible
                key={request.id}
                open={isExpanded}
                onOpenChange={() => toggleExpand(request.id)}
              >
                {/* Header - Sempre visível */}
                <CollapsibleTrigger asChild>
                  <div className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      {/* Esquerda: Avatar + Nome + Info básica */}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={driver?.avatar_url} 
                            alt={driverName}
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {driverInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium">{driverName}</span>
                          <p className="text-xs text-muted-foreground">
                            {request.earning_ids.length} {request.earning_ids.length === 1 ? 'entrega' : 'entregas'}
                          </p>
                        </div>
                      </div>

                      {/* Direita: Valor + Badge + Ícone */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {formatCurrency(request.total_amount)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            Pendente
                          </Badge>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Conteúdo expandido */}
                <CollapsibleContent className="px-4 pb-4 space-y-3">
                  <div className="pt-3 border-t space-y-3">
                    {/* Data da solicitação */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(request.requested_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>

                    {/* Observações */}
                    {request.notes && (
                      <div className="flex gap-2 p-2 bg-muted rounded">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm">{request.notes}</p>
                      </div>
                    )}

                    {/* Botões de ação */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveClick(request);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Pagar Agora
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectClick(request);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>

      {/* Dialog de confirmação de pagamento */}
      {selectedRequest && !rejectDialogOpen && (
        <ConfirmPaymentDialog
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
          earningIds={selectedRequest.earning_ids}
          totalAmount={selectedRequest.total_amount}
          driverName={drivers.get(selectedRequest.driver_id)?.full_name || 'Entregador'}
          driverId={selectedRequest.driver_id}
          onSuccess={() => {
            onApprove(selectedRequest.id, {
              reference: 'payment_ref',
              notes: 'Pagamento aprovado',
            }).then(() => setSelectedRequest(null));
          }}
        />
      )}

      {/* Dialog de rejeição */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Solicitação de Pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja rejeitar esta solicitação? O entregador será notificado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!rejectingId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReject}
              disabled={!!rejectingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejectingId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rejeitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
