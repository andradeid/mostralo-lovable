// Aba Pagamentos: sinal (Pix da loja ou pelo Mostralo) e cobrança PIX.
// JSX movido da BookingSettingsPage sem mudança.
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { normalizeDepositTimeout, DEPOSIT_TIMEOUT_MIN, DEPOSIT_TIMEOUT_MAX } from '../../../../supabase/functions/_shared/booking-deposit';
import { TRow, SectionTitle } from './SettingsFields';
import { DEFAULT_SETTINGS } from '@/lib/bookingSettings/bookingSettingsForm';
import type { BookingSettingsForm, UpdateBookingSettingsField, BookingStoreLocation } from '@/lib/bookingSettings/bookingSettingsForm';

interface PagamentosSectionProps {
  formData: BookingSettingsForm;
  updateField: UpdateBookingSettingsField;
  efiInfo: { active: boolean; commission: number };
}

export function PagamentosSection({ formData, updateField, efiInfo }: PagamentosSectionProps) {
  const depositStoreMode = formData.require_deposit && formData.deposit_payment_mode === 'store';
  const feeLabel = efiInfo.commission.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

  const pixKeyFields = (
    <div className="space-y-3">
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
      {!formData.pix_key && (
        <p className="text-xs text-destructive px-1">⚠️ Informe sua chave PIX.</p>
      )}
    </div>
  );

  return (
    <div>
      <SectionTitle title="Pagamentos" description="Configure sinal e cobrança PIX automática" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Sinal */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Sinal / Depósito</p>
          <TRow
            id="require_deposit"
            label="Exigir sinal para agendar"
            tip="Na página de agendamento, o cliente paga um valor antecipado para confirmar o horário"
            checked={formData.require_deposit}
            onChange={(checked) => updateField('require_deposit', checked)}
          />
          {formData.require_deposit && (
            <div className="space-y-4 px-1">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Porcentagem padrão</Label>
                  <Input type="number" min={1} max={100} value={formData.default_deposit_percentage} onChange={(e) => updateField('default_deposit_percentage', Number(e.target.value))} className="w-20 h-9" />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sobre o preço do serviço. Serviços com sinal próprio (em Serviços) usam o valor ou a % deles. Serviço grátis não cobra sinal.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Como receber o sinal</Label>
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('deposit_payment_mode', 'store')}
                    className={cn(
                      'text-left rounded-lg border p-3 transition-colors',
                      formData.deposit_payment_mode === 'store' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'
                    )}
                  >
                    <p className="text-sm font-medium">Pix da própria loja <span className="text-xs font-normal text-muted-foreground">(sem taxa)</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      O cliente vê sua chave Pix e o valor do sinal na tela e no WhatsApp. A reserva fica "Sinal pendente" até você conferir o pagamento e clicar em "Confirmar sinal" na agenda.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => efiInfo.active && updateField('deposit_payment_mode', 'mostralo')}
                    disabled={!efiInfo.active && formData.deposit_payment_mode !== 'mostralo'}
                    className={cn(
                      'text-left rounded-lg border p-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
                      formData.deposit_payment_mode === 'mostralo' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'
                    )}
                  >
                    <p className="text-sm font-medium">Pix pelo Mostralo <span className="text-xs font-normal text-muted-foreground">(confirmação automática)</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      O cliente paga um Pix gerado na hora e a reserva é confirmada sozinha. Sem pagamento no prazo, o horário é liberado.
                    </p>
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mt-1">
                      Taxa de {feeLabel}% sobre o sinal.
                    </p>
                  </button>
                </div>
                {!efiInfo.active && (
                  <p className="text-xs text-muted-foreground px-1">
                    Para usar o Pix pelo Mostralo, ative o{' '}
                    <Link to="/dashboard/online-payment" className="text-primary underline">pagamento online</Link>.
                    {formData.deposit_payment_mode === 'mostralo' && <span className="text-destructive"> Sem conta ativa, o sinal não é cobrado pelo Mostralo.</span>}
                  </p>
                )}
              </div>

              {formData.deposit_payment_mode === 'store' ? (
                <div className="space-y-2">
                  <Label className="text-sm">Chave Pix da loja</Label>
                  {pixKeyFields}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Prazo para pagar</Label>
                  <Input
                    type="number"
                    min={DEPOSIT_TIMEOUT_MIN}
                    max={DEPOSIT_TIMEOUT_MAX}
                    value={formData.deposit_payment_timeout_minutes}
                    onChange={(e) => updateField('deposit_payment_timeout_minutes', Number(e.target.value))}
                    onBlur={() => updateField('deposit_payment_timeout_minutes', normalizeDepositTimeout(formData.deposit_payment_timeout_minutes))}
                    className="w-20 h-9"
                  />
                  <span className="text-sm text-muted-foreground">min ({DEPOSIT_TIMEOUT_MIN} a {DEPOSIT_TIMEOUT_MAX})</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PIX */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Cobrança PIX</p>
          <TRow
            id="send_pix_payment"
            label="Enviar cobrança PIX automática"
            tip="Cliente recebe solicitação de pagamento PIX via WhatsApp junto com a confirmação (com sinal pago, só o restante)"
            checked={formData.send_pix_payment}
            onChange={(checked) => updateField('send_pix_payment', checked)}
          />
          {formData.send_pix_payment && (
            <div className="space-y-3 pt-1">
              {depositStoreMode
                ? <p className="text-xs text-muted-foreground px-1">Usa a mesma chave Pix do sinal.</p>
                : pixKeyFields}
              <div className="space-y-1.5">
                <Label className="text-xs">Mensagem da cobrança</Label>
                <Textarea value={formData.pix_payment_message} onChange={(e) => updateField('pix_payment_message', e.target.value)} rows={4} className="text-xs" />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{'{cliente}'}, {'{profissional}'}, {'{servico}'}, {'{data}'}, {'{horario}'}, {'{valor}'}</p>
                  <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => updateField('pix_payment_message', DEFAULT_SETTINGS.pix_payment_message)}>🔄 Restaurar</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
