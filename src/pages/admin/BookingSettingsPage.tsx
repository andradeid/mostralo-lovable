import { useState, useEffect } from 'react';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useBooking, BookingSettings } from '@/hooks/useBooking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Settings, DollarSign, MessageSquare, HelpCircle, Save, Loader2, Star } from 'lucide-react';

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
  confirmation_message_template: 'Olá {cliente}! Seu agendamento com {profissional} para {servico} foi confirmado para {data} às {horario}. Valor: R$ {valor}. Qualquer dúvida, entre em contato!',
  send_reminder_message: true,
  reminder_hours_before: 2,
  reminder_message_template: 'Olá {cliente}! Lembrando do seu agendamento hoje às {horario} com {profissional}. Te esperamos! 🙂',
  send_satisfaction_survey: false,
  satisfaction_message_template: 'Olá {cliente}! Como foi seu atendimento com {profissional}? Avalie de 1 a 5 ⭐',
  enable_professional_reviews: false
};

export default function BookingSettingsPage() {
  const { storeId } = useStoreAccess();
  const { bookingSettings, updateSettings } = useBooking(storeId);
  
  const [formData, setFormData] = useState(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

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
        enable_professional_reviews: bookingSettings.enable_professional_reviews ?? DEFAULT_SETTINGS.enable_professional_reviews
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
                <Textarea
                  id="confirmation_message_template"
                  placeholder="Template da mensagem de confirmação..."
                  value={formData.confirmation_message_template}
                  onChange={(e) => updateField('confirmation_message_template', e.target.value)}
                  rows={3}
                />
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
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Pesquisa de satisfação */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="send_satisfaction_survey">Enviar pesquisa de satisfação</Label>
                  <FieldTooltip content="Envia uma mensagem após o atendimento pedindo avaliação" />
                </div>
                <Switch
                  id="send_satisfaction_survey"
                  checked={formData.send_satisfaction_survey}
                  onCheckedChange={(checked) => updateField('send_satisfaction_survey', checked)}
                />
              </div>
              {formData.send_satisfaction_survey && (
                <Textarea
                  id="satisfaction_message_template"
                  placeholder="Template da pesquisa de satisfação..."
                  value={formData.satisfaction_message_template}
                  onChange={(e) => updateField('satisfaction_message_template', e.target.value)}
                  rows={3}
                />
              )}
            </div>
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
