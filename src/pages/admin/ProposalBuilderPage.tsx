import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, User, Package, DollarSign, Send, ArrowLeft, ArrowRight,
  Check, Loader2, Copy, Phone, Mail, Building2, Calendar, Store
} from 'lucide-react';
import { useNiches } from '@/hooks/useNiches';
import { useNicheTemplates } from '@/hooks/useNicheTemplates';
import { useCreateProposal, SelectedModule } from '@/hooks/useCommercialProposals';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';
import { ProfessionalWhatsAppValidator, WhatsAppValidationStatus } from '@/components/admin/booking/ProfessionalWhatsAppValidator';
import { WhatsAppProfilePreview } from '@/components/leads/WhatsAppProfilePreview';

interface Module {
  id: string;
  name: string;
  key: string | null;
  suggested_price: number | null;
  is_active: boolean | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const steps = [
  { id: 1, title: 'Dados do Cliente', icon: User },
  { id: 2, title: 'Módulos', icon: Package },
  { id: 3, title: 'Valores', icon: DollarSign },
  { id: 4, title: 'Revisar', icon: Send },
];

export default function ProposalBuilderPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedSlug, setGeneratedSlug] = useState<string | null>(null);

  // Form state
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    niche_id: '',
  });
  
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  
  // WhatsApp validation state
  const [countryCode, setCountryCode] = useState('+55');
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppValidationStatus>('idle');
  const [whatsappProfile, setWhatsappProfile] = useState<{
    pictureUrl: string | null;
    pushName: string | null;
  } | null>(null);
  
  const [pricingData, setPricingData] = useState({
    setup_fee: 0,
    discount_percentage: 0,
    billing_cycle: 'monthly',
    validity_days: 7,
    internal_notes: '',
    store_count: 1,
  });

  // Queries
  const { data: niches = [] } = useNiches();
  const { data: templates = [] } = useNicheTemplates();
  const { data: modules = [] } = useQuery({
    queryKey: ['modules-for-proposal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('id, name, key, suggested_price, is_active')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Module[];
    }
  });

  const createProposal = useCreateProposal();

  // Validar WhatsApp com debounce
  useEffect(() => {
    const cleanPhone = clientData.phone.replace(/\D/g, '');
    const expectedLength = countryCode === '+55' ? 11 : 10;
    
    if (cleanPhone.length >= expectedLength) {
      setWhatsappStatus('validating');
      const timeoutId = setTimeout(() => {
        validateWhatsApp(cleanPhone);
      }, 800);
      return () => clearTimeout(timeoutId);
    } else {
      setWhatsappStatus('idle');
      setWhatsappProfile(null);
    }
  }, [clientData.phone, countryCode]);

  const validateWhatsApp = async (phone: string) => {
    try {
      const fullPhone = `${countryCode.replace('+', '')}${phone}`;
      const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
        body: { phone: fullPhone }
      });

      if (error) throw error;

      if (data?.valid || data?.exists) {
        setWhatsappStatus('valid');
        setWhatsappProfile({
          pictureUrl: data.profilePictureUrl || null,
          pushName: data.pushName || null,
        });
      } else {
        setWhatsappStatus('invalid');
        setWhatsappProfile(null);
      }
    } catch (error) {
      console.error('Erro ao validar WhatsApp:', error);
      setWhatsappStatus('invalid');
      setWhatsappProfile(null);
    }
  };

  // Calcular valores
  const calculations = useMemo(() => {
    const selectedModules = modules.filter(m => selectedModuleIds.includes(m.id));
    const pricePerStore = selectedModules.reduce((sum, m) => sum + (m.suggested_price || 0), 0);
    
    // Subtotal com número de lojas
    const subtotalWithStores = pricePerStore * pricingData.store_count;
    
    // Desconto aplicado sobre o subtotal
    const discountAmount = (subtotalWithStores * pricingData.discount_percentage) / 100;
    
    // Mensalidade final
    const monthlyPrice = Math.max(0, subtotalWithStores - discountAmount);
    
    // Calcular número de meses do ciclo
    const billingCycleMonths = {
      'monthly': 1,
      'quarterly': 3,
      'biannual': 6,
      'annual': 12,
    }[pricingData.billing_cycle] || 1;
    
    // Total de mensalidades no período
    const totalMonthlyPayments = monthlyPrice * billingCycleMonths;
    
    // Total geral (mensalidades + setup)
    const totalWithSetup = totalMonthlyPayments + pricingData.setup_fee;
    
    return {
      selectedModules,
      pricePerStore,
      subtotalWithStores,
      modulesTotal: subtotalWithStores, // Para compatibilidade
      discountAmount,
      finalPrice: Math.max(0, monthlyPrice + pricingData.setup_fee),
      monthlyPrice,
      billingCycleMonths,
      totalMonthlyPayments,
      totalWithSetup,
    };
  }, [modules, selectedModuleIds, pricingData]);

  // Aplicar template quando nicho mudar
  const handleNicheChange = (nicheId: string) => {
    setClientData(prev => ({ ...prev, niche_id: nicheId }));
    
    const defaultTemplate = templates.find(t => t.niche_id === nicheId && t.is_default);
    if (defaultTemplate) {
      setSelectedModuleIds(defaultTemplate.module_ids);
      toast.info(`Template "${defaultTemplate.name}" aplicado automaticamente`);
    }
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModuleIds(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return clientData.name && clientData.phone;
      case 2:
        return selectedModuleIds.length > 0;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    const selectedModules: SelectedModule[] = calculations.selectedModules.map(m => ({
      id: m.id,
      name: m.name,
      key: m.key || '',
      price: m.suggested_price || 0,
    }));

    const validUntil = addDays(new Date(), pricingData.validity_days);

    const result = await createProposal.mutateAsync({
      client_name: clientData.name,
      client_email: clientData.email || undefined,
      client_phone: clientData.phone,
      client_company: clientData.company || undefined,
      niche_id: clientData.niche_id || undefined,
      selected_modules: selectedModules,
      modules_total: calculations.modulesTotal,
      setup_fee: pricingData.setup_fee,
      discount_percentage: pricingData.discount_percentage,
      discount_amount: calculations.discountAmount,
      final_monthly_price: calculations.monthlyPrice,
      billing_cycle: pricingData.billing_cycle,
      valid_until: format(validUntil, 'yyyy-MM-dd'),
      internal_notes: pricingData.internal_notes || undefined,
      store_count: pricingData.store_count,
    });

    setGeneratedSlug(result.slug);
  };

  const copyLink = () => {
    if (generatedSlug) {
      navigator.clipboard.writeText(`${window.location.origin}/proposta/${generatedSlug}`);
      toast.success('Link copiado!');
    }
  };

  const sendWhatsApp = () => {
    if (generatedSlug) {
      const url = `${window.location.origin}/proposta/${generatedSlug}`;
      const message = encodeURIComponent(
        `Olá ${clientData.name}! 👋\n\nSua proposta comercial personalizada está pronta!\n\nAcesse aqui: ${url}\n\nQualquer dúvida estou à disposição!`
      );
      window.open(`https://wa.me/55${clientData.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  if (generatedSlug) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Proposta Criada!</h2>
            <p className="text-muted-foreground">
              Sua proposta foi gerada com sucesso. Envie o link para o cliente.
            </p>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Link da proposta:</p>
              <code className="text-sm break-all">
                {window.location.origin}/proposta/{generatedSlug}
              </code>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button onClick={copyLink} variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                Copiar Link
              </Button>
              <Button onClick={sendWhatsApp} className="bg-green-600 hover:bg-green-700">
                <Phone className="w-4 h-4 mr-2" />
                Enviar via WhatsApp
              </Button>
            </div>

            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard/propostas')}
              className="mt-4"
            >
              Ver todas as propostas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/propostas')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" />
            Nova Proposta Comercial
          </h1>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center gap-2 ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  isActive ? 'border-primary bg-primary/10' : 
                  isCompleted ? 'border-green-600 bg-green-600/10' : 
                  'border-muted-foreground/30'
                }`}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 sm:w-24 h-0.5 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Client Data */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nome Completo *
                  </Label>
                  <Input
                    value={clientData.name}
                    onChange={(e) => setClientData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div className="space-y-2">
                  <ProfessionalWhatsAppValidator
                    phone={clientData.phone}
                    countryCode={countryCode}
                    onPhoneChange={(phone) => setClientData(prev => ({ ...prev, phone }))}
                    onCountryCodeChange={setCountryCode}
                    onStatusChange={setWhatsappStatus}
                    status={whatsappStatus}
                  />
                  {whatsappStatus === 'valid' && whatsappProfile && (
                    <WhatsAppProfilePreview
                      profilePicture={whatsappProfile.pictureUrl}
                      pushName={whatsappProfile.pushName}
                      formattedNumber={clientData.phone}
                      formName={clientData.name}
                      className="mt-3"
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-mail
                  </Label>
                  <Input
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Empresa
                  </Label>
                  <Input
                    value={clientData.company}
                    onChange={(e) => setClientData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Nome da empresa"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nicho de Negócio</Label>
                <Select value={clientData.niche_id} onValueChange={handleNicheChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nicho" />
                  </SelectTrigger>
                  <SelectContent>
                    {niches.map(niche => (
                      <SelectItem key={niche.id} value={niche.id}>
                        {niche.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Ao selecionar um nicho, os módulos recomendados serão pré-selecionados
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Modules */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedModuleIds.length} módulos selecionados
                </p>
                <Badge variant="outline">
                  Total: {formatCurrency(calculations.modulesTotal)}/mês
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {modules.map(module => {
                  const isSelected = selectedModuleIds.includes(module.id);
                  const isCore = !module.suggested_price || module.suggested_price === 0;

                  return (
                    <div
                      key={module.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-primary/10 border-primary/30' 
                          : 'hover:bg-muted border-transparent'
                      }`}
                      onClick={() => toggleModule(module.id)}
                    >
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleModule(module.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{module.name}</p>
                        {isCore ? (
                          <Badge className="bg-green-600 text-white text-xs mt-1">INCLUSO</Badge>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(module.suggested_price || 0)}/mês
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    Número de Lojas
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={pricingData.store_count}
                    onChange={(e) => setPricingData(prev => ({ 
                      ...prev, 
                      store_count: Math.max(1, parseInt(e.target.value) || 1) 
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mensalidade multiplicada pelo nº de lojas
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Taxa de Setup (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={pricingData.setup_fee}
                    onChange={(e) => setPricingData(prev => ({ ...prev, setup_fee: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Desconto (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={pricingData.discount_percentage}
                    onChange={(e) => setPricingData(prev => ({ ...prev, discount_percentage: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ciclo de Cobrança</Label>
                  <Select 
                    value={pricingData.billing_cycle} 
                    onValueChange={(v) => setPricingData(prev => ({ ...prev, billing_cycle: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="biannual">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Validade (dias)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={pricingData.validity_days}
                    onChange={(e) => setPricingData(prev => ({ ...prev, validity_days: parseInt(e.target.value) || 7 }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notas Internas</Label>
                <Textarea
                  value={pricingData.internal_notes}
                  onChange={(e) => setPricingData(prev => ({ ...prev, internal_notes: e.target.value }))}
                  placeholder="Notas visíveis apenas para você..."
                  rows={3}
                />
              </div>

              {/* Resumo de valores */}
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Valor por loja:</span>
                    <span>{formatCurrency(calculations.pricePerStore)}/mês</span>
                  </div>
                  {pricingData.store_count > 1 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>{pricingData.store_count} lojas:</span>
                      <span>{formatCurrency(calculations.subtotalWithStores)}/mês</span>
                    </div>
                  )}
                  {pricingData.discount_percentage > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto ({pricingData.discount_percentage}%):</span>
                      <span>-{formatCurrency(calculations.discountAmount)}</span>
                    </div>
                  )}
                  {pricingData.setup_fee > 0 && (
                    <div className="flex justify-between">
                      <span>Taxa de setup (única):</span>
                      <span>+{formatCurrency(pricingData.setup_fee)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Mensalidade Total:</span>
                    <span className="text-primary">{formatCurrency(calculations.monthlyPrice)}/mês</span>
                  </div>
                  {/* Mostrar total do período quando não for mensal */}
                  {pricingData.billing_cycle !== 'monthly' && (
                    <div className="mt-3 pt-3 border-t border-dashed space-y-2">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Mensalidades ({calculations.billingCycleMonths}x):</span>
                        <span>{calculations.billingCycleMonths}x {formatCurrency(calculations.monthlyPrice)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>= Subtotal mensalidades:</span>
                        <span>{formatCurrency(calculations.totalMonthlyPayments)}</span>
                      </div>
                      {pricingData.setup_fee > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>+ Setup:</span>
                          <span>{formatCurrency(pricingData.setup_fee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total do Período:</span>
                        <span className="text-primary">{formatCurrency(calculations.totalWithSetup)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Dados do Cliente</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><strong>Nome:</strong> {clientData.name}</p>
                  <p><strong>Telefone:</strong> {clientData.phone}</p>
                  {clientData.email && <p><strong>E-mail:</strong> {clientData.email}</p>}
                  {clientData.company && <p><strong>Empresa:</strong> {clientData.company}</p>}
                  {clientData.niche_id && (
                    <p><strong>Nicho:</strong> {niches.find(n => n.id === clientData.niche_id)?.name}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Módulos ({selectedModuleIds.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {calculations.selectedModules.map(m => (
                      <Badge key={m.id} variant="outline">{m.name}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor mensal</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(calculations.monthlyPrice)}
                      </p>
                    </div>
                    {pricingData.setup_fee > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Taxa de setup</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(pricingData.setup_fee)}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Mostrar resumo total quando não for mensal */}
                  {pricingData.billing_cycle !== 'monthly' && (
                    <div className="pt-3 border-t border-primary/20 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {calculations.billingCycleMonths}x mensalidades:
                        </span>
                        <span>{formatCurrency(calculations.totalMonthlyPayments)}</span>
                      </div>
                      {pricingData.setup_fee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">+ Setup:</span>
                          <span>{formatCurrency(pricingData.setup_fee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg pt-2 border-t border-primary/20">
                        <span>Total do Contrato:</span>
                        <span className="text-primary">{formatCurrency(calculations.totalWithSetup)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createProposal.isPending}
              >
                {createProposal.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Send className="w-4 h-4 mr-2" />
                Gerar Proposta
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
