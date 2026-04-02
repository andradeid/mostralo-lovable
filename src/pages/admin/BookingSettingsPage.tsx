import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useBooking, BookingSettings } from '@/hooks/useBooking';
import { useWhatsAppStatus } from '@/hooks/useWhatsAppStatus';
import { useStoreModules } from '@/hooks/useStoreModules';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Clock, Settings, DollarSign, MessageSquare, HelpCircle, Save, Loader2, Star, CheckCircle2, AlertTriangle, Lock, ArrowUpCircle, CreditCard, ExternalLink, Link2, Send, MapPin, Navigation } from 'lucide-react';
import { MapLocationPicker } from '@/components/admin/store-config/MapLocationPicker';
import { BusinessHoursManager } from '@/components/admin/store-config/BusinessHoursManager';
import type { PixKeyType } from '@/utils/pixValidation';
import { BotTimezoneCard } from '@/components/admin/bot/BotTimezoneCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Valores padrão
const DEFAULT_SETTINGS: Omit<BookingSettings, 'id' | 'store_id' | 'created_at' | 'updated_at'> = {
  slot_interval_minutes: 30,
  max_advance_days: 30,
  min_advance_hours: 2,
  allow_any_professional: true,
  cancellation_hours_limit: 24,
  require_deposit: false,
  default_deposit_percentage: 30,
  send_confirmation_message: true,
  confirmation_message_template: '✅ *Agendamento Confirmado!*\n\nOlá *{cliente}*! 👋\n\n📋 *Detalhes do agendamento:*\n👤 Profissional: {profissional}\n💇 Serviço: {servico}\n📅 Data: {data}\n🕐 Horário: {horario}\n💰 Valor: {valor}\n\nQualquer dúvida, entre em contato! 😊',
  send_reminder_message: true,
  reminder_hours_before: 2,
  reminder_message_template: '⏰ *Lembrete de Agendamento*\n\nOlá *{cliente}*! 👋\n\nPassando para lembrar do seu horário:\n\n👤 Profissional: {profissional}\n💇 Serviço: {servico}\n📅 Data: {data}\n🕐 Horário: {horario}\n💰 Valor: {valor}\n\nTe esperamos! 😊',
  send_satisfaction_survey: false,
  satisfaction_message_template: '⭐ *Como foi seu atendimento?*\n\nOlá *{cliente}*! 👋\n\nEsperamos que tenha gostado do atendimento com *{profissional}*!\n\nPoderia avaliar de 1 a 5? Sua opinião é muito importante para nós! 💬',
  enable_professional_reviews: false,
  review_message_template: 'Olá {cliente}! Como foi seu atendimento com {profissional}?\n\nGostaríamos muito de ouvir sua opinião! Avalie em apenas 1 minuto:\n\n👉 {link}\n\nSua avaliação é muito importante para nós! ⭐',
  review_delay_minutes: 30,
  review_expiry_days: 7,
  show_public_reviews: true,
  show_subscription_plans: false,
  send_pix_payment: false,
  pix_key: '',
  pix_key_type: 'random',
  pix_recipient_name: '',
  pix_payment_message: '💳 *Sugestão de Pagamento PIX*\n\nOlá *{cliente}*! 👋\n\nSegue a cobrança referente ao seu agendamento:\n\n💇 Serviço: {servico}\n👤 Profissional: {profissional}\n📅 Data: {data}\n🕐 Horário: {horario}\n💰 Valor: {valor}\n\nVocê pode pagar via PIX para agilizar! 😊',
  auto_status_enabled: false,
  auto_complete_minutes: 15,
  google_review_url: '',
  send_location_in_confirmation: false,
};

export default function BookingSettingsPage() {
  const { storeId } = useStoreAccess();
  const { bookingSettings, updateSettings } = useBooking(storeId);
  const { hasConnectedWhatsApp, isLoading: isLoadingWhatsApp } = useWhatsAppStatus(storeId);
  const { hasModule, loading: isLoadingModules } = useStoreModules(storeId);
  
  const hasWhatsAppModule = hasModule('whatsapp_connection') || hasModule('whatsapp_chat') || hasModule('whatsapp_recovery');
  
  const [formData, setFormData] = useState(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [shortenedUrl, setShortenedUrl] = useState<string | null>(null);
  const [isShortening, setIsShortening] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [storeLocation, setStoreLocation] = useState<{ latitude: number | null; longitude: number | null; address: string; business_hours: any }>({
    latitude: null, longitude: null, address: '', business_hours: {}
  });
  const [isLoadingStore, setIsLoadingStore] = useState(true);

  // Carregar dados de localização da loja
  useEffect(() => {
    if (!storeId) return;
    const loadStore = async () => {
      setIsLoadingStore(true);
      const { data } = await supabase
        .from('stores')
        .select('latitude, longitude, address, business_hours, slug')
        .eq('id', storeId)
        .single();
      if (data) {
        setStoreLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address || '',
          business_hours: data.business_hours || {}
        });
      }
      setIsLoadingStore(false);
    };
    loadStore();
  }, [storeId]);

  // Carregar configurações existentes
  useEffect(() => {
    if (bookingSettings) {
      setFormData({
        slot_interval_minutes: bookingSettings.slot_interval_minutes ?? DEFAULT_SETTINGS.slot_interval_minutes,
        max_advance_days: bookingSettings.max_advance_days ?? DEFAULT_SETTINGS.max_advance_days,
        min_advance_hours: bookingSettings.min_advance_hours ?? DEFAULT_SETTINGS.min_advance_hours,
        allow_any_professional: bookingSettings.allow_any_professional ?? DEFAULT_SETTINGS.allow_any_professional,
        cancellation_hours_limit: bookingSettings.cancellation_hours_limit ?? DEFAULT_SETTINGS.cancellation_hours_limit,
        require_deposit: bookingSettings.require_deposit ?? DEFAULT_SETTINGS.require_deposit,
        default_deposit_percentage: bookingSettings.default_deposit_percentage ?? DEFAULT_SETTINGS.default_deposit_percentage,
        send_confirmation_message: bookingSettings.send_confirmation_message ?? DEFAULT_SETTINGS.send_confirmation_message,
        confirmation_message_template: bookingSettings.confirmation_message_template ?? DEFAULT_SETTINGS.confirmation_message_template,
        send_reminder_message: bookingSettings.send_reminder_message ?? DEFAULT_SETTINGS.send_reminder_message,
        reminder_hours_before: bookingSettings.reminder_hours_before ?? DEFAULT_SETTINGS.reminder_hours_before,
        reminder_message_template: bookingSettings.reminder_message_template ?? DEFAULT_SETTINGS.reminder_message_template,
        send_satisfaction_survey: bookingSettings.send_satisfaction_survey ?? DEFAULT_SETTINGS.send_satisfaction_survey,
        satisfaction_message_template: bookingSettings.satisfaction_message_template ?? DEFAULT_SETTINGS.satisfaction_message_template,
        enable_professional_reviews: bookingSettings.enable_professional_reviews ?? DEFAULT_SETTINGS.enable_professional_reviews,
        review_message_template: bookingSettings.review_message_template ?? DEFAULT_SETTINGS.review_message_template,
        review_delay_minutes: bookingSettings.review_delay_minutes ?? DEFAULT_SETTINGS.review_delay_minutes,
        review_expiry_days: bookingSettings.review_expiry_days ?? DEFAULT_SETTINGS.review_expiry_days,
        show_public_reviews: bookingSettings.show_public_reviews ?? DEFAULT_SETTINGS.show_public_reviews,
        show_subscription_plans: bookingSettings.show_subscription_plans ?? DEFAULT_SETTINGS.show_subscription_plans,
        send_pix_payment: bookingSettings.send_pix_payment ?? DEFAULT_SETTINGS.send_pix_payment,
        pix_key: bookingSettings.pix_key ?? DEFAULT_SETTINGS.pix_key,
        pix_key_type: bookingSettings.pix_key_type ?? DEFAULT_SETTINGS.pix_key_type,
        pix_recipient_name: bookingSettings.pix_recipient_name ?? DEFAULT_SETTINGS.pix_recipient_name,
        pix_payment_message: bookingSettings.pix_payment_message ?? DEFAULT_SETTINGS.pix_payment_message,
        auto_status_enabled: bookingSettings.auto_status_enabled ?? DEFAULT_SETTINGS.auto_status_enabled,
        auto_complete_minutes: bookingSettings.auto_complete_minutes ?? DEFAULT_SETTINGS.auto_complete_minutes,
        google_review_url: bookingSettings.google_review_url ?? DEFAULT_SETTINGS.google_review_url,
        send_location_in_confirmation: (bookingSettings as any).send_location_in_confirmation ?? DEFAULT_SETTINGS.send_location_in_confirmation,
      });
    }
  }, [bookingSettings]);

  const handleSave = async () => {
    if (!storeId) return;
    setIsSaving(true);
    try {
      await updateSettings({ store_id: storeId, ...formData });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationSelect = async (lat: number, lng: number, address: string) => {
    if (!storeId) return;
    setStoreLocation(prev => ({ ...prev, latitude: lat, longitude: lng, address }));
    setShowMapPicker(false);
    await supabase.from('stores').update({ latitude: lat, longitude: lng, address }).eq('id', storeId);
    toast.success('Localização atualizada!');
  };

  const handleBusinessHoursChange = async (hours: any) => {
    if (!storeId) return;
    setStoreLocation(prev => ({ ...prev, business_hours: hours }));
    await supabase.from('stores').update({ business_hours: hours }).eq('id', storeId);
  };

  const handleShortenUrl = useCallback(async () => {
    if (!formData.google_review_url) return;
    setIsShortening(true);
    try {
      const { data, error } = await supabase.functions.invoke('short-link', {
        body: { action: 'create_url', targetUrl: formData.google_review_url, storeSlug: storeId || 'general' }
      });
      if (error || !data?.success) { toast.error('Erro ao encurtar link'); return; }
      const shortUrl = `${window.location.origin}/r/${data.id}`;
      setShortenedUrl(shortUrl);
      toast.success('Link encurtado com sucesso!');
    } catch { toast.error('Erro ao encurtar link'); } finally { setIsShortening(false); }
  }, [formData.google_review_url, storeId]);

  const handleTestReview = useCallback(async () => {
    if (!testPhone) { toast.error('Informe o número de WhatsApp para teste'); return; }
    if (!storeId) { toast.error('Loja não identificada'); return; }
    const reviewUrl = shortenedUrl || formData.google_review_url;
    if (!reviewUrl) { toast.error('Configure o link de avaliação primeiro'); return; }
    setIsSendingTest(true);
    try {
      const normalizedPhone = testPhone.replace(/\D/g, '');
      const phoneWithCountry = normalizedPhone.startsWith('55') ? normalizedPhone : `55${normalizedPhone}`;
      const remoteJid = `${phoneWithCountry}@s.whatsapp.net`;
      const message = `⭐ *Teste de Avaliação*\n\nOlá! Este é um teste do sistema de avaliações.\n\nClique no link abaixo para avaliar:\n\n👉 ${reviewUrl}\n\nObrigado! 😊`;
      const { data: storeData } = await supabase.from('stores').select('logo_url').eq('id', storeId).single();
      const logoUrl = storeData?.logo_url || null;
      const { data, error } = await supabase.functions.invoke('whatsapp-chat-send', {
        body: { storeId, remoteJid, content: message, messageType: logoUrl ? 'image' : 'text', ...(logoUrl ? { mediaUrl: logoUrl } : {}) }
      });
      if (error) throw new Error(error.message || 'Erro ao enviar mensagem');
      if (data?.error) throw new Error(data.error);
      toast.success('✅ Mensagem de teste enviada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao enviar teste:', err);
      toast.error(err.message || 'Erro ao enviar mensagem de teste');
    } finally { setIsSendingTest(false); }
  }, [testPhone, shortenedUrl, formData.google_review_url, storeId]);

  const FieldTooltip = ({ content }: { content: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs"><p>{content}</p></TooltipContent>
    </Tooltip>
  );

  // Compact toggle row component
  const ToggleRow = ({ id, label, tooltip, checked, onChange, disabled }: { id: string; label: string; tooltip?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id} className="text-sm cursor-pointer">{label}</Label>
        {tooltip && <FieldTooltip content={tooltip} />}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );

  // Section header with icon and badge
  const SectionHeader = ({ icon: Icon, label, badge, iconColor }: { icon: any; label: string; badge?: string; iconColor?: string }) => (
    <div className="flex items-center gap-2 flex-1">
      <Icon className={`h-4 w-4 ${iconColor || 'text-primary'}`} />
      <span className="font-medium text-sm">{label}</span>
      {badge && <span className="ml-auto mr-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{badge}</span>}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Agendamento
          </h1>
          <p className="text-sm text-muted-foreground">Defina como funcionam os agendamentos da sua loja</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} size="sm">
          {isSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
          Salvar
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["agenda", "location", "automation", "payments", "whatsapp", "reviews"]} className="space-y-3">
        
        {/* ═══ 1. Agenda e Disponibilidade ═══ */}
        <AccordionItem value="agenda" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <SectionHeader icon={Clock} label="Agenda e Disponibilidade" badge={`${formData.slot_interval_minutes}min`} />
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {/* Horário de Funcionamento */}
              <BusinessHoursManager
                value={storeLocation.business_hours || {}}
                onChange={handleBusinessHoursChange}
              />

              {/* Regras em 3 colunas */}
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Regras de agendamento</p>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="slot_interval" className="text-sm">Intervalo entre horários</Label>
                      <FieldTooltip content="Define o intervalo de tempo entre cada horário disponível para agendamento. Ex: 30 min = 09:00, 09:30, 10:00..." />
                    </div>
                    <Select value={String(formData.slot_interval_minutes)} onValueChange={(v) => updateField('slot_interval_minutes', Number(v))}>
                      <SelectTrigger id="slot_interval" className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="20">20 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="45">45 minutos</SelectItem>
                        <SelectItem value="60">60 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="max_advance_days" className="text-sm">Antecedência máxima</Label>
                      <FieldTooltip content="Quantos dias no futuro o cliente pode agendar" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input id="max_advance_days" type="number" min={1} max={365} value={formData.max_advance_days} onChange={(e) => updateField('max_advance_days', Number(e.target.value))} className="w-20 h-9" />
                      <span className="text-xs text-muted-foreground">dias</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="min_advance_hours" className="text-sm">Antecedência mínima</Label>
                      <FieldTooltip content="Quantas horas antes o cliente precisa agendar" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input id="min_advance_hours" type="number" min={0} max={72} value={formData.min_advance_hours} onChange={(e) => updateField('min_advance_hours', Number(e.target.value))} className="w-20 h-9" />
                      <span className="text-xs text-muted-foreground">horas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ═══ 2. Localização e Fuso ═══ */}
        <AccordionItem value="location" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <SectionHeader icon={MapPin} label="Localização e Fuso Horário" badge={storeLocation.latitude ? '📍 Definida' : '⚠️ Pendente'} />
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {/* Localização */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endereço</p>
                {storeLocation.latitude && storeLocation.longitude ? (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">📍 {storeLocation.address || 'Localização definida'}</p>
                        <p className="text-xs text-muted-foreground">
                          Lat: {storeLocation.latitude?.toFixed(6)}, Lng: {storeLocation.longitude?.toFixed(6)}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowMapPicker(true)}>Alterar</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowMapPicker(true)}>
                    <MapPin className="h-3.5 w-3.5 mr-1.5" />
                    Selecionar no mapa
                  </Button>
                )}
                {showMapPicker && (
                  <MapLocationPicker
                    onLocationSelect={handleLocationSelect}
                    initialLat={storeLocation.latitude || undefined}
                    initialLng={storeLocation.longitude || undefined}
                    onClose={() => setShowMapPicker(false)}
                  />
                )}

                {/* Toggle enviar localização */}
                <div className="border-t pt-3">
                  <ToggleRow
                    id="send_location_confirmation"
                    label="Enviar localização na confirmação"
                    tooltip="Inclui o link 'Como chegar' na mensagem de confirmação (Google Maps, Waze, Uber)"
                    checked={formData.send_location_in_confirmation}
                    onChange={(checked) => updateField('send_location_in_confirmation', checked)}
                    disabled={!storeLocation.latitude || !storeLocation.longitude}
                  />
                  {formData.send_location_in_confirmation && storeLocation.latitude && storeLocation.longitude && (
                    <div className="mt-2 rounded-lg border bg-muted/30 p-2.5">
                      <p className="text-xs text-muted-foreground mb-1">Preview do link:</p>
                      <code className="text-xs bg-background px-1.5 py-0.5 rounded border break-all">
                        {window.location.origin}/navegar?lat={storeLocation.latitude}&lng={storeLocation.longitude}&address={encodeURIComponent(storeLocation.address || '')}
                      </code>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        💡 Use <code className="bg-muted px-1 rounded">{'{localizacao}'}</code> nos templates.
                      </p>
                    </div>
                  )}
                  {(!storeLocation.latitude || !storeLocation.longitude) && (
                    <p className="text-xs text-amber-600 mt-1">⚠️ Defina a localização para habilitar.</p>
                  )}
                </div>
              </div>

              {/* Fuso Horário */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Fuso horário</p>
                <BotTimezoneCard storeId={storeId} context="booking" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ═══ 3. Automação e Opções Gerais ═══ */}
        <AccordionItem value="automation" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <SectionHeader icon={Settings} label="Automação e Opções Gerais" badge={formData.auto_status_enabled ? '🟢 Ativo' : '⚪ Inativo'} />
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {/* Automação de Status */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Automação de status</p>
                <ToggleRow
                  id="auto_status_enabled"
                  label="Ativar automação de status"
                  tooltip="O sistema detectará automaticamente quando um atendimento está em andamento ou finalizado"
                  checked={formData.auto_status_enabled}
                  onChange={(checked) => setFormData(prev => ({ ...prev, auto_status_enabled: checked }))}
                />
                {formData.auto_status_enabled && (
                  <div className="space-y-1.5 pl-1">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-sm">Tempo para concluir</Label>
                      <FieldTooltip content="Tempo após o horário final para marcar como concluído automaticamente." />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={formData.auto_complete_minutes} onChange={(e) => setFormData(prev => ({ ...prev, auto_complete_minutes: Number(e.target.value) }))} min={5} max={60} className="w-20 h-9" />
                      <span className="text-xs text-muted-foreground">minutos</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Opções gerais */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Opções gerais</p>
                <ToggleRow
                  id="allow_any_professional"
                  label='Permitir "qualquer profissional"'
                  tooltip="Permite que o cliente escolha 'qualquer profissional disponível' ao agendar"
                  checked={formData.allow_any_professional}
                  onChange={(checked) => updateField('allow_any_professional', checked)}
                />
                <ToggleRow
                  id="show_subscription_plans"
                  label="Exibir planos de assinatura"
                  tooltip="Mostra banner na página de agendamento convidando clientes a conhecer os planos do Clube"
                  checked={formData.show_subscription_plans}
                  onChange={(checked) => updateField('show_subscription_plans', checked)}
                />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="cancellation_hours_limit" className="text-sm">Limite para cancelamento</Label>
                    <FieldTooltip content="Até quantas horas antes do agendamento o cliente pode cancelar" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input id="cancellation_hours_limit" type="number" min={0} max={168} value={formData.cancellation_hours_limit} onChange={(e) => updateField('cancellation_hours_limit', Number(e.target.value))} className="w-20 h-9" />
                    <span className="text-xs text-muted-foreground">horas antes</span>
                  </div>
                </div>

                {/* Link Google Review */}
                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5 text-primary" />
                    <Label htmlFor="google_review_url" className="text-sm font-semibold">Link Google Review</Label>
                    <FieldTooltip content="Cole o link de avaliação da sua loja no Google Maps." />
                  </div>
                  <Input id="google_review_url" type="url" placeholder="https://search.google.com/local/writereview?placeid=..." value={formData.google_review_url} onChange={(e) => { updateField('google_review_url', e.target.value); setShortenedUrl(null); }} className="h-9" />
                  <p className="text-xs text-muted-foreground">
                    Use <code className="bg-muted px-1 rounded">{'{google_review}'}</code> nos templates.
                  </p>

                  {formData.google_review_url && (
                    <div className="space-y-2 rounded-lg border bg-muted/30 p-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={handleShortenUrl} disabled={isShortening || !!shortenedUrl}>
                          {isShortening ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Link2 className="h-3 w-3 mr-1" />}
                          {shortenedUrl ? 'Encurtado ✓' : 'Encurtar'}
                        </Button>
                        <a href={formData.google_review_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" /> Abrir
                        </a>
                      </div>
                      {shortenedUrl && (
                        <div className="flex items-center gap-2 text-xs">
                          <code className="bg-background px-1.5 py-0.5 rounded border font-mono break-all">{shortenedUrl}</code>
                          <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { navigator.clipboard.writeText(shortenedUrl); toast.success('Link copiado!'); }}>Copiar</Button>
                        </div>
                      )}
                      {/* Testar via WhatsApp */}
                      <div className="border-t pt-2 space-y-1.5">
                        <Label className="text-xs font-medium">📱 Testar via WhatsApp</Label>
                        <div className="flex items-center gap-2">
                          <Input type="tel" placeholder="(11) 99999-9999" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="flex-1 max-w-[180px] h-8 text-xs" />
                          <Button type="button" variant="default" size="sm" onClick={handleTestReview} disabled={!testPhone || isSendingTest} className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs">
                            {isSendingTest ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                            {isSendingTest ? 'Enviando...' : 'Enviar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ═══ 4. Pagamentos ═══ */}
        <AccordionItem value="payments" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <SectionHeader icon={DollarSign} label="Pagamentos" badge={formData.require_deposit || formData.send_pix_payment ? '🟢 Ativo' : '⚪ Inativo'} />
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {/* Sinal / Depósito */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sinal / Depósito</p>
                <ToggleRow
                  id="require_deposit"
                  label="Exigir sinal para agendar"
                  tooltip="O cliente precisará pagar um valor antecipado para confirmar o agendamento"
                  checked={formData.require_deposit}
                  onChange={(checked) => updateField('require_deposit', checked)}
                />
                {formData.require_deposit && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="default_deposit_percentage" className="text-sm">Porcentagem do sinal</Label>
                      <FieldTooltip content="Porcentagem do valor total cobrada como sinal" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input id="default_deposit_percentage" type="number" min={1} max={100} value={formData.default_deposit_percentage} onChange={(e) => updateField('default_deposit_percentage', Number(e.target.value))} className="w-20 h-9" />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Cobrança PIX */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cobrança PIX</p>
                <ToggleRow
                  id="send_pix_payment"
                  label="Enviar cobrança PIX automática"
                  tooltip="O cliente recebe uma solicitação de pagamento PIX via WhatsApp após o agendamento ser confirmado"
                  checked={formData.send_pix_payment}
                  onChange={(checked) => updateField('send_pix_payment', checked)}
                />
                {formData.send_pix_payment && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Tipo da Chave PIX *</Label>
                        <Select value={formData.pix_key_type} onValueChange={(v) => updateField('pix_key_type', v)}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="random">Chave Aleatória</SelectItem>
                            <SelectItem value="cpf">CPF</SelectItem>
                            <SelectItem value="cnpj">CNPJ</SelectItem>
                            <SelectItem value="email">E-mail</SelectItem>
                            <SelectItem value="phone">Telefone</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pix_key" className="text-sm">Chave PIX *</Label>
                        <Input id="pix_key" value={formData.pix_key} onChange={(e) => updateField('pix_key', e.target.value)} className="h-9"
                          placeholder={formData.pix_key_type === 'cpf' ? '000.000.000-00' : formData.pix_key_type === 'cnpj' ? '00.000.000/0000-00' : formData.pix_key_type === 'email' ? 'email@exemplo.com' : formData.pix_key_type === 'phone' ? '(11) 99999-9999' : 'UUID da chave aleatória'} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pix_recipient_name" className="text-sm">Nome do recebedor</Label>
                      <Input id="pix_recipient_name" value={formData.pix_recipient_name} onChange={(e) => updateField('pix_recipient_name', e.target.value)} placeholder="Nome na cobrança" className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pix_payment_message" className="text-sm">Mensagem da cobrança</Label>
                      <Textarea id="pix_payment_message" value={formData.pix_payment_message} onChange={(e) => updateField('pix_payment_message', e.target.value)} rows={4} />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Variáveis: {'{cliente}'}, {'{profissional}'}, {'{servico}'}, {'{data}'}, {'{horario}'}, {'{valor}'}</p>
                        <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground h-6" onClick={() => updateField('pix_payment_message', DEFAULT_SETTINGS.pix_payment_message)}>🔄 Restaurar</Button>
                      </div>
                    </div>
                    {!formData.pix_key && (
                      <Alert variant="destructive" className="py-2">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <AlertTitle className="text-sm">Chave PIX obrigatória</AlertTitle>
                        <AlertDescription className="text-xs">Informe sua chave PIX para que a cobrança funcione.</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ═══ 5. Comunicação (WhatsApp) ═══ */}
        <AccordionItem value="whatsapp" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <SectionHeader icon={MessageSquare} label="Comunicação (WhatsApp)" badge={hasConnectedWhatsApp ? '🟢 Conectado' : '⚪ Desconectado'} />
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {/* Alerta de status */}
              {!isLoadingModules && !isLoadingWhatsApp && (
                <>
                  {!hasWhatsAppModule ? (
                    <Alert className="border-amber-500/50 bg-amber-500/10 py-2">
                      <Lock className="h-3.5 w-3.5 text-amber-600" />
                      <AlertTitle className="text-amber-700 dark:text-amber-400 text-sm">Módulo WhatsApp Não Disponível</AlertTitle>
                      <AlertDescription className="text-amber-600 dark:text-amber-300 text-xs">
                        As notificações requerem o módulo <strong>"WhatsApp Automações"</strong>.
                        <Button variant="outline" size="sm" asChild className="border-amber-500/50 hover:bg-amber-500/20 h-6 text-xs ml-2">
                          <Link to="/dashboard/subscription"><ArrowUpCircle className="h-3 w-3 mr-1" />Ver Planos</Link>
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : hasConnectedWhatsApp ? (
                    <Alert className="border-green-500/50 bg-green-500/10 py-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <AlertTitle className="text-green-700 dark:text-green-400 text-sm">WhatsApp Conectado</AlertTitle>
                      <AlertDescription className="text-green-600 dark:text-green-300 text-xs">Pronto para enviar notificações automáticas.</AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive" className="py-2">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <AlertTitle className="text-sm">WhatsApp Não Conectado</AlertTitle>
                      <AlertDescription className="text-xs">
                        Conecte seu WhatsApp para enviar notificações.
                        <Button variant="outline" size="sm" asChild className="ml-2 h-6 text-xs"><Link to="/dashboard/whatsapp">Configurar</Link></Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {/* Templates em grid 2 colunas */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {/* Confirmação */}
                <div className="space-y-2">
                  <ToggleRow id="send_confirmation_message" label="Confirmação de agendamento" tooltip="Envia mensagem quando o agendamento é confirmado" checked={formData.send_confirmation_message} onChange={(checked) => updateField('send_confirmation_message', checked)} />
                  {formData.send_confirmation_message && (
                    <div className="space-y-1.5">
                      <Textarea id="confirmation_message_template" placeholder="Template de confirmação..." value={formData.confirmation_message_template} onChange={(e) => updateField('confirmation_message_template', e.target.value)} rows={5} className="text-xs" />
                      <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground h-6" onClick={() => updateField('confirmation_message_template', DEFAULT_SETTINGS.confirmation_message_template)}>🔄 Restaurar</Button>
                    </div>
                  )}
                </div>

                {/* Lembrete */}
                <div className="space-y-2">
                  <ToggleRow id="send_reminder_message" label="Lembrete de agendamento" tooltip="Envia mensagem lembrando o cliente" checked={formData.send_reminder_message} onChange={(checked) => updateField('send_reminder_message', checked)} />
                  {formData.send_reminder_message && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="reminder_hours_before" className="text-xs">Enviar</Label>
                        <Input id="reminder_hours_before" type="number" min={1} max={48} value={formData.reminder_hours_before} onChange={(e) => updateField('reminder_hours_before', Number(e.target.value))} className="w-16 h-8 text-xs" />
                        <span className="text-xs text-muted-foreground">h antes</span>
                      </div>
                      <Textarea id="reminder_message_template" placeholder="Template de lembrete..." value={formData.reminder_message_template} onChange={(e) => updateField('reminder_message_template', e.target.value)} rows={5} className="text-xs" />
                      <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground h-6" onClick={() => updateField('reminder_message_template', DEFAULT_SETTINGS.reminder_message_template)}>🔄 Restaurar</Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Pesquisa de satisfação */}
              <div className="border-t pt-3">
                <ToggleRow id="send_satisfaction_survey" label="Pesquisa de satisfação (simples)" tooltip="Envia mensagem simples pedindo avaliação por nota" checked={formData.send_satisfaction_survey} onChange={(checked) => updateField('send_satisfaction_survey', checked)} />
                {formData.send_satisfaction_survey && (
                  <div className="space-y-1.5 mt-2">
                    <Textarea id="satisfaction_message_template" placeholder="Template de satisfação..." value={formData.satisfaction_message_template} onChange={(e) => updateField('satisfaction_message_template', e.target.value)} rows={4} className="text-xs" />
                    <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground h-6" onClick={() => updateField('satisfaction_message_template', DEFAULT_SETTINGS.satisfaction_message_template)}>🔄 Restaurar</Button>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground border-t pt-2">
                Variáveis: {'{cliente}'}, {'{profissional}'}, {'{servico}'}, {'{data}'}, {'{horario}'}, {'{valor}'}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ═══ 6. Avaliações ═══ */}
        <AccordionItem value="reviews" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <SectionHeader icon={Star} label="Avaliações de Profissionais" iconColor="text-amber-500" badge={formData.enable_professional_reviews ? '🟢 Ativo' : '⚪ Inativo'} />
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <ToggleRow
                id="enable_professional_reviews_section"
                label="Habilitar sistema de avaliações"
                tooltip="Clientes recebem um link para avaliar o profissional após o atendimento"
                checked={formData.enable_professional_reviews}
                onChange={(checked) => updateField('enable_professional_reviews', checked)}
              />

              {formData.enable_professional_reviews && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="review_message_template" className="text-sm">Template da mensagem</Label>
                    <Textarea id="review_message_template" placeholder="Template de avaliação..." value={formData.review_message_template} onChange={(e) => updateField('review_message_template', e.target.value)} rows={3} className="text-xs" />
                    <p className="text-xs text-muted-foreground">Variáveis: {'{cliente}'}, {'{profissional}'}, {'{servico}'}, {'{data}'}, {'{link}'}</p>
                  </div>

                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="review_delay_minutes" className="text-sm">Enviar após</Label>
                        <FieldTooltip content="Minutos após conclusão para enviar a solicitação" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input id="review_delay_minutes" type="number" min={0} max={1440} value={formData.review_delay_minutes} onChange={(e) => updateField('review_delay_minutes', Number(e.target.value))} className="w-20 h-9" />
                        <span className="text-xs text-muted-foreground">min</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="review_expiry_days" className="text-sm">Link expira em</Label>
                        <FieldTooltip content="Dias que o link de avaliação permanece válido" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input id="review_expiry_days" type="number" min={1} max={30} value={formData.review_expiry_days} onChange={(e) => updateField('review_expiry_days', Number(e.target.value))} className="w-20 h-9" />
                        <span className="text-xs text-muted-foreground">dias</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="show_public_reviews" className="text-sm">Exibir publicamente</Label>
                      <div className="flex items-center h-9">
                        <Switch id="show_public_reviews" checked={formData.show_public_reviews} onCheckedChange={(checked) => updateField('show_public_reviews', checked)} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Botão salvar mobile */}
      <div className="md:hidden">
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
