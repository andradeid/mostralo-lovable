import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Search, Send, UserPlus, CheckCircle, Clock, XCircle, Copy } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { formatCurrency } from '@/utils/driverEarnings';

interface Driver {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  status: 'available' | 'already_working' | 'pending' | 'accepted' | 'declined';
  invitation_date?: string;
}

export default function AvailableDriversPage() {
  const { user, userRole } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [storeId, setStoreId] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [paymentType, setPaymentType] = useState<'fixed' | 'commission'>('fixed');
  const [fixedAmount, setFixedAmount] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState('');
  const [invitationMessage, setInvitationMessage] = useState('');

  useEffect(() => {
    fetchStore();
  }, [user, userRole]);

  const fetchStore = async () => {
    if (!user || !userRole) return;

    try {
      // Buscar loja do usuário
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!storeData) {
        toast.error('Loja não encontrada');
        return;
      }

      setStoreId(storeData.id);
    } catch (error: any) {
      console.error('Error fetching store:', error);
      toast.error('Erro ao buscar loja');
    }
  };

  const fetchDrivers = async () => {
    if (!storeId || !emailSearch.trim()) {
      setDrivers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/list-available-drivers?storeId=${storeId}&email=${encodeURIComponent(emailSearch)}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar entregadores');
      }

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setDrivers(data.drivers || []);
    } catch (error: any) {
      console.error('Error fetching drivers:', error);
      toast.error('Erro ao buscar entregadores');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInviteDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setPaymentType('fixed');
    setFixedAmount('');
    setCommissionPercentage('');
    setInvitationMessage('');
    setShowInviteDialog(true);
  };

  const sendInvitation = async () => {
    if (!storeId || !selectedDriver) return;

    if (paymentType === 'fixed' && !fixedAmount) {
      toast.error('Informe o valor fixo por entrega');
      return;
    }
    if (paymentType === 'commission' && !commissionPercentage) {
      toast.error('Informe a porcentagem de comissão');
      return;
    }

    setSending(selectedDriver.id);

    try {
      console.log('📤 Enviando convite:', {
        store_id: storeId,
        driver_id: selectedDriver.id,
        driver_email: selectedDriver.email,
        payment_type: paymentType,
        fixed_amount: paymentType === 'fixed' ? parseFloat(fixedAmount) : null,
        commission: paymentType === 'commission' ? parseFloat(commissionPercentage) : null,
      });

      const { data, error } = await supabase.functions.invoke('create-driver-invitation', {
        body: {
          store_id: storeId,
          driver_id: selectedDriver.id,
          proposed_payment_type: paymentType,
          proposed_fixed_amount: paymentType === 'fixed' ? parseFloat(fixedAmount) : null,
          proposed_commission_percentage: paymentType === 'commission' ? parseFloat(commissionPercentage) : null,
          invitation_message: invitationMessage.trim() || null,
        }
      });

      console.log('📥 Resposta da função:', { data, error });

      if (error) {
        console.error('❌ Erro na invocação:', error);
        throw error;
      }

      if (data?.error) {
        console.error('❌ Erro retornado pela função:', data.error);
        toast.error(data.error);
        return;
      }

      console.log('✅ Convite enviado com sucesso');
      toast.success(data.message || 'Convite enviado com sucesso!');
      setShowInviteDialog(false);
      fetchDrivers();
    } catch (error: any) {
      console.error('❌ Erro ao enviar convite:', error);
      toast.error(error.message || 'Erro ao enviar convite');
    } finally {
      setSending(null);
    }
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Driver['status']) => {
    switch (status) {
      case 'already_working':
        return <Badge variant="default">Já trabalha aqui</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Aguardando resposta</Badge>;
      case 'accepted':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Aceito</Badge>;
      case 'declined':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Recusado</Badge>;
      default:
        return <Badge variant="outline">Disponível</Badge>;
    }
  };

  if (!userRole || (userRole !== 'store_admin' && userRole !== 'master_admin')) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Buscar Entregadores</h1>
          <p className="text-muted-foreground mt-2">
            Digite o email do entregador para encontrá-lo e enviar um convite
          </p>
        </div>

        {/* Mobile-friendly search layout */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Digite o email do entregador..."
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchDrivers();
                }
              }}
            />
          </div>
          <Button 
            onClick={fetchDrivers} 
            disabled={!emailSearch.trim() || loading}
            className="w-full sm:w-auto"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            Buscar
          </Button>
        </div>

      {!emailSearch.trim() ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Busque um entregador</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Digite o email do entregador no campo acima para encontrá-lo e enviar um convite para trabalhar na sua loja
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : filteredDrivers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum entregador encontrado</h3>
              <p className="text-muted-foreground">
                Não encontramos nenhum entregador com este email. Verifique se o email está correto.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDrivers.map(driver => (
              <Card key={driver.id}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={driver.avatar_url || undefined} />
                      <AvatarFallback>{driver.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{driver.full_name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{driver.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cadastrado em {new Date(driver.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getStatusBadge(driver.status)}
                  
                  {driver.status === 'available' && (
                    <Button
                      onClick={() => handleOpenInviteDialog(driver)}
                      disabled={!!sending}
                      className="w-full"
                      size="sm"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Convite
                    </Button>
                  )}

                  {driver.status === 'declined' && (
                    <Button
                      onClick={() => handleOpenInviteDialog(driver)}
                      disabled={!!sending}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Novo Convite
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Envio de Convite */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Enviar Convite</DialogTitle>
              <DialogDescription>
                Configure a proposta de pagamento para {selectedDriver?.full_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Tipo de Pagamento */}
              <div className="space-y-2">
                <Label>Tipo de Pagamento</Label>
                <RadioGroup value={paymentType} onValueChange={(value: 'fixed' | 'commission') => setPaymentType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="font-normal cursor-pointer">
                      Valor Fixo por Entrega
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="commission" id="commission" />
                    <Label htmlFor="commission" className="font-normal cursor-pointer">
                      Comissão sobre Taxa de Entrega
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Valor Fixo */}
              {paymentType === 'fixed' && (
                <div className="space-y-2">
                  <Label htmlFor="fixedAmount">Valor Fixo (R$)</Label>
                  <Input
                    id="fixedAmount"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 5.00"
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Entregador receberá este valor fixo por entrega
                  </p>
                </div>
              )}

              {/* Comissão */}
              {paymentType === 'commission' && (
                <div className="space-y-2">
                  <Label htmlFor="commission">Comissão (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="Ex: 70"
                    value={commissionPercentage}
                    onChange={(e) => setCommissionPercentage(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Entregador receberá esta % da taxa de entrega
                  </p>
                </div>
              )}

              {/* Mensagem */}
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem (Opcional)</Label>
                <Textarea
                  id="message"
                  placeholder="Ex: Olá! Gostaríamos de convidá-lo para trabalhar conosco..."
                  value={invitationMessage}
                  onChange={(e) => setInvitationMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
                disabled={!!sending}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={sendInvitation}
                disabled={!!sending}
                className="w-full sm:w-auto"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Convite
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
