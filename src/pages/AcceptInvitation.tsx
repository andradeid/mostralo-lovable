import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Bike, Building2, DollarSign, Percent, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { formatCurrency } from '@/utils/driverEarnings';
import { CounterOfferDialog } from '@/components/delivery/CounterOfferDialog';

export default function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCounterOffer, setShowCounterOffer] = useState(false);

  useEffect(() => {
    if (session && token) {
      fetchInvitation();
    } else if (!session) {
      toast.error('Você precisa estar logado para aceitar um convite');
      navigate(`/auth?redirect=/aceitar-convite/${token}`);
    }
  }, [session, token]);

  const fetchInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_invitations')
        .select('*, stores(name, logo_url)')
        .eq('token', token)
        .single();

      if (error) throw error;

      if (!data) {
        setError('Convite não encontrado');
        return;
      }

      if (data.status !== 'pending') {
        setError(`Este convite já foi ${data.status === 'accepted' ? 'aceito' : 'recusado'}`);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('Este convite expirou');
        return;
      }

      if (data.driver_id !== session?.user?.id) {
        setError('Este convite não é para você');
        return;
      }

      setInvitation(data);
    } catch (error: any) {
      console.error('Error fetching invitation:', error);
      setError(error.message || 'Erro ao buscar convite');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'accept' | 'decline') => {
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('accept-driver-invitation', {
        body: { token, action }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setSuccess(true);
      toast.success(data.message);

      setTimeout(() => {
        if (action === 'accept') {
          navigate('/delivery');
        } else {
          navigate('/');
        }
      }, 2000);

    } catch (error: any) {
      console.error('Error processing invitation:', error);
      toast.error(error.message || 'Erro ao processar convite');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando convite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-destructive/5 via-background to-destructive/10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Convite Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Voltar para o Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-500/5 via-background to-green-500/10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Sucesso!</CardTitle>
            <CardDescription>
              Convite processado com sucesso. Você será redirecionado em instantes.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto mb-4 flex items-center justify-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback>
                <Building2 className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold mb-2">
              Convite para Trabalhar
            </CardTitle>
            <CardDescription className="text-lg">
              {invitation.stores.name} convidou você para ser entregador!
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Proposta de Pagamento */}
          <div className="rounded-lg bg-primary/5 border-2 border-primary/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              {invitation.proposed_payment_type === 'fixed' ? (
                <DollarSign className="h-5 w-5 text-primary" />
              ) : (
                <Percent className="h-5 w-5 text-primary" />
              )}
              <h3 className="text-lg font-semibold">Proposta de Pagamento</h3>
            </div>
            
            <div className="bg-background rounded-lg p-4 mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">
                  {invitation.proposed_payment_type === 'fixed'
                    ? formatCurrency(invitation.proposed_fixed_amount || 0)
                    : `${invitation.proposed_commission_percentage || 0}%`}
                </span>
                <span className="text-muted-foreground">
                  {invitation.proposed_payment_type === 'fixed'
                    ? 'por entrega'
                    : 'da taxa de entrega'}
                </span>
              </div>
              <Badge variant="outline" className="mt-2">
                {invitation.proposed_payment_type === 'fixed' ? 'Taxa Fixa' : 'Comissão'}
              </Badge>
            </div>

            {invitation.invitation_message && (
              <div className="border-l-2 border-primary/30 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Mensagem do lojista:</span>
                </div>
                <p className="text-sm">{invitation.invitation_message}</p>
              </div>
            )}
          </div>

          {/* Informações do Convite */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  O que acontece ao aceitar?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Você passa a trabalhar para {invitation.stores.name}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Receberá notificações de novos pedidos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Ganhos conforme os valores acordados</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Não concorda com os valores?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Você pode fazer uma contra-proposta com os valores que considera justos.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCounterOffer(true)}
                  className="w-full"
                >
                  Fazer Contra-proposta
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleAction('decline')}
              disabled={processing}
              className="flex-1"
            >
              Recusar Convite
            </Button>
            <Button
              size="lg"
              onClick={() => handleAction('accept')}
              disabled={processing}
              className="flex-1"
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aceitar Convite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Contra-proposta */}
      <CounterOfferDialog
        open={showCounterOffer}
        onOpenChange={setShowCounterOffer}
        token={token!}
        currentProposal={{
          payment_type: invitation.proposed_payment_type,
          fixed_amount: invitation.proposed_fixed_amount,
          commission_percentage: invitation.proposed_commission_percentage,
        }}
        onSuccess={() => {
          setSuccess(true);
          toast.success('Contra-proposta enviada com sucesso!');
          setTimeout(() => navigate('/'), 2000);
        }}
      />
    </div>
  );
}
