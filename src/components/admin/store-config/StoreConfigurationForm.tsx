import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Save, Check, Store, ExternalLink, Share2, Copy, Globe, CircleDot, Zap, Settings, Palette, CreditCard, Truck, MessageSquare, User } from "lucide-react";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

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
  efi_pix_enabled: boolean;
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
  gtm_id: string;
  google_ads_id: string;
  // Custom Scripts
  head_scripts: string;
  body_start_scripts: string;
  body_end_scripts: string;
  
  // User
  responsible_name: string;
  responsible_email: string;
  responsible_phone: string;
  responsible_cpf: string;
  
  // Notificações WhatsApp
  notification_phone: string;
  notification_country_code: string;
  notification_phone_2: string;
  notification_country_code_2: string;
  new_order_message_template: string;
  notify_new_orders: boolean;
}

const steps = [
  { id: 'general', title: 'Geral', description: 'Informações básicas', icon: Settings },
  { id: 'appearance', title: 'Aparência', description: 'Logo, cores e layout', icon: Palette },
  { id: 'payment', title: 'Pagamento', description: 'Métodos e configurações', icon: CreditCard },
  { id: 'delivery', title: 'Entrega', description: 'Endereço e horários', icon: Truck },
  { id: 'contact', title: 'Contato', description: 'Redes sociais e analytics', icon: MessageSquare },
  { id: 'user', title: 'Usuário', description: 'Dados do responsável', icon: User },
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
      efi_pix_enabled: store.efi_pix_enabled ?? false,
      
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
      gtm_id: (store.configuration?.gtm_id || store.store_configurations?.gtm_id || ''),
      google_ads_id: (store.configuration?.google_ads_id || store.store_configurations?.google_ads_id || ''),
      // Custom Scripts
      head_scripts: (store.configuration?.custom_scripts?.head_scripts || store.store_configurations?.custom_scripts?.head_scripts || ''),
      body_start_scripts: (store.configuration?.custom_scripts?.body_start_scripts || store.store_configurations?.custom_scripts?.body_start_scripts || ''),
      body_end_scripts: (store.configuration?.custom_scripts?.body_end_scripts || store.store_configurations?.custom_scripts?.body_end_scripts || ''),
      
      // User
      responsible_name: store.responsible_name || '',
      responsible_email: store.responsible_email || '',
      responsible_phone: store.responsible_phone || '',
      responsible_cpf: store.responsible_cpf || '',
      
      // Notificações WhatsApp
      notification_phone: store.notification_phone || '',
      notification_country_code: store.notification_country_code || '+55',
      notification_phone_2: store.notification_phone_2 || '',
      notification_country_code_2: store.notification_country_code_2 || '+55',
      new_order_message_template: store.new_order_message_template || '',
      notify_new_orders: store.notify_new_orders ?? false,
    };
  });

  const { toast } = useToast();

  const storeUrl = `${window.location.origin}/loja/${formData.slug}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    toast({ title: "Link copiado!", description: "URL da loja copiada para a área de transferência." });
  };

  const handleShareStore = () => {
    if (navigator.share) {
      navigator.share({ title: formData.name, url: storeUrl });
    } else {
      handleCopyUrl();
    }
  };

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
        efi_pix_enabled: formData.efi_pix_enabled,
        // Notificações WhatsApp
        notification_phone: formData.notification_phone || null,
        notification_country_code: formData.notification_country_code || '+55',
        notification_phone_2: formData.notification_phone_2 || null,
        notification_country_code_2: formData.notification_country_code_2 || '+55',
        new_order_message_template: formData.new_order_message_template || null,
        notify_new_orders: formData.notify_new_orders ?? false,
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
        gtm_id: formData.gtm_id || null,
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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Loja Aberta', sublabel: 'Recebendo pedidos normalmente', variant: 'default' as const, bgClass: 'bg-emerald-500/10 border-emerald-500/20', textClass: 'text-emerald-600 dark:text-emerald-400', dotClass: 'bg-emerald-500' };
      case 'suspended':
        return { label: 'Suspensa', sublabel: 'Loja temporariamente suspensa', variant: 'secondary' as const, bgClass: 'bg-amber-500/10 border-amber-500/20', textClass: 'text-amber-600 dark:text-amber-400', dotClass: 'bg-amber-500' };
      case 'inactive':
        return { label: 'Inativa', sublabel: 'Loja desativada', variant: 'outline' as const, bgClass: 'bg-red-500/10 border-red-500/20', textClass: 'text-red-600 dark:text-red-400', dotClass: 'bg-red-500' };
      default:
        return { label: status, sublabel: '', variant: 'outline' as const, bgClass: 'bg-muted', textClass: 'text-muted-foreground', dotClass: 'bg-muted-foreground' };
    }
  };

  const statusInfo = getStatusInfo(formData.status);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* ==================== HEADER DA LOJA ==================== */}
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
      </div>

      <Card className="overflow-hidden border-border/60">
        {/* Cover image strip */}
        {formData.cover_url && (
          <div className="h-32 sm:h-40 w-full overflow-hidden">
            <img src={formData.cover_url} alt="Capa da loja" className="w-full h-full object-cover" />
          </div>
        )}
        <CardContent className={`${formData.cover_url ? '-mt-8 sm:-mt-10' : 'pt-6'} pb-5 px-5 sm:px-6`}>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar / Logo */}
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-background shadow-md ring-2 ring-background shrink-0">
              {formData.logo_url ? (
                <AvatarImage src={formData.logo_url} alt={formData.name} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xl sm:text-2xl font-bold">
                {formData.name?.charAt(0)?.toUpperCase() || <Store className="w-8 h-8" />}
              </AvatarFallback>
            </Avatar>

            {/* Nome e info - com fundo para legibilidade */}
            <div className="flex-1 min-w-0 space-y-1 pt-1 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 -mx-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight break-words line-clamp-2 max-w-full">{formData.name || 'Sem nome'}</h1>
                <Badge variant={statusInfo.variant} className="shrink-0 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass} mr-1.5 animate-pulse`} />
                  {statusInfo.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                @{formData.slug} {formData.city && formData.state ? `• ${formData.city}, ${formData.state}` : ''}
              </p>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => window.open(storeUrl, '_blank')}>
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Ver loja
              </Button>
              <Button variant="outline" size="sm" onClick={handleShareStore}>
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Compartilhar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==================== STATUS + RESUMO ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Status Card */}
        <Card className={`border ${statusInfo.bgClass}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${statusInfo.bgClass}`}>
              <CircleDot className={`w-5 h-5 ${statusInfo.textClass}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${statusInfo.textClass}`}>{statusInfo.label}</p>
              <p className="text-xs text-muted-foreground truncate">{statusInfo.sublabel}</p>
            </div>
          </CardContent>
        </Card>

        {/* Canal ativo */}
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Loja Online</p>
              <p className="text-xs text-muted-foreground truncate">{formData.custom_domain || `mostralo.me/${formData.slug}`}</p>
            </div>
          </CardContent>
        </Card>

        {/* Config status */}
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Zap className="w-5 h-5 text-violet-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Configuração</p>
              <p className="text-xs text-muted-foreground">
                {store.configuration ? 'Completa' : 'Pendente'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==================== ACESSO PÚBLICO ==================== */}
      <Card className="border-border/60">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Acesso Público</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-lg border border-border/60 px-3 py-2 min-w-0">
              <span className="text-sm text-muted-foreground truncate">{storeUrl}</span>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copiar
              </Button>
              <Button size="sm" onClick={() => window.open(storeUrl, '_blank')}>
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Abrir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==================== CONFIGURAÇÕES (TABS) ==================== */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <Tabs value={currentStep} onValueChange={setCurrentStep}>
            {/* Tabs Header */}
            <div className="border-b border-border/60 px-2 pt-2">
              <TabsList className="bg-transparent h-auto p-0 gap-0 w-full justify-start overflow-x-auto flex-nowrap">
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <TabsTrigger
                      key={step.id}
                      value={step.id}
                      className="relative rounded-none border-b-2 border-transparent px-3 sm:px-4 py-3 text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent hover:text-foreground transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-xs sm:text-sm font-medium">{step.title}</span>
                        {isSectionValid(step.id) && (
                          <Check className="w-3 h-3 text-emerald-500" />
                        )}
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Tab Contents */}
            <div className="p-4 sm:p-6">
              <TabsContent value="general" className="mt-0 space-y-4">
                <GeneralStep formData={formData} updateFormData={updateFormData} />
                <Separator />
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={onClose}>Cancelar</Button>
                  <Button onClick={() => handleSaveSection('general')} disabled={loading}>
                    {loading ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" />Salvar Geral</>}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="mt-0 space-y-4">
                <AppearanceStep formData={formData} updateFormData={updateFormData} />
                <Separator />
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={onClose}>Cancelar</Button>
                  <Button onClick={() => handleSaveSection('appearance')} disabled={loading}>
                    {loading ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" />Salvar Aparência</>}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="payment" className="mt-0 space-y-4">
                <PaymentStep
                  formData={{ ...formData, store_id: store.id }}
                  updateFormData={updateFormData}
                  efiAccountStatus={store.efi_account_status}
                  efiAccountNumber={store.efi_account_number}
                />
                <Separator />
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={onClose}>Cancelar</Button>
                  <Button onClick={() => handleSaveSection('payment')} disabled={loading}>
                    {loading ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" />Salvar Pagamento</>}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="delivery" className="mt-0 space-y-4">
                <DeliveryStep
                  formData={formData}
                  updateFormData={updateFormData}
                  onSave={handleSave}
                  storeId={store.id}
                />
                <Separator />
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={onClose}>Cancelar</Button>
                  <Button onClick={() => handleSaveSection('delivery')} disabled={loading}>
                    {loading ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" />Salvar Entrega</>}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="mt-0 space-y-4">
                <ContactStep formData={formData} updateFormData={updateFormData} storeId={store.id} />
                <Separator />
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={onClose}>Cancelar</Button>
                  <Button onClick={() => handleSaveSection('contact')} disabled={loading}>
                    {loading ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" />Salvar Contato</>}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="user" className="mt-0 space-y-4">
                <UserStep formData={formData} updateFormData={updateFormData} />
                <Separator />
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={onClose}>Cancelar</Button>
                  <Button onClick={() => handleSaveSection('user')} disabled={loading}>
                    {loading ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" />Salvar Usuário</>}
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* ==================== BOTÃO FIXO ==================== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border/60 p-3 sm:p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveAndClose}
            disabled={loading}
            size="lg"
            className="px-6 sm:px-8 shadow-lg"
          >
            {loading ? 'Salvando...' : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Salvar e Fechar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
