import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Store, 
  CreditCard, 
  Check, 
  Loader2, 
  Calendar, 
  ChevronLeft,
  Phone,
  User,
  Mail,
  CheckCircle2,
  Sparkles,
  Infinity
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatBrazilianPhone } from '@/lib/utils';

interface StoreInfo {
  id: string;
  name: string;
  logo_url: string | null;
  slug: string;
  description: string | null;
  cover_url: string | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_cycle: string;
  plan_type: string;
  usage_limit: number | null;
  benefits: unknown;
  image_url: string | null;
}

const billingCycleLabels: Record<string, string> = {
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  biannual: 'Semestral',
  annual: 'Anual'
};

export default function PublicSubscriptionPlansPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!storeSlug) return;
      
      setLoading(true);
      try {
        // Fetch store
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('id, name, logo_url, slug, description, cover_url')
          .eq('slug', storeSlug)
          .single();
        
        if (storeError || !storeData) {
          toast.error('Estabelecimento não encontrado');
          return;
        }
        
        setStore(storeData);
        
        // Fetch active subscription plans
        const { data: plansData, error: plansError } = await supabase
          .from('client_subscription_plans')
          .select('*')
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (plansError) {
          console.error('Error fetching plans:', plansError);
          return;
        }
        
        setPlans(plansData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [storeSlug]);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!store || !selectedPlan) return;
    
    // Validate
    if (!customerName.trim() || customerName.length < 2) {
      toast.error('Nome deve ter pelo menos 2 caracteres');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 10) {
      toast.error('Telefone inválido');
      return;
    }
    if (!paymentMethod) {
      toast.error('Selecione uma forma de pagamento');
      return;
    }
    
    setSubmitting(true);
    try {
      // Check if customer already exists
      const normalizedPhone = customerPhone.replace(/\D/g, '');
      let { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', normalizedPhone)
        .maybeSingle();
      
      let customerId: string;
      
      if (existingCustomer) {
        customerId = existingCustomer.id;
        // Update customer info
        await supabase
          .from('customers')
          .update({
            name: customerName,
            email: customerEmail || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', customerId);
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: customerName,
            phone: normalizedPhone,
            email: customerEmail || null
          })
          .select('id')
          .single();
        
        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }
      
      // Ensure customer_stores relation exists
      await supabase
        .from('customer_stores')
        .upsert({
          customer_id: customerId,
          store_id: store.id
        }, { onConflict: 'customer_id,store_id' });
      
      // Calculate period dates
      const startDate = new Date();
      const endDate = new Date();
      
      switch (selectedPlan.billing_cycle) {
        case 'weekly':
          endDate.setDate(endDate.getDate() + 7);
          break;
        case 'biweekly':
          endDate.setDate(endDate.getDate() + 14);
          break;
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case 'biannual':
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case 'annual':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
        default:
          endDate.setMonth(endDate.getMonth() + 1);
      }
      
      // Create subscription with pending status
      const { error: subscriptionError } = await supabase
        .from('client_subscriptions')
        .insert({
          store_id: store.id,
          customer_id: customerId,
          plan_id: selectedPlan.id,
          status: 'pending',
          payment_method: paymentMethod,
          payment_amount: selectedPlan.price,
          start_date: startDate.toISOString(),
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          next_payment_date: endDate.toISOString(),
          notes: notes || null,
          auto_renew: true,
          usages_this_period: 0
        });
      
      if (subscriptionError) throw subscriptionError;
      
      setSuccess(true);
      setFormOpen(false);
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando planos...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <Store className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-semibold mt-4">Estabelecimento não encontrado</h1>
          <p className="text-muted-foreground mt-2">Verifique o link e tente novamente</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Solicitação Enviada!</h2>
            <p className="text-muted-foreground mb-6">
              Sua solicitação de assinatura foi recebida com sucesso. 
              O estabelecimento entrará em contato para confirmar sua assinatura.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setSuccess(false);
                  setSelectedPlan(null);
                  setCustomerName('');
                  setCustomerPhone('');
                  setCustomerEmail('');
                  setPaymentMethod('');
                  setNotes('');
                }}
                className="w-full"
              >
                Ver outros planos
              </Button>
              <Link to={`/agendar/${storeSlug}`}>
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Fazer um agendamento
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <Link 
            to={`/agendar/${storeSlug}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar para agendamento
          </Link>
          
          <div className="flex items-center gap-4">
            {store.logo_url ? (
              <img 
                src={store.logo_url} 
                alt={store.name} 
                className="w-16 h-16 rounded-xl object-cover border"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Store className="h-8 w-8 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{store.name}</h1>
              {store.description && (
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                  {store.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="font-medium">Clube de Assinaturas</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">Escolha seu Plano</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Assine um plano e aproveite benefícios exclusivos em seus agendamentos
          </p>
        </div>

        {plans.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum plano disponível</h3>
              <p className="text-muted-foreground mb-4">
                Este estabelecimento ainda não possui planos de assinatura ativos.
              </p>
              <Link to={`/agendar/${storeSlug}`}>
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  Fazer um agendamento
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className="relative overflow-hidden hover:shadow-lg transition-shadow"
              >
                {plan.image_url && (
                  <div className="h-32 overflow-hidden">
                    <img 
                      src={plan.image_url} 
                      alt={plan.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <Badge variant="secondary" className="mt-2">
                        {billingCycleLabels[plan.billing_cycle] || plan.billing_cycle}
                      </Badge>
                    </div>
                  </div>
                  {plan.description && (
                    <CardDescription className="mt-2">
                      {plan.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-primary">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-muted-foreground">
                      /{billingCycleLabels[plan.billing_cycle]?.toLowerCase() || 'mês'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    {plan.plan_type === 'unlimited' ? (
                      <>
                        <Infinity className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 font-medium">Uso ilimitado</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-600 font-medium">
                          {plan.usage_limit} uso{plan.usage_limit !== 1 ? 's' : ''} por período
                        </span>
                      </>
                    )}
                  </div>

                  {Array.isArray(plan.benefits) && plan.benefits.length > 0 && (
                    <ul className="space-y-2">
                      {(plan.benefits as string[]).slice(0, 4).map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button 
                    className="w-full" 
                    onClick={() => handleSelectPlan(plan)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Assinar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Subscription Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assinar Plano</DialogTitle>
            <DialogDescription>
              {selectedPlan && (
                <>
                  <span className="font-semibold text-foreground">{selectedPlan.name}</span>
                  {' - '}
                  <span className="text-primary font-medium">
                    {formatPrice(selectedPlan.price)}/{billingCycleLabels[selectedPlan.billing_cycle]?.toLowerCase()}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome completo *
              </Label>
              <Input
                id="name"
                placeholder="Seu nome"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                WhatsApp *
              </Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(formatBrazilianPhone(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email (opcional)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Forma de pagamento preferida *
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Alguma informação adicional..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setFormOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Enviar Solicitação
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
