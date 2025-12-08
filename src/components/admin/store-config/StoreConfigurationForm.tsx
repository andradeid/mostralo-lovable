import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Save, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GeneralStep } from "./steps/GeneralStep";
import { AppearanceStep } from "./steps/AppearanceStep";
import { PaymentStep } from "./steps/PaymentStep";
import { DeliveryStep } from "./steps/DeliveryStep";
import { ContactStep } from "./steps/ContactStep";
import { UserStep } from "./steps/UserStep";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface StoreConfigurationFormProps {
  store: any;
  onClose: () => void;
}

interface FormData {
  // General
  name: string;
  slug: string;
  description: string;
  segment: string;
  state: string;
  city: string;
  status: 'active' | 'suspended' | 'inactive';
  custom_domain: string;
  custom_domain_verified: boolean;
  custom_domain_requested_at: string | null;
  
  // Appearance
  logo_url: string;
  cover_url: string;
  primary_color: string;
  secondary_color: string;
  product_display_layout: 'grid' | 'list' | 'carousel';
  
  // Payment
  min_order_value: number;
  accepts_cash: boolean;
  accepts_card: boolean;
  accepts_debit_card: boolean;
  accepts_pix: boolean;
  credit_card_brands: string;
  debit_card_brands: string;
  online_payment_enabled: boolean;
  pix_key: string;
  mercado_pago_token: string;
  // Gateway de pagamento
  payment_gateway: string;
  online_pix_enabled: boolean;
  online_credit_enabled: boolean;
  online_debit_enabled: boolean;
  online_boleto_enabled: boolean;
  online_cash_enabled: boolean;
  // Mercado Pago
  mp_sandbox_mode: string;
  mp_public_key: string;
  mp_secret_key: string;
  // Stripe
  stripe_test_mode: string;
  stripe_publishable_key: string;
  stripe_secret_key: string;
  
  // Delivery
  address: string;
  latitude: number | null;
  longitude: number | null;
  google_maps_link: string;
  phone: string;
  whatsapp: string;
  business_hours: any;
  delivery_fee: number;
  delivery_zones: any[];
  delivery_times: any;
  accept_outside_delivery_zone: boolean;
  // Opções de funcionamento e entrega
  send_whatsapp_copy: boolean;
  does_delivery: boolean;
  allows_pickup: boolean;
  show_delivery_time: boolean;
  delivery_time: string;
  pickup_time: string;
  auto_accept_orders: boolean;
  // Pedidos Agendados
  scheduled_orders: {
    enabled: boolean;
    pickup_settings: {
      min_advance_value: number;
      min_advance_unit: 'minutes' | 'hours';
      max_advance_value: number;
      max_advance_unit: 'days';
    };
    delivery_settings: {
      min_advance_value: number;
      min_advance_unit: 'minutes';
      max_advance_value: number;
      max_advance_unit: 'days';
      time_interval: 15 | 30 | 45 | 60;
    };
    hide_asap: boolean;
  };
  // QR Code e botões
  qr_code_enabled: boolean;
  qr_code_url: string;
  delivery_button_text: string;
  pickup_button_text: string;
  
  // Contact
  instagram: string;
  facebook: string;
  website: string;
  google_analytics_id: string;
  facebook_pixel_id: string;
  // Custom Scripts
  head_scripts: string;
  body_start_scripts: string;
  body_end_scripts: string;
  
  // User
  responsible_name: string;
  responsible_email: string;
  responsible_phone: string;
  responsible_cpf: string;
}

const steps = [
  { id: 'general', title: 'Geral', description: 'Informações básicas' },
  { id: 'appearance', title: 'Aparência', description: 'Logo, cores e layout' },
  { id: 'payment', title: 'Pagamento', description: 'Métodos e configurações' },
  { id: 'delivery', title: 'Entrega', description: 'Endereço e horários' },
  { id: 'contact', title: 'Contato', description: 'Redes sociais e analytics' },
  { id: 'user', title: 'Usuário', description: 'Dados do responsável' },
];

export function StoreConfigurationForm({ store, onClose }: StoreConfigurationFormProps) {
  const [currentStep, setCurrentStep] = useState('general');
  const [loading, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>(() => {
    console.log('🔧 Inicializando formData com store:', store);
    
    return {
      // General
      name: store.name || '',
      slug: store.slug || '',
      description: store.description || '',
      segment: store.segment || '',
      state: store.state || '',
      city: store.city || '',
      status: store.status || 'active',
      custom_domain: store.custom_domain || '',
      custom_domain_verified: store.custom_domain_verified || false,
      custom_domain_requested_at: store.custom_domain_requested_at || null,
      
      // Appearance
      logo_url: store.logo_url || '',
      cover_url: store.cover_url || '',
      primary_color: (store.configuration?.primary_color || store.store_configurations?.primary_color || '#3B82F6'),
      secondary_color: (store.configuration?.secondary_color || store.store_configurations?.secondary_color || '#10B981'),
      product_display_layout: (store.configuration?.product_display_layout || store.store_configurations?.product_display_layout || 'grid'),
      
      // Payment
      min_order_value: store.min_order_value || 0,
      accepts_cash: store.accepts_cash ?? true,
      accepts_card: store.accepts_card ?? true,
      accepts_debit_card: store.payment_gateways?.accepts_debit_card ?? false,
      accepts_pix: store.accepts_pix ?? true,
      credit_card_brands: store.payment_gateways?.credit_card_brands || '',
      debit_card_brands: store.payment_gateways?.debit_card_brands || '',
      online_payment_enabled: (store.configuration?.online_payment_enabled || store.store_configurations?.online_payment_enabled || false),
      pix_key: (store.configuration?.pix_key || store.store_configurations?.pix_key || ''),
      mercado_pago_token: (store.configuration?.mercado_pago_token || store.store_configurations?.mercado_pago_token || ''),
      // Gateway de pagamento
      payment_gateway: store.payment_gateways?.gateway || 'nenhum',
      online_pix_enabled: store.payment_gateways?.online_pix_enabled ?? false,
      online_credit_enabled: store.payment_gateways?.online_credit_enabled ?? false,
      online_debit_enabled: store.payment_gateways?.online_debit_enabled ?? false,
      online_boleto_enabled: store.payment_gateways?.online_boleto_enabled ?? false,
      online_cash_enabled: store.payment_gateways?.online_cash_enabled ?? false,
      // Mercado Pago
      mp_sandbox_mode: store.payment_gateways?.mercado_pago?.sandbox_mode || 'nao',
      mp_public_key: store.payment_gateways?.mercado_pago?.public_key || '',
      mp_secret_key: store.payment_gateways?.mercado_pago?.secret_key || '',
      // Stripe
      stripe_test_mode: store.payment_gateways?.stripe?.test_mode || 'nao',
      stripe_publishable_key: store.payment_gateways?.stripe?.publishable_key || '',
      stripe_secret_key: store.payment_gateways?.stripe?.secret_key || '',
      
      // Delivery
      address: store.address || '',
      latitude: store.latitude || null,
      longitude: store.longitude || null,
      google_maps_link: store.google_maps_link || '',
      phone: store.phone || '',
      whatsapp: store.whatsapp || '',
      business_hours: store.business_hours || {},
      delivery_fee: store.delivery_fee || 0,
      delivery_zones: (store.configuration?.delivery_zones || store.store_configurations?.delivery_zones || []),
      delivery_times: (store.configuration?.delivery_times || store.store_configurations?.delivery_times || {}),
      accept_outside_delivery_zone: (store.configuration?.accept_outside_delivery_zone || store.store_configurations?.accept_outside_delivery_zone || false),
      // Opções de funcionamento e entrega
      send_whatsapp_copy: store.delivery_config?.send_whatsapp_copy ?? false,
      does_delivery: store.delivery_config?.does_delivery ?? false,
      allows_pickup: store.delivery_config?.allows_pickup ?? false,
      show_delivery_time: store.delivery_config?.show_delivery_time ?? false,
      delivery_time: store.delivery_config?.delivery_time || '',
      pickup_time: store.delivery_config?.pickup_time || '',
      auto_accept_orders: store.delivery_config?.auto_accept_orders ?? false,
      // Pedidos Agendados
      scheduled_orders: store.delivery_config?.scheduled_orders || {
        enabled: false,
        pickup_settings: {
          min_advance_value: 1,
          min_advance_unit: 'hours',
          max_advance_value: 4,
          max_advance_unit: 'days'
        },
        delivery_settings: {
          min_advance_value: 90,
          min_advance_unit: 'minutes',
          max_advance_value: 4,
          max_advance_unit: 'days',
          time_interval: 15
        },
        hide_asap: false
      },
      // QR Code e botões
      qr_code_enabled: (store.configuration?.qr_code_enabled || store.store_configurations?.qr_code_enabled || false),
      qr_code_url: (store.configuration?.qr_code_url || store.store_configurations?.qr_code_url || ''),
      delivery_button_text: (store.configuration?.delivery_button_text || store.store_configurations?.delivery_button_text || 'Delivery'),
      pickup_button_text: (store.configuration?.pickup_button_text || store.store_configurations?.pickup_button_text || 'Retirada Balcão'),
      
      // Contact
      instagram: store.instagram || '',
      facebook: store.facebook || '',
      website: store.website || '',
      google_analytics_id: (store.configuration?.google_analytics_id || store.store_configurations?.google_analytics_id || ''),
      facebook_pixel_id: (store.configuration?.facebook_pixel_id || store.store_configurations?.facebook_pixel_id || ''),
      // Custom Scripts
      head_scripts: (store.configuration?.custom_scripts?.head_scripts || store.store_configurations?.custom_scripts?.head_scripts || ''),
      body_start_scripts: (store.configuration?.custom_scripts?.body_start_scripts || store.store_configurations?.custom_scripts?.body_start_scripts || ''),
      body_end_scripts: (store.configuration?.custom_scripts?.body_end_scripts || store.store_configurations?.custom_scripts?.body_end_scripts || ''),
      
      // User
      responsible_name: store.responsible_name || '',
      responsible_email: store.responsible_email || '',
      responsible_phone: store.responsible_phone || '',
      responsible_cpf: store.responsible_cpf || '',
    };
  });

  const { toast } = useToast();

  const updateFormData = (data: Partial<FormData>) => {
    console.log('📝 Atualizando formData:', data);
    setFormData(prev => {
      const updated = { ...prev, ...data };
      console.log('📝 FormData atualizado:', updated);
      return updated;
    });
  };

  // Funções de validação por seção
  const validateGeneral = () => {
    const errors = [];
    if (!formData.name?.trim()) errors.push('Nome é obrigatório');
    if (!formData.slug?.trim()) errors.push('URL é obrigatória');
    if (!formData.segment) errors.push('Segmento é obrigatório');
    if (!formData.state) errors.push('Estado é obrigatório');
    if (!formData.city?.trim()) errors.push('Cidade é obrigatória');
    return errors;
  };

  const validateDelivery = () => {
    const errors = [];
    if (!formData.address?.trim()) errors.push('Endereço é obrigatório');
    if (!formData.phone?.trim()) errors.push('Telefone é obrigatório');
    if (!formData.whatsapp?.trim()) errors.push('WhatsApp é obrigatório');
    return errors;
  };

  const validateUser = () => {
    const errors = [];
    if (!formData.responsible_name?.trim()) errors.push('Nome do responsável é obrigatório');
    if (!formData.responsible_email?.trim()) errors.push('Email do responsável é obrigatório');
    if (!formData.responsible_phone?.trim()) errors.push('Telefone do responsável é obrigatório');
    if (!formData.responsible_cpf?.trim()) errors.push('CPF do responsável é obrigatório');
    return errors;
  };

  const getSectionValidation = (section: string) => {
    switch(section) {
      case 'general': return validateGeneral();
      case 'delivery': return validateDelivery();
      case 'user': return validateUser();
      default: return [];
    }
  };

  const isSectionValid = (section: string) => {
    return getSectionValidation(section).length === 0;
  };

  const handleSaveSection = async (section: string) => {
    const errors = getSectionValidation(section);
    
    if (errors.length > 0) {
      toast({
        title: "Campos obrigatórios não preenchidos",
        description: (
          <div className="space-y-1">
            {errors.map((error, i) => (
              <div key={i}>• {error}</div>
            ))}
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    await handleSave(false);
    
    toast({
      title: "Salvo!",
      description: `Seção "${steps.find(s => s.id === section)?.title}" salva com sucesso.`,
    });
  };

  const handleNext = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handleSaveAndClose = async () => {
    console.log('🔒 handleSaveAndClose chamado');
    await handleSave(true);
  };

  const handleQuickSave = async () => {
    console.log('🔽 handleQuickSave chamado');
    await handleSave(false);
    toast({
      title: "Salvo!",
      description: "Alterações salvas automaticamente.",
    });
  };

  const handlePrevious = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleSave = async (showSuccessMessage = true) => {
    try {
      console.log('🔍 handleSave chamado', { showSuccessMessage, formData, storeId: store.id });
      setSaving(true);

      // Atualizar tabela stores
      const storeUpdateData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        status: formData.status,
        logo_url: formData.logo_url,
        cover_url: formData.cover_url,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        google_maps_link: formData.google_maps_link,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        instagram: formData.instagram,
        facebook: formData.facebook,
        website: formData.website,
        business_hours: formData.business_hours,
        delivery_fee: formData.delivery_fee,
        min_order_value: Number(formData.min_order_value) || 0,
        accepts_cash: formData.accepts_cash,
        accepts_card: formData.accepts_card,
        accepts_pix: formData.accepts_pix,
        responsible_name: formData.responsible_name,
        responsible_email: formData.responsible_email,
        responsible_cpf: formData.responsible_cpf,
        segment: formData.segment,
        state: formData.state,
        city: formData.city,
        custom_domain: formData.custom_domain,
        custom_domain_verified: formData.custom_domain_verified,
        custom_domain_requested_at: formData.custom_domain_requested_at,
        // JSON com opções adicionais de funcionamento/entrega
        delivery_config: {
          send_whatsapp_copy: formData.send_whatsapp_copy,
          does_delivery: formData.does_delivery,
          allows_pickup: formData.allows_pickup,
          show_delivery_time: formData.show_delivery_time,
          delivery_time: formData.delivery_time,
          pickup_time: formData.pickup_time,
          auto_accept_orders: formData.auto_accept_orders,
          scheduled_orders: formData.scheduled_orders,
        },
        payment_gateways: {
          gateway: formData.payment_gateway,
          accepts_debit_card: formData.accepts_debit_card,
          credit_card_brands: formData.credit_card_brands,
          debit_card_brands: formData.debit_card_brands,
          online_pix_enabled: formData.online_pix_enabled,
          online_credit_enabled: formData.online_credit_enabled,
          online_debit_enabled: formData.online_debit_enabled,
          online_boleto_enabled: formData.online_boleto_enabled,
          online_cash_enabled: formData.online_cash_enabled,
          mercado_pago: {
            sandbox_mode: formData.mp_sandbox_mode,
            public_key: formData.mp_public_key,
            secret_key: formData.mp_secret_key,
          },
          stripe: {
            test_mode: formData.stripe_test_mode,
            publishable_key: formData.stripe_publishable_key,
            secret_key: formData.stripe_secret_key,
          },
        },
      };

      console.log('🚀 Atualizando store', { storeId: store.id, storeUpdateData });
      console.log('💰 Valor mínimo no formData:', formData.min_order_value, 'Tipo:', typeof formData.min_order_value);

      const { error: storeError } = await supabase
        .from('stores')
        .update(storeUpdateData)
        .eq('id', store.id);

      if (storeError) {
        console.error('❌ Erro ao atualizar store:', storeError);
        throw storeError;
      }

      console.log('✅ Store atualizada com sucesso');

      // Atualizar ou criar configurações avançadas
      const configData = {
        store_id: store.id,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        product_display_layout: formData.product_display_layout,
        online_payment_enabled: formData.online_payment_enabled,
        pix_key: formData.pix_key,
        mercado_pago_token: formData.mercado_pago_token,
        delivery_zones: formData.delivery_zones,
        delivery_times: formData.delivery_times,
        accept_outside_delivery_zone: formData.accept_outside_delivery_zone,
        qr_code_enabled: formData.qr_code_enabled,
        qr_code_url: formData.qr_code_url,
        google_analytics_id: formData.google_analytics_id,
        facebook_pixel_id: formData.facebook_pixel_id,
        delivery_button_text: formData.delivery_button_text,
        pickup_button_text: formData.pickup_button_text,
        custom_scripts: {
          head_scripts: formData.head_scripts || '',
          body_start_scripts: formData.body_start_scripts || '',
          body_end_scripts: formData.body_end_scripts || '',
        },
      };

      console.log('🔧 Atualizando configurações', { configData });

      const { error: configError } = await supabase
        .from('store_configurations')
        .upsert(configData, {
          onConflict: 'store_id'
        });

      if (configError) {
        console.error('❌ Erro ao atualizar configurações:', configError);
        throw configError;
      }

      console.log('✅ Configurações atualizadas com sucesso');

      if (showSuccessMessage) {
        toast({
          title: "Sucesso",
          description: "Configurações salvas com sucesso!",
        });
      }

      // Só fecha se for na última etapa e não for um save intermediário
      const currentIndex = steps.findIndex(s => s.id === currentStep);
      if (currentIndex === steps.length - 1 && showSuccessMessage) {
        onClose();
      }
    } catch (error: any) {
      console.error('💥 Erro geral no handleSave:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'general':
        return <GeneralStep formData={formData} updateFormData={updateFormData} />;
      case 'appearance':
        return <AppearanceStep formData={formData} updateFormData={updateFormData} />;
      case 'payment':
        return <PaymentStep formData={formData} updateFormData={updateFormData} />;
      case 'delivery':
        return <DeliveryStep formData={formData} updateFormData={updateFormData} onSave={handleSave} storeId={store.id} />;
      case 'contact':
        return <ContactStep formData={formData} updateFormData={updateFormData} storeId={store.id} />;
      case 'user':
        return <UserStep formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar à Lista
        </Button>
        <h1 className="text-2xl font-bold">Configurar: {store.name}</h1>
        <div className="w-20" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={currentStep} onValueChange={setCurrentStep}>
            {/* Tabs Header - Responsivo */}
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 h-auto bg-muted/50 p-2">
              {steps.map((step) => (
                <TabsTrigger 
                  key={step.id} 
                  value={step.id}
                  className="flex flex-col items-start p-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium text-sm">{step.title}</span>
                    {isSectionValid(step.id) && (
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-xs opacity-70 text-left mt-1">{step.description}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 mt-6">
              <GeneralStep formData={formData} updateFormData={updateFormData} />
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  onClick={() => handleSaveSection('general')}
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Geral
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-4 mt-6">
              <AppearanceStep formData={formData} updateFormData={updateFormData} />
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  onClick={() => handleSaveSection('appearance')}
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Aparência
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-4 mt-6">
              <PaymentStep formData={formData} updateFormData={updateFormData} />
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  onClick={() => handleSaveSection('payment')}
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Pagamento
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Delivery Tab */}
            <TabsContent value="delivery" className="space-y-4 mt-6">
              <DeliveryStep 
                formData={formData} 
                updateFormData={updateFormData} 
                onSave={handleSave}
                storeId={store.id}
              />
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  onClick={() => handleSaveSection('delivery')}
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Entrega
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-4 mt-6">
              <ContactStep formData={formData} updateFormData={updateFormData} storeId={store.id} />
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  onClick={() => handleSaveSection('contact')}
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Contato
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* User Tab */}
            <TabsContent value="user" className="space-y-4 mt-6">
              <UserStep formData={formData} updateFormData={updateFormData} />
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  onClick={() => handleSaveSection('user')}
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Usuário
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Botão "Finalizar Configuração" fixo */}
      <Card className="sticky bottom-4 shadow-lg">
        <CardContent className="p-4">
          <Button 
            onClick={handleSaveAndClose}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Salvando...' : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Finalizar Configuração e Fechar
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}