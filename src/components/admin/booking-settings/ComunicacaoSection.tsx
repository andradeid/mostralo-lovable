// Aba Comunicação: status do WhatsApp, botões, avisos de reagendamento/cancelamento e modelos de mensagem.
// JSX movido da BookingSettingsPage sem mudança.
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, AlertTriangle, Lock, ArrowUpCircle } from 'lucide-react';
import { BookingButtonsPanel } from '@/components/admin/booking/BookingButtonsPanel';
import { TRow, SectionTitle } from './SettingsFields';
import { DEFAULT_SETTINGS } from '@/lib/bookingSettings/bookingSettingsForm';
import type { BookingSettingsForm, UpdateBookingSettingsField, BookingStoreLocation } from '@/lib/bookingSettings/bookingSettingsForm';

interface ComunicacaoSectionProps {
  storeId: string | null;
  formData: BookingSettingsForm;
  updateField: UpdateBookingSettingsField;
  isLoadingModules: boolean;
  isLoadingWhatsApp: boolean;
  hasConnectedWhatsApp: boolean;
  hasWhatsAppModule: boolean;
}

export function ComunicacaoSection({ storeId, formData, updateField, isLoadingModules, isLoadingWhatsApp, hasWhatsAppModule, hasConnectedWhatsApp }: ComunicacaoSectionProps) {
  return (
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
      <BookingButtonsPanel storeId={storeId} settings={formData} onChange={updateField} />
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <Label className="text-sm font-medium">Aviso de reagendamento</Label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          🔄 Texto adicionado <strong>no topo da mensagem de confirmação</strong> apenas quando o cliente reagenda pelo link. Explica que o horário anterior foi cancelado automaticamente e que vale somente o novo. Deixe vazio para não enviar aviso.
        </p>
        <Textarea value={formData.reschedule_message_template} onChange={(e) => updateField('reschedule_message_template', e.target.value)} rows={4} className="text-xs" />
        <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => updateField('reschedule_message_template', DEFAULT_SETTINGS.reschedule_message_template)}>🔄 Restaurar padrão</Button>
      </div>

      {/* Aviso de cancelamento */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <TRow id="send_cancellation_message" label="Aviso de cancelamento" tip="Avisa o cliente quando o agendamento é cancelado" checked={formData.send_cancellation_message} onChange={(checked) => updateField('send_cancellation_message', checked)} />
        <p className="text-xs text-muted-foreground leading-relaxed">
          ❌ Enviado quando <strong>o cliente cancela pelo link</strong> ou quando <strong>você cancela pelo painel</strong> com a opção "Avisar o cliente" marcada. Variáveis: {'{cliente}'}, {'{profissional}'}, {'{servico}'}, {'{data}'}, {'{horario}'}, {'{motivo}'} (só aparece se houver motivo), {'{link}'} (página de agendamento) e {'{loja}'}. Com botões ligados, o link vira o botão <strong>📅 Agendar novamente</strong> e a mensagem leva o rodapé do Mostralo.
        </p>
        {formData.send_cancellation_message && (
          <div className="space-y-2">
            <Textarea value={formData.cancellation_message_template} onChange={(e) => updateField('cancellation_message_template', e.target.value)} rows={8} className="text-xs" />
            <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => updateField('cancellation_message_template', DEFAULT_SETTINGS.cancellation_message_template)}>🔄 Restaurar padrão</Button>
          </div>
        )}
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
}
