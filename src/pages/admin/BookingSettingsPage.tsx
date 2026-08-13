import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useBooking, BookingSettings } from '@/hooks/useBooking';
import { useWhatsAppStatus } from '@/hooks/useWhatsAppStatus';
import { useStoreModules } from '@/hooks/useStoreModules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, Settings, DollarSign, MessageSquare, HelpCircle, Save, Loader2, Star, CheckCircle2, AlertTriangle, Lock, ArrowUpCircle, ExternalLink, Link2, Send, MapPin, Zap, CreditCard, FlaskConical, Palette } from 'lucide-react';
import { MapLocationPicker } from '@/components/admin/store-config/MapLocationPicker';
import { BusinessHoursManager } from '@/components/admin/store-config/BusinessHoursManager';
import type { PixKeyType } from '@/utils/pixValidation';
import { BotTimezoneCard } from '@/components/admin/bot/BotTimezoneCard';
import { BookingAppearancePanel } from '@/components/admin/booking/BookingAppearancePanel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DEFAULT_SETTINGS: Omit<BookingSettings, 'id' | 'store_id' | 'created_at' | 'updated_at'> = {
  slot_interval_minutes: 30,
  max_advance_days: 30,
  min_advance_hours: 2,
  allow_any_professional: true,
  cancellation_hours_limit: 24,
  require_deposit: false,
  default_deposit_percentage: 30,
  send_confirmation_message: true,
  confirmation_message_template: '✅ *Agendamento confirmado com sucesso!*\n\nOlá *{cliente}*, tudo certo por aqui! 🎉\n\n📋 *Resumo do seu horário:*\n👤 Profissional: *{profissional}*\n💇 Serviço: *{servico}*\n📅 Data: *{data}*\n🕐 Horário: *{horario}*\n💰 Valor: *{valor}*\n\n🔗 *Gerencie seu agendamento (remarcar/cancelar):*\n{link}\n\n📌 *Dicas importantes:*\n• Chegue 5 minutos antes do horário\n• Em caso de imprevisto, avise com antecedência\n\nEstamos ansiosos para te atender! 😊',
  reschedule_message_template: '🔄 *Horário atualizado!*\n\nOlá *{cliente}*, seu agendamento anterior foi cancelado automaticamente e agora vale apenas o novo horário abaixo. 👇',
  send_reminder_message: true,
  reminder_hours_before: 2,
  reminder_message_template: '⏰ *Faltam poucas horas para seu atendimento!*\n\nOlá *{cliente}*, tudo bem? 👋\n\nSó passando para lembrar do seu horário:\n\n👤 Profissional: *{profissional}*\n💇 Serviço: *{servico}*\n📅 Data: *{data}*\n🕐 Horário: *{horario}*\n💰 Valor: *{valor}*\n\nSe precisar remarcar ou tirar alguma dúvida, é só responder esta mensagem. Te esperamos! 😊',
  send_satisfaction_survey: false,
  satisfaction_message_template: '⭐ *Sua opinião faz toda a diferença!*\n\nOlá *{cliente}*, obrigado por escolher a gente! 💛\n\nComo foi seu atendimento com *{profissional}*?\n\nResponda com uma nota de *1 a 5* — leva menos de 10 segundos e nos ajuda muito a melhorar! 💬',
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
  theme_primary_color: '#f97316',
  theme_background_color: '#ffffff',
  theme_text_color: '#0f172a',
  theme_mode: 'light',
  theme_font_family: 'inter',
  theme_radius: '0.5rem',
  embed_hide_header: true,
};

type SectionKey = 'agenda' | 'regras' | 'localizacao' | 'aparencia' | 'automacao' | 'comunicacao' | 'pagamentos' | 'avaliacoes' | 'testes';

const SECTIONS: { key: SectionKey; label: string; icon: any; description: string }[] = [
  { key: 'agenda', label: 'Agenda', icon: Clock, description: 'Horários de funcionamento' },
  { key: 'regras', label: 'Regras', icon: Settings, description: 'Intervalos e limites' },
  { key: 'localizacao', label: 'Localização', icon: MapPin, description: 'Endereço e fuso horário' },
  { key: 'aparencia', label: 'Aparência', icon: Palette, description: 'Tema e embed da página pública' },
  { key: 'automacao', label: 'Automação', icon: Zap, description: 'Status e opções gerais' },
  { key: 'comunicacao', label: 'Comunicação', icon: MessageSquare, description: 'WhatsApp e notificações' },
  { key: 'pagamentos', label: 'Pagamentos', icon: CreditCard, description: 'Sinal e PIX' },
  { key: 'avaliacoes', label: 'Avaliações', icon: Star, description: 'Avaliações de profissionais' },
  { key: 'testes', label: 'Testes', icon: FlaskConical, description: 'Enviar notificações de teste' },
];

export default function BookingSettingsPage() {
  const { storeId } = useStoreAccess();
  const { bookingSettings, updateSettings } = useBooking(storeId);
  const { hasConnectedWhatsApp, isLoading: isLoadingWhatsApp } = useWhatsAppStatus(storeId);
  const { hasModule, loading: isLoadingModules } = useStoreModules(storeId);

  const hasWhatsAppModule = hasModule('whatsapp_connection') || hasModule('whatsapp_chat') || hasModule('whatsapp_recovery');

  const [activeSection, setActiveSection] = useState<SectionKey>('agenda');
  const [formData, setFormData] = useState(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [shortenedUrl, setShortenedUrl] = useState<string | null>(null);
  const [isShortening, setIsShortening] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [sendingTestType, setSendingTestType] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [storeLocation, setStoreLocation] = useState<{ latitude: number | null; longitude: number | null; address: string; business_hours: any; slug: string; name: string; theme_colors: any }>({
    latitude: null, longitude: null, address: '', business_hours: {}, slug: '', name: '', theme_colors: {}
  });
  const [isLoadingStore, setIsLoadingStore] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    const loadStore = async () => {
      setIsLoadingStore(true);
      const { data } = await supabase
        .from('stores')
        .select('latitude, longitude, address, business_hours, slug, name, theme_colors')
        .eq('id', storeId)
        .single();
      if (data) {
        setStoreLocation({
          latitude: data.latitude, longitude: data.longitude,
          address: data.address || '', business_hours: data.business_hours || {},
          slug: data.slug || '', name: data.name || '', theme_colors: data.theme_colors || {}
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
        theme_primary_color: (bookingSettings as any).theme_primary_color ?? DEFAULT_SETTINGS.theme_primary_color,
        theme_background_color: (bookingSettings as any).theme_background_color ?? DEFAULT_SETTINGS.theme_background_color,
        theme_text_color: (bookingSettings as any).theme_text_color ?? DEFAULT_SETTINGS.theme_text_color,
        theme_mode: (bookingSettings as any).theme_mode ?? DEFAULT_SETTINGS.theme_mode,
        theme_font_family: (bookingSettings as any).theme_font_family ?? DEFAULT_SETTINGS.theme_font_family,
        theme_radius: (bookingSettings as any).theme_radius ?? DEFAULT_SETTINGS.theme_radius,
        embed_hide_header: (bookingSettings as any).embed_hide_header ?? DEFAULT_SETTINGS.embed_hide_header,
      });
    }
  }, [bookingSettings]);

  const handleSave = async () => {
    if (!storeId) return;
    setIsSaving(true);
    try { await updateSettings({ store_id: storeId, ...formData }); } finally { setIsSaving(false); }
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
      setShortenedUrl(`${window.location.origin}/r/${data.id}`);
      toast.success('Link encurtado!');
    } catch { toast.error('Erro ao encurtar link'); } finally { setIsShortening(false); }
  }, [formData.google_review_url, storeId]);

  const handleTestReview = useCallback(async () => {
    if (!testPhone) { toast.error('Informe o número'); return; }
    if (!storeId) { toast.error('Loja não identificada'); return; }
    const reviewUrl = shortenedUrl || formData.google_review_url;
    if (!reviewUrl) { toast.error('Configure o link primeiro'); return; }
    setIsSendingTest(true);
    try {
      const normalizedPhone = testPhone.replace(/\D/g, '');
      const phoneWithCountry = normalizedPhone.startsWith('55') ? normalizedPhone : `55${normalizedPhone}`;
      const remoteJid = `${phoneWithCountry}@s.whatsapp.net`;
      const message = `⭐ *Teste de Avaliação*\n\nOlá! Este é um teste.\n\n👉 ${reviewUrl}\n\nObrigado! 😊`;
      const { data: storeData } = await supabase.from('stores').select('logo_url').eq('id', storeId).single();
      const logoUrl = storeData?.logo_url || null;
      const { data, error } = await supabase.functions.invoke('whatsapp-chat-send', {
        body: { storeId, remoteJid, content: message, messageType: logoUrl ? 'image' : 'text', ...(logoUrl ? { mediaUrl: logoUrl } : {}) }
      });
      if (error) throw new Error(error.message || 'Erro');
      if (data?.error) throw new Error(data.error);
      toast.success('Mensagem enviada!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar');
    } finally { setIsSendingTest(false); }
  }, [testPhone, shortenedUrl, formData.google_review_url, storeId]);

  // --- Helpers ---
  const Tip = ({ text }: { text: string }) => (
    <Tooltip>
      <TooltipTrigger asChild><HelpCircle className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" /></TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs"><p>{text}</p></TooltipContent>
    </Tooltip>
  );

  const TRow = ({ id, label, tip, checked, onChange, disabled }: { id: string; label: string; tip?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id} className="text-sm cursor-pointer">{label}</Label>
        {tip && <Tip text={tip} />}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );

  const SectionTitle = ({ title, description }: { title: string; description?: string }) => (
    <div className="mb-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
  );

  // Status badge for sidebar
  const getSectionStatus = (key: SectionKey): { active: boolean; label: string } | null => {
    switch (key) {
      case 'automacao': return { active: formData.auto_status_enabled, label: formData.auto_status_enabled ? 'Ativo' : 'Off' };
      case 'comunicacao': return { active: hasConnectedWhatsApp, label: hasConnectedWhatsApp ? 'Conectado' : 'Off' };
      case 'pagamentos': return { active: formData.require_deposit || formData.send_pix_payment, label: formData.require_deposit || formData.send_pix_payment ? 'Ativo' : 'Off' };
      case 'avaliacoes': return { active: formData.enable_professional_reviews, label: formData.enable_professional_reviews ? 'Ativo' : 'Off' };
      case 'localizacao': return { active: !!storeLocation.latitude, label: storeLocation.latitude ? 'Definida' : 'Pendente' };
      default: return null;
    }
  };

  // --- Section Renderers ---
  const renderAgenda = () => (
    <div>
      <SectionTitle title="Agenda e Disponibilidade" description="Configure os horários de funcionamento da sua loja" />
      <BusinessHoursManager value={storeLocation.business_hours || {}} onChange={handleBusinessHoursChange} />
    </div>
  );

  const renderRegras = () => (
    <div>
      <SectionTitle title="Regras de Agendamento" description="Defina intervalos, limites e antecedências" />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Intervalo entre horários</Label>
            <Tip text="Intervalo entre cada horário disponível. Ex: 30min = 09:00, 09:30, 10:00..." />
          </div>
          <Select value={String(formData.slot_interval_minutes)} onValueChange={(v) => updateField('slot_interval_minutes', Number(v))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutos</SelectItem>
              <SelectItem value="20">20 minutos</SelectItem>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="45">45 minutos</SelectItem>
              <SelectItem value="60">60 minutos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Antecedência máxima</Label>
            <Tip text="Quantos dias no futuro o cliente pode agendar" />
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" min={1} max={365} value={formData.max_advance_days} onChange={(e) => updateField('max_advance_days', Number(e.target.value))} className="w-20 h-9" />
            <span className="text-sm text-muted-foreground">dias</span>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Antecedência mínima</Label>
            <Tip text="Horas mínimas de antecedência para agendar" />
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" min={0} max={72} value={formData.min_advance_hours} onChange={(e) => updateField('min_advance_hours', Number(e.target.value))} className="w-20 h-9" />
            <span className="text-sm text-muted-foreground">horas</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLocalizacao = () => (
    <div>
      <SectionTitle title="Localização e Fuso Horário" description="Configure o endereço e fuso da sua loja" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Endereço</p>
          {storeLocation.latitude && storeLocation.longitude ? (
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">📍 {storeLocation.address || 'Localização definida'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {storeLocation.latitude?.toFixed(6)}, {storeLocation.longitude?.toFixed(6)}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={() => setShowMapPicker(true)}>Alterar</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowMapPicker(true)}>
              <MapPin className="h-4 w-4 mr-2" /> Selecionar no mapa
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
            tip="Inclui o link 'Como chegar' na mensagem de confirmação"
            checked={formData.send_location_in_confirmation}
            onChange={(checked) => updateField('send_location_in_confirmation', checked)}
            disabled={!storeLocation.latitude || !storeLocation.longitude}
          />
          {formData.send_location_in_confirmation && storeLocation.latitude && storeLocation.longitude && (
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
              💡 Use <code className="bg-muted px-1 rounded text-xs">{'{localizacao}'}</code> nos templates de mensagem
            </p>
          )}
          {(!storeLocation.latitude || !storeLocation.longitude) && (
            <p className="text-xs text-amber-600">⚠️ Defina a localização para habilitar esta opção.</p>
          )}
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Fuso horário</p>
          <BotTimezoneCard storeId={storeId} context="booking" />
        </div>
      </div>
    </div>
  );

  const renderAutomacao = () => (
    <div>
      <SectionTitle title="Automação e Opções Gerais" description="Configure comportamentos automáticos do sistema" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-sm font-medium mb-2">Automação de status</p>
          <TRow
            id="auto_status_enabled"
            label="Ativar automação de status"
            tip="O sistema detecta automaticamente quando um atendimento está em andamento ou finalizado"
            checked={formData.auto_status_enabled}
            onChange={(checked) => setFormData(prev => ({ ...prev, auto_status_enabled: checked }))}
          />
          {formData.auto_status_enabled && (
            <div className="flex items-center gap-2 px-3 py-2">
              <Label className="text-sm text-muted-foreground">Concluir após</Label>
              <Input type="number" value={formData.auto_complete_minutes} onChange={(e) => setFormData(prev => ({ ...prev, auto_complete_minutes: Number(e.target.value) }))} min={5} max={60} className="w-20 h-9" />
              <span className="text-sm text-muted-foreground">minutos</span>
            </div>
          )}
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-sm font-medium mb-2">Opções gerais</p>
          <TRow
            id="allow_any_professional"
            label='Permitir "qualquer profissional"'
            tip="Permite que o cliente escolha 'qualquer profissional disponível'"
            checked={formData.allow_any_professional}
            onChange={(checked) => updateField('allow_any_professional', checked)}
          />
          <TRow
            id="show_subscription_plans"
            label="Exibir planos de assinatura"
            tip="Mostra banner na página de agendamento sobre planos do Clube"
            checked={formData.show_subscription_plans}
            onChange={(checked) => updateField('show_subscription_plans', checked)}
          />
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm">Limite para cancelamento</Label>
              <Tip text="Até quantas horas antes o cliente pode cancelar" />
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" min={0} max={168} value={formData.cancellation_hours_limit} onChange={(e) => updateField('cancellation_hours_limit', Number(e.target.value))} className="w-20 h-9" />
              <span className="text-sm text-muted-foreground">h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderComunicacao = () => (
    <div>
      <SectionTitle title="Comunicação (WhatsApp)" description="Configure mensagens automáticas de notificação" />

      {/* Status */}
      {!isLoadingModules && !isLoadingWhatsApp && (
        <div className="mb-4">
          {!hasWhatsAppModule ? (
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2.5">
              <Lock className="h-4 w-4 shrink-0" />
              <span>Módulo WhatsApp não disponível.</span>
              <Button variant="outline" size="sm" asChild className="ml-auto h-7 text-xs border-amber-500/50">
                <Link to="/dashboard/subscription"><ArrowUpCircle className="h-3.5 w-3.5 mr-1" />Ver Planos</Link>
              </Button>
            </div>
          ) : hasConnectedWhatsApp ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>WhatsApp conectado — pronto para notificações automáticas.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>WhatsApp não conectado.</span>
              <Button variant="outline" size="sm" asChild className="ml-auto h-7 text-xs">
                <Link to="/dashboard/whatsapp">Configurar</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Aviso de reagendamento */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <Label className="text-sm font-medium">Aviso de reagendamento</Label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          🔄 Texto adicionado <strong>no topo da mensagem de confirmação</strong> apenas quando o cliente reagenda pelo link. Explica que o horário anterior foi cancelado automaticamente e que vale somente o novo. Deixe vazio para não enviar aviso.
        </p>
        <Textarea value={formData.reschedule_message_template} onChange={(e) => updateField('reschedule_message_template', e.target.value)} rows={4} className="text-xs" />
        <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => updateField('reschedule_message_template', DEFAULT_SETTINGS.reschedule_message_template)}>🔄 Restaurar padrão</Button>
      </div>

      {/* Templates grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Confirmação */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <TRow id="send_confirmation_message" label="Confirmação de agendamento" tip="Envia mensagem quando o agendamento é confirmado" checked={formData.send_confirmation_message} onChange={(checked) => updateField('send_confirmation_message', checked)} />
          <p className="text-xs text-muted-foreground leading-relaxed">
            📩 Enviada <strong>1 única vez</strong>, logo após o cliente concluir o agendamento. Traz o resumo do horário e serve para confirmar que o pedido foi recebido — reduz faltas e dúvidas iniciais.
          </p>
          {formData.send_confirmation_message && (
            <div className="space-y-2">
              <Textarea value={formData.confirmation_message_template} onChange={(e) => updateField('confirmation_message_template', e.target.value)} rows={5} className="text-xs" />
              <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => updateField('confirmation_message_template', DEFAULT_SETTINGS.confirmation_message_template)}>🔄 Restaurar padrão</Button>
            </div>
          )}
        </div>

        {/* Lembrete */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <TRow id="send_reminder_message" label="Lembrete de agendamento" tip="Envia mensagem lembrando o cliente" checked={formData.send_reminder_message} onChange={(checked) => updateField('send_reminder_message', checked)} />
          <p className="text-xs text-muted-foreground leading-relaxed">
            ⏰ Enviada <strong>algumas horas antes</strong> do horário marcado (você escolhe abaixo). Diminui muito o índice de <em>no-show</em> (cliente que não aparece). Recomendado: <strong>2h antes</strong>.
          </p>
          {formData.send_reminder_message && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Label className="text-xs text-muted-foreground">Enviar</Label>
                <Input type="number" min={1} max={48} value={formData.reminder_hours_before} onChange={(e) => updateField('reminder_hours_before', Number(e.target.value))} className="w-16 h-8 text-xs" />
                <span className="text-xs text-muted-foreground">h antes</span>
              </div>
              <Textarea value={formData.reminder_message_template} onChange={(e) => updateField('reminder_message_template', e.target.value)} rows={5} className="text-xs" />
              <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => updateField('reminder_message_template', DEFAULT_SETTINGS.reminder_message_template)}>🔄 Restaurar padrão</Button>
            </div>
          )}
        </div>

        {/* Satisfação */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <TRow id="send_satisfaction_survey" label="Pesquisa de satisfação" tip="Pesquisa simples de avaliação por nota" checked={formData.send_satisfaction_survey} onChange={(checked) => updateField('send_satisfaction_survey', checked)} />
          <p className="text-xs text-muted-foreground leading-relaxed">
            ⭐ Enviada <strong>após o atendimento ser concluído</strong>. Pede uma nota rápida de 1 a 5 para medir a experiência do cliente. Ideal para acompanhar a qualidade do time.
          </p>
          {formData.send_satisfaction_survey && (
            <div className="space-y-2">
              <Textarea value={formData.satisfaction_message_template} onChange={(e) => updateField('satisfaction_message_template', e.target.value)} rows={5} className="text-xs" />
              <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => updateField('satisfaction_message_template', DEFAULT_SETTINGS.satisfaction_message_template)}>🔄 Restaurar padrão</Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
        <p className="text-xs font-medium text-foreground">💡 Variáveis que você pode usar nas mensagens:</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <code className="bg-muted px-1 rounded">{'{cliente}'}</code> nome do cliente ·{' '}
          <code className="bg-muted px-1 rounded">{'{profissional}'}</code> nome do profissional ·{' '}
          <code className="bg-muted px-1 rounded">{'{servico}'}</code> serviço agendado ·{' '}
          <code className="bg-muted px-1 rounded">{'{data}'}</code> data ·{' '}
          <code className="bg-muted px-1 rounded">{'{horario}'}</code> hora ·{' '}
          <code className="bg-muted px-1 rounded">{'{valor}'}</code> valor do serviço ·{' '}
          <code className="bg-muted px-1 rounded">{'{link}'}</code> link mágico do agendamento (cliente remarca/cancela) ·{' '}
          <code className="bg-muted px-1 rounded">{'{localizacao}'}</code> link "como chegar"
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          As variáveis são substituídas automaticamente no momento do envio. Você também pode usar <strong>negrito</strong> colocando o texto entre asteriscos: <code className="bg-muted px-1 rounded">*texto*</code>.
        </p>
      </div>
    </div>
  );



  const renderPagamentos = () => (
    <div>
      <SectionTitle title="Pagamentos" description="Configure sinal e cobrança PIX automática" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Sinal */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Sinal / Depósito</p>
          <TRow
            id="require_deposit"
            label="Exigir sinal para agendar"
            tip="O cliente precisa pagar um valor antecipado para confirmar"
            checked={formData.require_deposit}
            onChange={(checked) => updateField('require_deposit', checked)}
          />
          {formData.require_deposit && (
            <div className="flex items-center gap-2 px-3">
              <Label className="text-sm">Porcentagem</Label>
              <Input type="number" min={1} max={100} value={formData.default_deposit_percentage} onChange={(e) => updateField('default_deposit_percentage', Number(e.target.value))} className="w-20 h-9" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          )}
        </div>

        {/* PIX */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Cobrança PIX</p>
          <TRow
            id="send_pix_payment"
            label="Enviar cobrança PIX automática"
            tip="Cliente recebe solicitação de pagamento PIX via WhatsApp"
            checked={formData.send_pix_payment}
            onChange={(checked) => updateField('send_pix_payment', checked)}
          />
          {formData.send_pix_payment && (
            <div className="space-y-3 pt-1">
              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo da Chave</Label>
                  <Select value={formData.pix_key_type} onValueChange={(v) => updateField('pix_key_type', v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">Aleatória</SelectItem>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Chave PIX</Label>
                  <Input value={formData.pix_key} onChange={(e) => updateField('pix_key', e.target.value)} className="h-9"
                    placeholder={formData.pix_key_type === 'cpf' ? '000.000.000-00' : formData.pix_key_type === 'cnpj' ? '00.000.000/0000-00' : formData.pix_key_type === 'email' ? 'email@exemplo.com' : formData.pix_key_type === 'phone' ? '(11) 99999-9999' : 'UUID'} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nome do recebedor</Label>
                <Input value={formData.pix_recipient_name} onChange={(e) => updateField('pix_recipient_name', e.target.value)} placeholder="Nome na cobrança" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mensagem da cobrança</Label>
                <Textarea value={formData.pix_payment_message} onChange={(e) => updateField('pix_payment_message', e.target.value)} rows={4} className="text-xs" />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{'{cliente}'}, {'{profissional}'}, {'{servico}'}, {'{data}'}, {'{horario}'}, {'{valor}'}</p>
                  <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => updateField('pix_payment_message', DEFAULT_SETTINGS.pix_payment_message)}>🔄 Restaurar</Button>
                </div>
              </div>
              {!formData.pix_key && (
                <p className="text-xs text-destructive px-1">⚠️ Informe sua chave PIX para que a cobrança funcione.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAvaliacoes = () => (
    <div>
      <SectionTitle title="Avaliações de Profissionais" description="Configure o sistema de avaliação de atendimentos" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Sistema de avaliações</p>
          <TRow
            id="enable_professional_reviews_section"
            label="Habilitar avaliações"
            tip="Clientes recebem um link para avaliar o profissional após o atendimento"
            checked={formData.enable_professional_reviews}
            onChange={(checked) => updateField('enable_professional_reviews', checked)}
          />
          {formData.enable_professional_reviews && (
            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Template da mensagem</Label>
                <Textarea value={formData.review_message_template} onChange={(e) => updateField('review_message_template', e.target.value)} rows={3} className="text-xs" />
                <p className="text-xs text-muted-foreground">{'{cliente}'}, {'{profissional}'}, {'{servico}'}, {'{data}'}, {'{link}'}</p>
              </div>
              <div className="grid gap-3 grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Enviar após</Label>
                  <div className="flex items-center gap-1.5">
                    <Input type="number" min={0} max={1440} value={formData.review_delay_minutes} onChange={(e) => updateField('review_delay_minutes', Number(e.target.value))} className="w-16 h-9" />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Link expira em</Label>
                  <div className="flex items-center gap-1.5">
                    <Input type="number" min={1} max={30} value={formData.review_expiry_days} onChange={(e) => updateField('review_expiry_days', Number(e.target.value))} className="w-16 h-9" />
                    <span className="text-xs text-muted-foreground">dias</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Exibir publicamente</Label>
                  <div className="flex items-center h-9">
                    <Switch checked={formData.show_public_reviews} onCheckedChange={(checked) => updateField('show_public_reviews', checked)} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Google Review */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Google Review</p>
            <Tip text="Link de avaliação da sua loja no Google Maps" />
          </div>
          <div className="space-y-2">
            <Input type="url" placeholder="https://search.google.com/local/writereview?placeid=..." value={formData.google_review_url} onChange={(e) => { updateField('google_review_url', e.target.value); setShortenedUrl(null); }} className="h-9" />
            <p className="text-xs text-muted-foreground">
              Use <code className="bg-muted px-1 rounded">{'{google_review}'}</code> nos templates
            </p>
          </div>
          {formData.google_review_url && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={handleShortenUrl} disabled={isShortening || !!shortenedUrl}>
                  {isShortening ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Link2 className="h-3 w-3 mr-1" />}
                  {shortenedUrl ? 'Encurtado ✓' : 'Encurtar link'}
                </Button>
                <a href={formData.google_review_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Abrir
                </a>
              </div>
              {shortenedUrl && (
                <div className="flex items-center gap-2 text-xs">
                  <code className="bg-background px-2 py-1 rounded border break-all flex-1">{shortenedUrl}</code>
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(shortenedUrl); toast.success('Copiado!'); }}>📋 Copiar</Button>
                </div>
              )}
              <div className="border-t pt-2 space-y-1.5">
                <Label className="text-xs font-medium">📱 Testar via WhatsApp</Label>
                <div className="flex items-center gap-2">
                  <Input type="tel" placeholder="(11) 99999-9999" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="flex-1 h-8 text-xs" />
                  <Button type="button" variant="default" size="sm" onClick={handleTestReview} disabled={!testPhone || isSendingTest} className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs">
                    {isSendingTest ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // --- Send test notification helper ---
  const sendTestNotification = useCallback(async (type: string) => {
    if (!testPhone) { toast.error('Informe o número de WhatsApp'); return; }
    if (!storeId) { toast.error('Loja não identificada'); return; }
    setSendingTestType(type);
    try {
      const normalizedPhone = testPhone.replace(/\D/g, '');
      const phoneWithCountry = normalizedPhone.startsWith('55') ? normalizedPhone : `55${normalizedPhone}`;
      const remoteJid = `${phoneWithCountry}@s.whatsapp.net`;

      // Encurtar link de localização para uso no template
      let locationShortLink = 'https://exemplo.com/localizacao';
      if (storeLocation.latitude && storeLocation.longitude) {
        const fullLocUrl = `https://mostralo.com.br/navegar?lat=${storeLocation.latitude}&lng=${storeLocation.longitude}${storeLocation.slug ? `&store=${encodeURIComponent(storeLocation.slug)}` : ''}${storeLocation.address ? `&address=${encodeURIComponent(storeLocation.address)}` : ''}`;
        locationShortLink = fullLocUrl;
        try {
          const { data: shortData } = await supabase.functions.invoke('short-link', {
            body: { action: 'create_url', targetUrl: fullLocUrl, storeSlug: storeId || 'general' }
          });
          if (shortData?.success && shortData?.id) {
            locationShortLink = `https://mostralo.com.br/r/${shortData.id}`;
          }
        } catch (e) {
          console.warn('Falha ao encurtar link de localização:', e);
        }
      }

      const sampleVars: Record<string, string> = {
        '{cliente}': 'João Teste',
        '{profissional}': 'Carlos Barbeiro',
        '{servico}': 'Corte Masculino',
        '{data}': new Date().toLocaleDateString('pt-BR'),
        '{horario}': '14:30',
        '{valor}': 'R$ 50,00',
        '{link}': shortenedUrl || formData.google_review_url || 'https://exemplo.com/avaliar',
        '{google_review}': shortenedUrl || formData.google_review_url || 'https://exemplo.com/avaliar',
        '{localizacao}': locationShortLink,
      };

      const replaceVars = (template: string) => {
        let result = template;
        Object.entries(sampleVars).forEach(([key, value]) => { result = result.split(key).join(value); });
        return result;
      };

      let message = '';
      switch (type) {
        case 'confirmation':
          message = replaceVars(formData.confirmation_message_template);
          break;
        case 'reminder':
          message = replaceVars(formData.reminder_message_template);
          break;
        case 'satisfaction':
          message = replaceVars(formData.satisfaction_message_template);
          break;
        case 'review':
          message = replaceVars(formData.review_message_template);
          break;
        case 'pix':
          message = replaceVars(formData.pix_payment_message);
          break;
        default:
          message = `🧪 *Teste de Notificação*\n\nEsta é uma mensagem de teste do sistema de agendamento.`;
      }

      const { data: storeData } = await supabase.from('stores').select('logo_url').eq('id', storeId).single();
      const logoUrl = storeData?.logo_url || null;
      const { data, error } = await supabase.functions.invoke('whatsapp-chat-send', {
        body: { storeId, remoteJid, content: message, messageType: logoUrl ? 'image' : 'text', ...(logoUrl ? { mediaUrl: logoUrl } : {}) }
      });
      if (error) throw new Error(error.message || 'Erro');
      if (data?.error) throw new Error(data.error);

      // Se for confirmação e enviar localização está ativo, enviar localização com link encurtado + logo
      if (type === 'confirmation' && formData.send_location_in_confirmation && storeLocation.latitude && storeLocation.longitude) {
        const fullLocationLink = `https://mostralo.com.br/navegar?lat=${storeLocation.latitude}&lng=${storeLocation.longitude}${storeLocation.slug ? `&store=${encodeURIComponent(storeLocation.slug)}` : ''}${storeLocation.address ? `&address=${encodeURIComponent(storeLocation.address)}` : ''}`;
        
        // Encurtar o link de localização
        let shortLocationLink = fullLocationLink;
        try {
          const { data: shortData } = await supabase.functions.invoke('short-link', {
            body: { action: 'create_url', targetUrl: fullLocationLink, storeSlug: storeId || 'general' }
          });
          if (shortData?.success && shortData?.id) {
            shortLocationLink = `https://mostralo.com.br/r/${shortData.id}`;
          }
        } catch (e) {
          console.warn('Falha ao encurtar link de localização, usando link completo:', e);
        }

        const locationCaption = `📍 *Navegue até nós:*\n${shortLocationLink}`;
        await supabase.functions.invoke('whatsapp-chat-send', {
          body: { 
            storeId, 
            remoteJid, 
            content: locationCaption, 
            messageType: logoUrl ? 'image' : 'text', 
            ...(logoUrl ? { mediaUrl: logoUrl } : {}) 
          }
        });
      }

      toast.success(`✅ Teste de ${type === 'confirmation' ? 'confirmação' : type === 'reminder' ? 'lembrete' : type === 'satisfaction' ? 'satisfação' : type === 'review' ? 'avaliação' : type === 'pix' ? 'PIX' : type} enviado!`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar teste');
    } finally { setSendingTestType(null); }
  }, [testPhone, storeId, formData, shortenedUrl, storeLocation]);

  const renderTestes = () => {
    const notifications = [
      { type: 'confirmation', label: 'Confirmação de Agendamento', icon: '✅', description: formData.send_location_in_confirmation && storeLocation.latitude ? 'Confirmação + link de localização (página Navegar)' : 'Mensagem enviada quando um agendamento é confirmado', enabled: formData.send_confirmation_message },
      { type: 'reminder', label: 'Lembrete de Agendamento', icon: '⏰', description: 'Mensagem enviada antes do horário agendado', enabled: formData.send_reminder_message },
      { type: 'satisfaction', label: 'Pesquisa de Satisfação', icon: '⭐', description: 'Mensagem pedindo avaliação por nota após o atendimento', enabled: formData.send_satisfaction_survey },
      { type: 'review', label: 'Avaliação de Profissional', icon: '📝', description: 'Link para avaliar o profissional no sistema', enabled: formData.enable_professional_reviews },
      { type: 'pix', label: 'Cobrança PIX', icon: '💳', description: 'Solicitação de pagamento PIX via WhatsApp', enabled: formData.send_pix_payment },
    ];

    return (
      <div>
        <SectionTitle title="Testes de Notificações" description="Envie mensagens de teste para validar seus templates de notificação" />

        {/* Phone input */}
        <div className="rounded-lg border bg-card p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Número para teste</Label>
            </div>
            <Input
              type="tel"
              placeholder="(11) 99999-9999"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="max-w-[220px] h-9"
            />
            <p className="text-xs text-muted-foreground">Todas as mensagens serão enviadas para este número</p>
          </div>
        </div>

        {/* WhatsApp status */}
        {!isLoadingModules && !isLoadingWhatsApp && !hasConnectedWhatsApp && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2.5 mb-4">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>WhatsApp não conectado. Conecte primeiro para enviar testes.</span>
            <Button variant="outline" size="sm" asChild className="ml-auto h-7 text-xs">
              <Link to="/dashboard/whatsapp">Configurar</Link>
            </Button>
          </div>
        )}

        {/* Notifications grid */}
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {notifications.map(({ type, label, icon, description, enabled }) => (
            <div key={type} className="rounded-lg border bg-card p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <p className="text-sm font-medium">{label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{description}</p>
                </div>
                <Badge variant={enabled ? 'default' : 'secondary'} className={`text-[10px] px-1.5 py-0 h-5 shrink-0 ${enabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : ''}`}>
                  {enabled ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs mt-auto"
                disabled={!testPhone || !hasConnectedWhatsApp || sendingTestType === type}
                onClick={() => sendTestNotification(type)}
              >
                {sendingTestType === type ? (
                  <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="h-3 w-3 mr-1.5" /> Enviar teste</>
                )}
              </Button>
              {!enabled && <p className="text-[10px] text-muted-foreground text-center -mt-1">Notificação desativada, mas o teste será enviado</p>}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          💡 Os testes usam dados fictícios (João Teste, Carlos Barbeiro, Corte Masculino, R$ 50,00) para preencher as variáveis dos templates.
        </p>
      </div>
    );
  };

  const renderAparencia = () => (
    <BookingAppearancePanel
      value={{
        theme_primary_color: formData.theme_primary_color,
        theme_background_color: formData.theme_background_color,
        theme_text_color: formData.theme_text_color,
        theme_mode: formData.theme_mode,
        theme_font_family: formData.theme_font_family,
        theme_radius: formData.theme_radius,
        embed_hide_header: formData.embed_hide_header,
      }}
      onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
      storePrimaryColor={storeLocation.theme_colors?.primary || null}
      storeName={storeLocation.name}
      storeSlug={storeLocation.slug}
    />
  );

  const sectionRenderers: Record<SectionKey, () => JSX.Element> = {
    agenda: renderAgenda,
    regras: renderRegras,
    localizacao: renderLocalizacao,
    aparencia: renderAparencia,
    automacao: renderAutomacao,
    comunicacao: renderComunicacao,
    pagamentos: renderPagamentos,
    avaliacoes: renderAvaliacoes,
    testes: renderTestes,
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header fixo */}
      <div className="flex items-center justify-between pb-4 border-b mb-0">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Agendamento
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Defina como funcionam os agendamentos da sua loja</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} size="sm" className="h-9">
          {isSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
          Salvar alterações
        </Button>
      </div>

      {/* Horizontal tabs */}
      <div className="mt-4 flex overflow-x-auto gap-1 pb-1 scrollbar-hide border-b">
        {SECTIONS.map(({ key, label, icon: Icon }) => {
          const status = getSectionStatus(key);
          return (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors rounded-t-lg border-b-2 -mb-[1px]",
                activeSection === key
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", activeSection === key ? "text-primary" : "text-muted-foreground")} />
              {label}
              {status && (
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  status.active ? "bg-emerald-500" : "bg-muted-foreground/30"
                )} />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto pt-4 pb-6">
        {sectionRenderers[activeSection]()}
      </div>

      {/* Botão salvar mobile */}
      <div className="md:hidden border-t pt-3 mt-3">
        <Button onClick={handleSave} disabled={isSaving} className="w-full h-10">
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
