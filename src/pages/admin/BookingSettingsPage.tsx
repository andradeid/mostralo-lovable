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
import { Badge } from '@/components/ui/badge';
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

  // Compact helpers
  const Tip = ({ text }: { text: string }) => (
    <Tooltip>
      <TooltipTrigger asChild><HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help shrink-0" /></TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs"><p>{text}</p></TooltipContent>
    </Tooltip>
  );

  const TRow = ({ id, label, tip, checked, onChange, disabled }: { id: string; label: string; tip?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
    <div className="flex items-center justify-between py-1 min-h-[32px]">
      <div className="flex items-center gap-1">
        <Label htmlFor={id} className="text-xs cursor-pointer leading-tight">{label}</Label>
        {tip && <Tip text={tip} />}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} className="scale-90" />
    </div>
  );

  const StatusBadge = ({ active, activeText = 'Ativo', inactiveText = 'Inativo' }: { active: boolean; activeText?: string; inactiveText?: string }) => (
    <Badge variant={active ? 'default' : 'secondary'} className={`text-[10px] px-1.5 py-0 h-4 font-normal ${active ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground'}`}>
      {active ? activeText : inactiveText}
    </Badge>
  );

  const SectionHead = ({ icon: Icon, label, children }: { icon: any; label: string; children?: React.ReactNode }) => (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="font-medium text-xs truncate">{label}</span>
      {children && <div className="ml-auto mr-2 flex items-center gap-1.5">{children}</div>}
    </div>
  );

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações de Agendamento
          </h1>
          <p className="text-xs text-muted-foreground">Defina como funcionam os agendamentos</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} size="sm" className="h-8 text-xs">
          {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
          Salvar
        </Button>
      </div>

      {/* Row 1: Agenda + Regras + Localização */}
      <div className="grid gap-2 grid-cols-1 lg:grid-cols-3">
        {/* Horário de Funcionamento */}
        <div className="lg:col-span-2 border rounded-lg bg-card overflow-hidden">
          <Accordion type="multiple" defaultValue={["agenda"]}>
            <AccordionItem value="agenda" className="border-0">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <SectionHead icon={Clock} label="Agenda e Disponibilidade">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">{formData.slot_interval_minutes}min</Badge>
                </SectionHead>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <BusinessHoursManager
                  value={storeLocation.business_hours || {}}
                  onChange={handleBusinessHoursChange}
                />
                {/* Regras em grid compacto */}
                <div className="border-t mt-3 pt-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Regras de agendamento</p>
                  <div className="grid gap-2 grid-cols-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Label className="text-[11px]">Intervalo</Label>
                        <Tip text="Intervalo entre horários. Ex: 30min = 09:00, 09:30..." />
                      </div>
                      <Select value={String(formData.slot_interval_minutes)} onValueChange={(v) => updateField('slot_interval_minutes', Number(v))}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="20">20 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="45">45 min</SelectItem>
                          <SelectItem value="60">60 min</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Label className="text-[11px]">Máx. antecedência</Label>
                        <Tip text="Quantos dias no futuro o cliente pode agendar" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Input type="number" min={1} max={365} value={formData.max_advance_days} onChange={(e) => updateField('max_advance_days', Number(e.target.value))} className="w-16 h-7 text-xs" />
                        <span className="text-[10px] text-muted-foreground">dias</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Label className="text-[11px]">Mín. antecedência</Label>
                        <Tip text="Horas mínimas antes para agendar" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Input type="number" min={0} max={72} value={formData.min_advance_hours} onChange={(e) => updateField('min_advance_hours', Number(e.target.value))} className="w-16 h-7 text-xs" />
                        <span className="text-[10px] text-muted-foreground">horas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Localização */}
        <div className="border rounded-lg bg-card overflow-hidden">
          <Accordion type="multiple" defaultValue={["location"]}>
            <AccordionItem value="location" className="border-0">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <SectionHead icon={MapPin} label="Localização">
                  <StatusBadge active={!!storeLocation.latitude} activeText="📍 Definida" inactiveText="⚠️ Pendente" />
                </SectionHead>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 space-y-2">
                {storeLocation.latitude && storeLocation.longitude ? (
                  <div className="rounded-md border bg-muted/30 p-2 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">📍 {storeLocation.address || 'Localização definida'}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {storeLocation.latitude?.toFixed(4)}, {storeLocation.longitude?.toFixed(4)}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] shrink-0" onClick={() => setShowMapPicker(true)}>Alterar</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="h-7 text-xs w-full" onClick={() => setShowMapPicker(true)}>
                    <MapPin className="h-3 w-3 mr-1" /> Selecionar no mapa
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

                <TRow
                  id="send_location_confirmation"
                  label="Enviar localização na confirmação"
                  tip="Inclui link 'Como chegar' na confirmação"
                  checked={formData.send_location_in_confirmation}
                  onChange={(checked) => updateField('send_location_in_confirmation', checked)}
                  disabled={!storeLocation.latitude || !storeLocation.longitude}
                />
                {formData.send_location_in_confirmation && storeLocation.latitude && storeLocation.longitude && (
                  <p className="text-[10px] text-muted-foreground bg-muted/30 rounded px-2 py-1">
                    💡 Use <code className="bg-muted px-0.5 rounded text-[9px]">{'{localizacao}'}</code> nos templates
                  </p>
                )}
                {(!storeLocation.latitude || !storeLocation.longitude) && (
                  <p className="text-[10px] text-amber-600">⚠️ Defina a localização para habilitar.</p>
                )}

                {/* Fuso */}
                <div className="border-t pt-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Fuso horário</p>
                  <BotTimezoneCard storeId={storeId} context="booking" />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Row 2: Automação + Pagamentos + Avaliações */}
      <div className="grid gap-2 grid-cols-1 lg:grid-cols-3">
        {/* Automação e Opções */}
        <div className="border rounded-lg bg-card overflow-hidden">
          <Accordion type="multiple" defaultValue={["automation"]}>
            <AccordionItem value="automation" className="border-0">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <SectionHead icon={Settings} label="Automação e Opções">
                  <StatusBadge active={formData.auto_status_enabled} />
                </SectionHead>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 space-y-1">
                <TRow
                  id="auto_status_enabled"
                  label="Automação de status"
                  tip="Detecta automaticamente atendimento em andamento/finalizado"
                  checked={formData.auto_status_enabled}
                  onChange={(checked) => setFormData(prev => ({ ...prev, auto_status_enabled: checked }))}
                />
                {formData.auto_status_enabled && (
                  <div className="flex items-center gap-1.5 pl-4 pb-1">
                    <Label className="text-[10px] text-muted-foreground">Concluir após</Label>
                    <Input type="number" value={formData.auto_complete_minutes} onChange={(e) => setFormData(prev => ({ ...prev, auto_complete_minutes: Number(e.target.value) }))} min={5} max={60} className="w-14 h-6 text-[10px]" />
                    <span className="text-[10px] text-muted-foreground">min</span>
                  </div>
                )}

                <div className="border-t my-1" />

                <TRow
                  id="allow_any_professional"
                  label='Permitir "qualquer profissional"'
                  tip="Cliente pode escolher 'qualquer profissional disponível'"
                  checked={formData.allow_any_professional}
                  onChange={(checked) => updateField('allow_any_professional', checked)}
                />
                <TRow
                  id="show_subscription_plans"
                  label="Exibir planos de assinatura"
                  tip="Banner na página de agendamento sobre planos do Clube"
                  checked={formData.show_subscription_plans}
                  onChange={(checked) => updateField('show_subscription_plans', checked)}
                />

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs">Cancelar até</Label>
                    <Tip text="Horas antes que o cliente pode cancelar" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Input type="number" min={0} max={168} value={formData.cancellation_hours_limit} onChange={(e) => updateField('cancellation_hours_limit', Number(e.target.value))} className="w-14 h-6 text-[10px]" />
                    <span className="text-[10px] text-muted-foreground">h</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Pagamentos */}
        <div className="border rounded-lg bg-card overflow-hidden">
          <Accordion type="multiple" defaultValue={["payments"]}>
            <AccordionItem value="payments" className="border-0">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <SectionHead icon={DollarSign} label="Pagamentos">
                  <StatusBadge active={formData.require_deposit || formData.send_pix_payment} />
                </SectionHead>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 space-y-2">
                {/* Depósito */}
                <TRow
                  id="require_deposit"
                  label="Exigir sinal"
                  tip="Cliente paga valor antecipado para confirmar"
                  checked={formData.require_deposit}
                  onChange={(checked) => updateField('require_deposit', checked)}
                />
                {formData.require_deposit && (
                  <div className="flex items-center gap-1.5 pl-4 pb-1">
                    <Input type="number" min={1} max={100} value={formData.default_deposit_percentage} onChange={(e) => updateField('default_deposit_percentage', Number(e.target.value))} className="w-14 h-6 text-[10px]" />
                    <span className="text-[10px] text-muted-foreground">% do total</span>
                  </div>
                )}

                <div className="border-t my-1" />

                {/* PIX */}
                <TRow
                  id="send_pix_payment"
                  label="Cobrança PIX automática"
                  tip="Cliente recebe cobrança PIX via WhatsApp"
                  checked={formData.send_pix_payment}
                  onChange={(checked) => updateField('send_pix_payment', checked)}
                />
                {formData.send_pix_payment && (
                  <div className="space-y-2 pt-1">
                    <div className="grid gap-1.5 grid-cols-2">
                      <div className="space-y-0.5">
                        <Label className="text-[10px]">Tipo</Label>
                        <Select value={formData.pix_key_type} onValueChange={(v) => updateField('pix_key_type', v)}>
                          <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="random">Aleatória</SelectItem>
                            <SelectItem value="cpf">CPF</SelectItem>
                            <SelectItem value="cnpj">CNPJ</SelectItem>
                            <SelectItem value="email">E-mail</SelectItem>
                            <SelectItem value="phone">Telefone</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-[10px]">Chave PIX</Label>
                        <Input value={formData.pix_key} onChange={(e) => updateField('pix_key', e.target.value)} className="h-7 text-[10px]"
                          placeholder={formData.pix_key_type === 'cpf' ? '000.000.000-00' : formData.pix_key_type === 'cnpj' ? '00.000.000/0000-00' : formData.pix_key_type === 'email' ? 'email@ex.com' : formData.pix_key_type === 'phone' ? '(11) 99999-9999' : 'UUID'} />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-[10px]">Recebedor</Label>
                      <Input value={formData.pix_recipient_name} onChange={(e) => updateField('pix_recipient_name', e.target.value)} placeholder="Nome" className="h-7 text-[10px]" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-[10px]">Mensagem</Label>
                      <Textarea value={formData.pix_payment_message} onChange={(e) => updateField('pix_payment_message', e.target.value)} rows={3} className="text-[10px] min-h-0" />
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] text-muted-foreground">{'{cliente}'}, {'{profissional}'}, {'{servico}'}, {'{data}'}, {'{horario}'}, {'{valor}'}</p>
                        <Button type="button" variant="ghost" size="sm" className="text-[10px] text-muted-foreground h-5 px-1" onClick={() => updateField('pix_payment_message', DEFAULT_SETTINGS.pix_payment_message)}>🔄</Button>
                      </div>
                    </div>
                    {!formData.pix_key && (
                      <p className="text-[10px] text-destructive">⚠️ Chave PIX obrigatória</p>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Avaliações + Google Review */}
        <div className="border rounded-lg bg-card overflow-hidden">
          <Accordion type="multiple" defaultValue={["reviews"]}>
            <AccordionItem value="reviews" className="border-0">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <SectionHead icon={Star} label="Avaliações">
                  <StatusBadge active={formData.enable_professional_reviews} />
                </SectionHead>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 space-y-2">
                <TRow
                  id="enable_professional_reviews_section"
                  label="Sistema de avaliações"
                  tip="Clientes recebem link para avaliar o profissional"
                  checked={formData.enable_professional_reviews}
                  onChange={(checked) => updateField('enable_professional_reviews', checked)}
                />

                {formData.enable_professional_reviews && (
                  <div className="space-y-2 pt-1">
                    <Textarea value={formData.review_message_template} onChange={(e) => updateField('review_message_template', e.target.value)} rows={2} className="text-[10px] min-h-0" placeholder="Template de avaliação..." />
                    <p className="text-[9px] text-muted-foreground">{'{cliente}'}, {'{profissional}'}, {'{servico}'}, {'{data}'}, {'{link}'}</p>

                    <div className="grid gap-1.5 grid-cols-3">
                      <div className="space-y-0.5">
                        <Label className="text-[10px]">Enviar após</Label>
                        <div className="flex items-center gap-0.5">
                          <Input type="number" min={0} max={1440} value={formData.review_delay_minutes} onChange={(e) => updateField('review_delay_minutes', Number(e.target.value))} className="w-12 h-6 text-[10px]" />
                          <span className="text-[9px] text-muted-foreground">min</span>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-[10px]">Expira em</Label>
                        <div className="flex items-center gap-0.5">
                          <Input type="number" min={1} max={30} value={formData.review_expiry_days} onChange={(e) => updateField('review_expiry_days', Number(e.target.value))} className="w-12 h-6 text-[10px]" />
                          <span className="text-[9px] text-muted-foreground">dias</span>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-[10px]">Público</Label>
                        <div className="h-6 flex items-center">
                          <Switch checked={formData.show_public_reviews} onCheckedChange={(checked) => updateField('show_public_reviews', checked)} className="scale-75" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Google Review */}
                <div className="border-t pt-2 space-y-1.5">
                  <div className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3 text-primary" />
                    <Label className="text-[10px] font-semibold">Google Review</Label>
                    <Tip text="Link de avaliação Google Maps" />
                  </div>
                  <Input type="url" placeholder="https://search.google.com/local/..." value={formData.google_review_url} onChange={(e) => { updateField('google_review_url', e.target.value); setShortenedUrl(null); }} className="h-7 text-[10px]" />
                  <p className="text-[9px] text-muted-foreground">Use <code className="bg-muted px-0.5 rounded">{'{google_review}'}</code> nos templates</p>

                  {formData.google_review_url && (
                    <div className="space-y-1.5 rounded-md border bg-muted/30 p-2">
                      <div className="flex items-center gap-1.5">
                        <Button type="button" variant="outline" size="sm" className="h-5 text-[10px] px-1.5" onClick={handleShortenUrl} disabled={isShortening || !!shortenedUrl}>
                          {isShortening ? <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" /> : <Link2 className="h-2.5 w-2.5 mr-0.5" />}
                          {shortenedUrl ? '✓' : 'Encurtar'}
                        </Button>
                        <a href={formData.google_review_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                          <ExternalLink className="h-2.5 w-2.5" /> Abrir
                        </a>
                      </div>
                      {shortenedUrl && (
                        <div className="flex items-center gap-1 text-[10px]">
                          <code className="bg-background px-1 py-0.5 rounded border text-[9px] break-all flex-1">{shortenedUrl}</code>
                          <Button type="button" variant="ghost" size="sm" className="h-5 text-[10px] px-1" onClick={() => { navigator.clipboard.writeText(shortenedUrl); toast.success('Copiado!'); }}>📋</Button>
                        </div>
                      )}
                      <div className="border-t pt-1.5 flex items-center gap-1.5">
                        <Label className="text-[10px]">📱 Teste</Label>
                        <Input type="tel" placeholder="(11) 99999-9999" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="flex-1 h-6 text-[10px]" />
                        <Button type="button" variant="default" size="sm" onClick={handleTestReview} disabled={!testPhone || isSendingTest} className="bg-green-600 hover:bg-green-700 text-white h-6 text-[10px] px-2">
                          {isSendingTest ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Send className="h-2.5 w-2.5" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Row 3: WhatsApp (full width) */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <Accordion type="multiple" defaultValue={["whatsapp"]}>
          <AccordionItem value="whatsapp" className="border-0">
            <AccordionTrigger className="px-3 py-2 hover:no-underline">
              <SectionHead icon={MessageSquare} label="Comunicação (WhatsApp)">
                <StatusBadge active={hasConnectedWhatsApp} activeText="Conectado" inactiveText="Desconectado" />
              </SectionHead>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-2">
              {/* Status alert compacto */}
              {!isLoadingModules && !isLoadingWhatsApp && (
                <>
                  {!hasWhatsAppModule ? (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded-md px-2 py-1.5">
                      <Lock className="h-3 w-3 shrink-0" />
                      <span>Módulo WhatsApp não disponível.</span>
                      <Button variant="outline" size="sm" asChild className="h-5 text-[10px] px-1.5 border-amber-500/50 ml-auto">
                        <Link to="/dashboard/subscription"><ArrowUpCircle className="h-2.5 w-2.5 mr-0.5" />Planos</Link>
                      </Button>
                    </div>
                  ) : hasConnectedWhatsApp ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/30 rounded-md px-2 py-1.5">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      <span>WhatsApp conectado — pronto para notificações.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-2 py-1.5">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>WhatsApp não conectado.</span>
                      <Button variant="outline" size="sm" asChild className="h-5 text-[10px] px-1.5 ml-auto"><Link to="/dashboard/whatsapp">Configurar</Link></Button>
                    </div>
                  )}
                </>
              )}

              {/* Grid 3 colunas: Confirmação | Lembrete | Satisfação */}
              <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                {/* Confirmação */}
                <div className="space-y-1.5">
                  <TRow id="send_confirmation_message" label="Confirmação" tip="Envia ao confirmar agendamento" checked={formData.send_confirmation_message} onChange={(checked) => updateField('send_confirmation_message', checked)} />
                  {formData.send_confirmation_message && (
                    <div className="space-y-1">
                      <Textarea value={formData.confirmation_message_template} onChange={(e) => updateField('confirmation_message_template', e.target.value)} rows={4} className="text-[10px] min-h-0" />
                      <Button type="button" variant="ghost" size="sm" className="text-[10px] text-muted-foreground h-5 px-1" onClick={() => updateField('confirmation_message_template', DEFAULT_SETTINGS.confirmation_message_template)}>🔄 Restaurar</Button>
                    </div>
                  )}
                </div>

                {/* Lembrete */}
                <div className="space-y-1.5">
                  <TRow id="send_reminder_message" label="Lembrete" tip="Lembra o cliente antes do horário" checked={formData.send_reminder_message} onChange={(checked) => updateField('send_reminder_message', checked)} />
                  {formData.send_reminder_message && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Input type="number" min={1} max={48} value={formData.reminder_hours_before} onChange={(e) => updateField('reminder_hours_before', Number(e.target.value))} className="w-12 h-6 text-[10px]" />
                        <span className="text-[10px] text-muted-foreground">h antes</span>
                      </div>
                      <Textarea value={formData.reminder_message_template} onChange={(e) => updateField('reminder_message_template', e.target.value)} rows={4} className="text-[10px] min-h-0" />
                      <Button type="button" variant="ghost" size="sm" className="text-[10px] text-muted-foreground h-5 px-1" onClick={() => updateField('reminder_message_template', DEFAULT_SETTINGS.reminder_message_template)}>🔄 Restaurar</Button>
                    </div>
                  )}
                </div>

                {/* Satisfação */}
                <div className="space-y-1.5">
                  <TRow id="send_satisfaction_survey" label="Satisfação" tip="Pesquisa simples de avaliação" checked={formData.send_satisfaction_survey} onChange={(checked) => updateField('send_satisfaction_survey', checked)} />
                  {formData.send_satisfaction_survey && (
                    <div className="space-y-1">
                      <Textarea value={formData.satisfaction_message_template} onChange={(e) => updateField('satisfaction_message_template', e.target.value)} rows={4} className="text-[10px] min-h-0" />
                      <Button type="button" variant="ghost" size="sm" className="text-[10px] text-muted-foreground h-5 px-1" onClick={() => updateField('satisfaction_message_template', DEFAULT_SETTINGS.satisfaction_message_template)}>🔄 Restaurar</Button>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[9px] text-muted-foreground border-t pt-1.5">
                Variáveis: {'{cliente}'}, {'{profissional}'}, {'{servico}'}, {'{data}'}, {'{horario}'}, {'{valor}'}
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Botão salvar mobile */}
      <div className="md:hidden">
        <Button onClick={handleSave} disabled={isSaving} className="w-full h-9">
          {isSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
