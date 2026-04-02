import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useBooking, BookingSettings } from '@/hooks/useBooking';
import { useWhatsAppStatus } from '@/hooks/useWhatsAppStatus';
import { useStoreModules } from '@/hooks/useStoreModules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  // Novas configurações de avaliação
  review_message_template: 'Olá {cliente}! Como foi seu atendimento com {profissional}?\n\nGostaríamos muito de ouvir sua opinião! Avalie em apenas 1 minuto:\n\n👉 {link}\n\nSua avaliação é muito importante para nós! ⭐',
  review_delay_minutes: 30,
  review_expiry_days: 7,
  show_public_reviews: true,
  show_subscription_plans: false,
  // PIX payment
  send_pix_payment: false,
  pix_key: '',
  pix_key_type: 'random',
  pix_recipient_name: '',
  pix_payment_message: '💳 *Sugestão de Pagamento PIX*\n\nOlá *{cliente}*! 👋\n\nSegue a cobrança referente ao seu agendamento:\n\n💇 Serviço: {servico}\n👤 Profissional: {profissional}\n📅 Data: {data}\n🕐 Horário: {horario}\n💰 Valor: {valor}\n\nVocê pode pagar via PIX para agilizar! 😊',
  // Automation
  auto_status_enabled: false,
  auto_complete_minutes: 15,
  google_review_url: '',
  // Location
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
        // Novas configurações de avaliação
        review_message_template: bookingSettings.review_message_template ?? DEFAULT_SETTINGS.review_message_template,
        review_delay_minutes: bookingSettings.review_delay_minutes ?? DEFAULT_SETTINGS.review_delay_minutes,
        review_expiry_days: bookingSettings.review_expiry_days ?? DEFAULT_SETTINGS.review_expiry_days,
        show_public_reviews: bookingSettings.show_public_reviews ?? DEFAULT_SETTINGS.show_public_reviews,
        // Planos de assinatura
        show_subscription_plans: bookingSettings.show_subscription_plans ?? DEFAULT_SETTINGS.show_subscription_plans,
        // PIX payment
        send_pix_payment: bookingSettings.send_pix_payment ?? DEFAULT_SETTINGS.send_pix_payment,
        pix_key: bookingSettings.pix_key ?? DEFAULT_SETTINGS.pix_key,
        pix_key_type: bookingSettings.pix_key_type ?? DEFAULT_SETTINGS.pix_key_type,
        pix_recipient_name: bookingSettings.pix_recipient_name ?? DEFAULT_SETTINGS.pix_recipient_name,
        pix_payment_message: bookingSettings.pix_payment_message ?? DEFAULT_SETTINGS.pix_payment_message,
        // Automation
        auto_status_enabled: bookingSettings.auto_status_enabled ?? DEFAULT_SETTINGS.auto_status_enabled,
        auto_complete_minutes: bookingSettings.auto_complete_minutes ?? DEFAULT_SETTINGS.auto_complete_minutes,
        // Google Review
        google_review_url: bookingSettings.google_review_url ?? DEFAULT_SETTINGS.google_review_url,
      });
    }
  }, [bookingSettings]);

  const handleSave = async () => {
    if (!storeId) return;
    
    setIsSaving(true);
    try {
      await updateSettings({
        store_id: storeId,
        ...formData
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Encurtar link do Google Review
  const handleShortenUrl = useCallback(async () => {
    if (!formData.google_review_url) return;
    setIsShortening(true);
    try {
      const { data, error } = await supabase.functions.invoke('short-link', {
        body: {
          action: 'create_url',
          targetUrl: formData.google_review_url,
          storeSlug: storeId || 'general'
        }
      });
      if (error || !data?.success) {
        toast.error('Erro ao encurtar link');
        return;
      }
      const shortUrl = `${window.location.origin}/r/${data.id}`;
      setShortenedUrl(shortUrl);
      toast.success('Link encurtado com sucesso!');
    } catch {
      toast.error('Erro ao encurtar link');
    } finally {
      setIsShortening(false);
    }
  }, [formData.google_review_url, storeId]);

  // Enviar teste de avaliação via instância WhatsApp da loja
  const handleTestReview = useCallback(async () => {
    if (!testPhone) {
      toast.error('Informe o número de WhatsApp para teste');
      return;
    }
    if (!storeId) {
      toast.error('Loja não identificada');
      return;
    }
    const reviewUrl = shortenedUrl || formData.google_review_url;
    if (!reviewUrl) {
      toast.error('Configure o link de avaliação primeiro');
      return;
    }

    setIsSendingTest(true);
    try {
      const normalizedPhone = testPhone.replace(/\D/g, '');
      const phoneWithCountry = normalizedPhone.startsWith('55') ? normalizedPhone : `55${normalizedPhone}`;
      const remoteJid = `${phoneWithCountry}@s.whatsapp.net`;

      const message = `⭐ *Teste de Avaliação*\n\nOlá! Este é um teste do sistema de avaliações.\n\nClique no link abaixo para avaliar:\n\n👉 ${reviewUrl}\n\nObrigado! 😊`;

      // Buscar logo da loja para enviar como imagem com legenda
      const { data: storeData } = await supabase
        .from('stores')
        .select('logo_url')
        .eq('id', storeId)
        .single();

      const logoUrl = storeData?.logo_url || null;

      const { data, error } = await supabase.functions.invoke('whatsapp-chat-send', {
        body: {
          storeId,
          remoteJid,
          content: message,
          messageType: logoUrl ? 'image' : 'text',
          ...(logoUrl ? { mediaUrl: logoUrl } : {}),
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao enviar mensagem');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('✅ Mensagem de teste enviada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao enviar teste:', err);
      toast.error(err.message || 'Erro ao enviar mensagem de teste');
    } finally {
      setIsSendingTest(false);
    }
  }, [testPhone, shortenedUrl, formData.google_review_url, storeId]);

  const FieldTooltip = ({ content }: { content: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações de Agendamento
          </h1>
          <p className="text-muted-foreground mt-1">
            Defina como funcionam os agendamentos da sua loja
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Automação de Status */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Automação de Status
            </CardTitle>
            <CardDescription>
              Altere automaticamente o status dos agendamentos com base no horário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Ativar automação de status</Label>
                <p className="text-sm text-muted-foreground">
                  O sistema detectará automaticamente quando um atendimento está em andamento ou finalizado
                </p>
              </div>
              <Switch
                checked={formData.auto_status_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_status_enabled: checked }))}
              />
            </div>
            {formData.auto_status_enabled && (
              <div className="space-y-2 pl-1">
                <Label className="flex items-center gap-2">
                  Tempo para concluir automaticamente (minutos)
                  <FieldTooltip content="Após o horário final do agendamento, o sistema aguardará este tempo antes de marcar como concluído automaticamente." />
                </Label>
                <Input
                  type="number"
                  value={formData.auto_complete_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, auto_complete_minutes: Number(e.target.value) }))}
                  min={5}
                  max={60}
                  className="w-32"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fuso Horário */}
        <div className="md:col-span-2">
          <BotTimezoneCard storeId={storeId} context="booking" />
        </div>

        {/* Horários e Intervalos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Horários e Intervalos
            </CardTitle>
            <CardDescription>
              Configure intervalos de tempo e regras de agendamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Intervalo entre horários */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="slot_interval">Intervalo entre horários</Label>
                <FieldTooltip content="Define o intervalo de tempo entre cada horário disponível para agendamento. Ex: 30 min = 09:00, 09:30, 10:00..." />
              </div>
              <Select
                value={String(formData.slot_interval_minutes)}
                onValueChange={(v) => updateField('slot_interval_minutes', Number(v))}
              >
                <SelectTrigger id="slot_interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="20">20 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">60 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dias máximos para agendar */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="max_advance_days">Agendamento máximo com antecedência</Label>
                <FieldTooltip content="Quantos dias no futuro o cliente pode agendar. Ex: 30 = pode agendar até 30 dias a partir de hoje" />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="max_advance_days"
                  type="number"
                  min={1}
                  max={365}
                  value={formData.max_advance_days}
                  onChange={(e) => updateField('max_advance_days', Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-muted-foreground">dias</span>
              </div>
            </div>

            {/* Horas mínimas de antecedência */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="min_advance_hours">Antecedência mínima para agendar</Label>
                <FieldTooltip content="Quantas horas antes o cliente precisa agendar. Ex: 2 = não pode agendar para daqui 1 hora" />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="min_advance_hours"
                  type="number"
                  min={0}
                  max={72}
                  value={formData.min_advance_hours}
                  onChange={(e) => updateField('min_advance_hours', Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-muted-foreground">horas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opções Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-primary" />
              Opções Gerais
            </CardTitle>
            <CardDescription>
              Configurações gerais do sistema de agendamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Permitir "qualquer profissional" */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="allow_any_professional">Permitir "qualquer profissional"</Label>
                <FieldTooltip content="Permite que o cliente escolha 'qualquer profissional disponível' ao agendar" />
              </div>
              <Switch
                id="allow_any_professional"
                checked={formData.allow_any_professional}
                onCheckedChange={(checked) => updateField('allow_any_professional', checked)}
              />
            </div>

            {/* Habilitar avaliações de profissionais */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <Label htmlFor="enable_professional_reviews">Habilitar avaliações de profissionais</Label>
                <FieldTooltip content="Quando ativado, clientes recebem um link para avaliar o atendimento após o serviço ser concluído" />
              </div>
              <Switch
                id="enable_professional_reviews"
                checked={formData.enable_professional_reviews}
                onCheckedChange={(checked) => updateField('enable_professional_reviews', checked)}
              />
            </div>

            {/* Exibir planos de assinatura */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="show_subscription_plans">Exibir planos de assinatura na página</Label>
                <FieldTooltip content="Mostra um banner na página de agendamento convidando clientes a conhecer seus planos de assinatura do Clube" />
              </div>
              <Switch
                id="show_subscription_plans"
                checked={formData.show_subscription_plans}
                onCheckedChange={(checked) => updateField('show_subscription_plans', checked)}
              />
            </div>

            {/* Limite para cancelamento */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="cancellation_hours_limit">Limite para cancelamento</Label>
                <FieldTooltip content="Até quantas horas antes do agendamento o cliente pode cancelar. Após esse prazo, só a loja pode cancelar" />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="cancellation_hours_limit"
                  type="number"
                  min={0}
                  max={168}
                  value={formData.cancellation_hours_limit}
                  onChange={(e) => updateField('cancellation_hours_limit', Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-muted-foreground">horas antes</span>
              </div>
            </div>

            {/* Link de avaliação do Google */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-primary" />
                <Label htmlFor="google_review_url" className="font-semibold">Link de avaliação do Google</Label>
                <FieldTooltip content="Cole aqui o link de avaliação da sua loja no Google. Para encontrá-lo: pesquise o nome da sua loja no Google Maps, clique em 'Escrever uma avaliação' e copie o link da barra de endereço." />
              </div>
              <Input
                id="google_review_url"
                type="url"
                placeholder="https://search.google.com/local/writereview?placeid=..."
                value={formData.google_review_url}
                onChange={(e) => {
                  updateField('google_review_url', e.target.value);
                  setShortenedUrl(null); // Reset shortened URL when original changes
                }}
              />
              <p className="text-xs text-muted-foreground">
                💡 Pesquise sua loja no Google Maps → clique em "Escrever uma avaliação" → copie o link. Use <code className="bg-muted px-1 rounded">{'{google_review}'}</code> nos templates de mensagem.
              </p>

              {formData.google_review_url && (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                  {/* Encurtar link */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleShortenUrl}
                      disabled={isShortening || !!shortenedUrl}
                    >
                      {isShortening ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Link2 className="h-3 w-3 mr-1" />
                      )}
                      {shortenedUrl ? 'Link encurtado ✓' : 'Encurtar link'}
                    </Button>
                    <a
                      href={formData.google_review_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Abrir link original
                    </a>
                  </div>

                  {shortenedUrl && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Link curto:</span>
                      <code className="bg-background px-2 py-1 rounded border text-xs font-mono break-all">{shortenedUrl}</code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(shortenedUrl);
                          toast.success('Link copiado!');
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  )}

                  {/* Testar via WhatsApp */}
                  <div className="border-t pt-3 space-y-2">
                    <Label className="text-sm font-medium">📱 Testar avaliação via WhatsApp</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        className="flex-1 max-w-[200px]"
                      />
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleTestReview}
                        disabled={!testPhone || isSendingTest}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isSendingTest ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3 mr-1" />
                        )}
                        {isSendingTest ? 'Enviando...' : 'Enviar teste'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Envia a mensagem de teste pela instância WhatsApp conectada na loja com o link {shortenedUrl ? 'encurtado' : 'de avaliação'}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sinal/Depósito */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              Sinal / Depósito
            </CardTitle>
            <CardDescription>
              Configure se deseja exigir um sinal para confirmar agendamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Exigir sinal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="require_deposit">Exigir sinal para agendar</Label>
                <FieldTooltip content="Quando ativado, o cliente precisará pagar um valor antecipado para confirmar o agendamento" />
              </div>
              <Switch
                id="require_deposit"
                checked={formData.require_deposit}
                onCheckedChange={(checked) => updateField('require_deposit', checked)}
              />
            </div>

            {/* Porcentagem do sinal */}
            {formData.require_deposit && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="default_deposit_percentage">Porcentagem padrão do sinal</Label>
                  <FieldTooltip content="Porcentagem do valor total do serviço que será cobrada como sinal" />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="default_deposit_percentage"
                    type="number"
                    min={1}
                    max={100}
                    value={formData.default_deposit_percentage}
                    onChange={(e) => updateField('default_deposit_percentage', Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cobrança PIX Automática */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Cobrança PIX após Agendamento
            </CardTitle>
            <CardDescription>
              Envie automaticamente uma sugestão de pagamento PIX ao cliente após confirmar o agendamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toggle principal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="send_pix_payment">Enviar cobrança PIX automática</Label>
                <FieldTooltip content="Quando ativado, o cliente recebe uma solicitação de pagamento PIX via WhatsApp após o agendamento ser confirmado" />
              </div>
              <Switch
                id="send_pix_payment"
                checked={formData.send_pix_payment}
                onCheckedChange={(checked) => updateField('send_pix_payment', checked)}
              />
            </div>

            {formData.send_pix_payment && (
              <div className="space-y-4 pt-2 border-t">
                {/* Tipo de chave PIX */}
                <div className="space-y-2">
                  <Label>Tipo da Chave PIX *</Label>
                  <Select value={formData.pix_key_type} onValueChange={(v) => updateField('pix_key_type', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">Chave Aleatória (EVP)</SelectItem>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Chave PIX */}
                <div className="space-y-2">
                  <Label htmlFor="pix_key">Chave PIX *</Label>
                  <Input
                    id="pix_key"
                    value={formData.pix_key}
                    onChange={(e) => updateField('pix_key', e.target.value)}
                    placeholder={
                      formData.pix_key_type === 'cpf' ? '000.000.000-00'
                      : formData.pix_key_type === 'cnpj' ? '00.000.000/0000-00'
                      : formData.pix_key_type === 'email' ? 'email@exemplo.com'
                      : formData.pix_key_type === 'phone' ? '(11) 99999-9999'
                      : 'UUID da chave aleatória'
                    }
                  />
                </div>

                {/* Nome do recebedor */}
                <div className="space-y-2">
                  <Label htmlFor="pix_recipient_name">Nome do recebedor</Label>
                  <Input
                    id="pix_recipient_name"
                    value={formData.pix_recipient_name}
                    onChange={(e) => updateField('pix_recipient_name', e.target.value)}
                    placeholder="Nome que aparecerá na cobrança"
                  />
                </div>

                {/* Mensagem da cobrança */}
                <div className="space-y-2">
                  <Label htmlFor="pix_payment_message">Mensagem da cobrança</Label>
                  <Textarea
                    id="pix_payment_message"
                    value={formData.pix_payment_message}
                    onChange={(e) => updateField('pix_payment_message', e.target.value)}
                    placeholder="Mensagem enviada junto com a cobrança PIX..."
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Variáveis: {'{cliente}'}, {'{profissional}'}, {'{servico}'}, {'{data}'}, {'{horario}'}, {'{valor}'}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => updateField('pix_payment_message', DEFAULT_SETTINGS.pix_payment_message)}
                  >
                    🔄 Restaurar modelo padrão
                  </Button>
                </div>

                {!formData.pix_key && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Chave PIX obrigatória</AlertTitle>
                    <AlertDescription>
                      Informe sua chave PIX para que a cobrança automática funcione.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mensagens WhatsApp */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
              Mensagens WhatsApp
            </CardTitle>
            <CardDescription>
              Configure mensagens automáticas enviadas aos clientes. Use as variáveis: {'{cliente}'}, {'{profissional}'}, {'{servico}'}, {'{data}'}, {'{horario}'}, {'{valor}'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Alerta de status do módulo WhatsApp */}
            {!isLoadingModules && !isLoadingWhatsApp && (
              <>
                {!hasWhatsAppModule ? (
                  <Alert className="border-amber-500/50 bg-amber-500/10">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-700 dark:text-amber-400">Módulo WhatsApp Não Disponível</AlertTitle>
                    <AlertDescription className="text-amber-600 dark:text-amber-300">
                      <p className="mb-2">
                        As notificações automáticas via WhatsApp requerem o módulo <strong>"WhatsApp Automações"</strong> ativo no seu plano.
                      </p>
                      <p className="text-sm">
                        Entre em contato com o suporte para ativar este módulo ou faça o upgrade do seu plano.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" asChild className="border-amber-500/50 hover:bg-amber-500/20">
                          <Link to="/dashboard/subscription">
                            <ArrowUpCircle className="h-4 w-4 mr-1" />
                            Ver Planos
                          </Link>
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : hasConnectedWhatsApp ? (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-700 dark:text-green-400">WhatsApp Conectado</AlertTitle>
                    <AlertDescription className="text-green-600 dark:text-green-300">
                      Seu WhatsApp está conectado e pronto para enviar notificações automáticas de agendamento.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>WhatsApp Não Conectado</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">
                        Para enviar notificações automáticas, você precisa conectar seu WhatsApp ao sistema.
                      </p>
                      <Button variant="outline" size="sm" asChild className="mt-1">
                        <Link to="/dashboard/whatsapp">
                          Configurar WhatsApp
                        </Link>
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* Mensagem de confirmação */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="send_confirmation_message">Enviar confirmação de agendamento</Label>
                  <FieldTooltip content="Envia uma mensagem automática quando o agendamento é confirmado" />
                </div>
                <Switch
                  id="send_confirmation_message"
                  checked={formData.send_confirmation_message}
                  onCheckedChange={(checked) => updateField('send_confirmation_message', checked)}
                />
              </div>
              {formData.send_confirmation_message && (
                <div className="space-y-2">
                  <Textarea
                    id="confirmation_message_template"
                    placeholder="Template da mensagem de confirmação..."
                    value={formData.confirmation_message_template}
                    onChange={(e) => updateField('confirmation_message_template', e.target.value)}
                    rows={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => updateField('confirmation_message_template', DEFAULT_SETTINGS.confirmation_message_template)}
                  >
                    🔄 Restaurar modelo padrão
                  </Button>
                </div>
              )}
            </div>

            {/* Mensagem de lembrete */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="send_reminder_message">Enviar lembrete antes do agendamento</Label>
                  <FieldTooltip content="Envia uma mensagem lembrando o cliente sobre o agendamento" />
                </div>
                <Switch
                  id="send_reminder_message"
                  checked={formData.send_reminder_message}
                  onCheckedChange={(checked) => updateField('send_reminder_message', checked)}
                />
              </div>
              {formData.send_reminder_message && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="reminder_hours_before">Enviar lembrete</Label>
                    <Input
                      id="reminder_hours_before"
                      type="number"
                      min={1}
                      max={48}
                      value={formData.reminder_hours_before}
                      onChange={(e) => updateField('reminder_hours_before', Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-muted-foreground">horas antes</span>
                  </div>
                  <Textarea
                    id="reminder_message_template"
                    placeholder="Template da mensagem de lembrete..."
                    value={formData.reminder_message_template}
                    onChange={(e) => updateField('reminder_message_template', e.target.value)}
                    rows={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => updateField('reminder_message_template', DEFAULT_SETTINGS.reminder_message_template)}
                  >
                    🔄 Restaurar modelo padrão
                  </Button>
                </div>
              )}
            </div>

            {/* Pesquisa de satisfação (legado) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="send_satisfaction_survey">Enviar pesquisa de satisfação (simples)</Label>
                  <FieldTooltip content="Envia uma mensagem simples após o atendimento pedindo avaliação por nota" />
                </div>
                <Switch
                  id="send_satisfaction_survey"
                  checked={formData.send_satisfaction_survey}
                  onCheckedChange={(checked) => updateField('send_satisfaction_survey', checked)}
                />
              </div>
              {formData.send_satisfaction_survey && (
                <div className="space-y-2">
                  <Textarea
                    id="satisfaction_message_template"
                    placeholder="Template da pesquisa de satisfação..."
                    value={formData.satisfaction_message_template}
                    onChange={(e) => updateField('satisfaction_message_template', e.target.value)}
                    rows={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => updateField('satisfaction_message_template', DEFAULT_SETTINGS.satisfaction_message_template)}
                  >
                    🔄 Restaurar modelo padrão
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Avaliações de Profissionais */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-amber-500" />
              Avaliações de Profissionais
            </CardTitle>
            <CardDescription>
              Configure o sistema de avaliações automáticas. Quando habilitado, clientes recebem um link para avaliar o atendimento após o serviço ser concluído. Variáveis: {'{cliente}'}, {'{profissional}'}, {'{servico}'}, {'{data}'}, {'{link}'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Habilitar avaliações */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="enable_professional_reviews_section">Habilitar sistema de avaliações</Label>
                <FieldTooltip content="Quando ativado, clientes recebem um link para avaliar o profissional após o atendimento ser concluído" />
              </div>
              <Switch
                id="enable_professional_reviews_section"
                checked={formData.enable_professional_reviews}
                onCheckedChange={(checked) => updateField('enable_professional_reviews', checked)}
              />
            </div>

            {formData.enable_professional_reviews && (
              <>
                {/* Template da mensagem */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="review_message_template">Template da mensagem de avaliação</Label>
                    <FieldTooltip content="Mensagem enviada ao cliente após o serviço ser concluído. Use {link} para incluir o link de avaliação" />
                  </div>
                  <Textarea
                    id="review_message_template"
                    placeholder="Template da mensagem de avaliação..."
                    value={formData.review_message_template}
                    onChange={(e) => updateField('review_message_template', e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {/* Delay para envio */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="review_delay_minutes">Enviar após conclusão</Label>
                      <FieldTooltip content="Minutos de espera após marcar como concluído para enviar a solicitação" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="review_delay_minutes"
                        type="number"
                        min={0}
                        max={1440}
                        value={formData.review_delay_minutes}
                        onChange={(e) => updateField('review_delay_minutes', Number(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-muted-foreground text-sm">minutos</span>
                    </div>
                  </div>

                  {/* Dias de expiração */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="review_expiry_days">Link expira em</Label>
                      <FieldTooltip content="Quantos dias o link de avaliação permanece válido" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="review_expiry_days"
                        type="number"
                        min={1}
                        max={30}
                        value={formData.review_expiry_days}
                        onChange={(e) => updateField('review_expiry_days', Number(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-muted-foreground text-sm">dias</span>
                    </div>
                  </div>

                  {/* Exibir avaliações públicas */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="show_public_reviews">Exibir publicamente</Label>
                      <FieldTooltip content="Exibir avaliações públicas no cartão digital do profissional" />
                    </div>
                    <div className="flex items-center h-10">
                      <Switch
                        id="show_public_reviews"
                        checked={formData.show_public_reviews}
                        onCheckedChange={(checked) => updateField('show_public_reviews', checked)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Botão salvar mobile */}
      <div className="md:hidden">
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
