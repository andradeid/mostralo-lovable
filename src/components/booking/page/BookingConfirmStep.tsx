// Passo 4: resumo do agendamento (com o sinal previsto, se houver) e os dados do cliente.
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CountryCodeSelect } from '@/components/ui/country-code-select';
import { Calendar as CalendarIcon, CheckCircle2, Clock, Phone, Scissors, Shield, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, formatBrazilianPhone, formatInternationalPhone } from '@/lib/utils';
import { formatDepositBRL } from '../../../../supabase/functions/_shared/booking-deposit';
import type { BookingService, Professional } from '@/lib/bookingPage/types';
import { formatPrice } from '@/lib/bookingPage/rules';
import type { BookingCustomerForm } from '@/hooks/bookingPage/useBookingCustomerForm';

interface Props {
  selectedService: BookingService | null;
  effectiveProfessional: Professional | null;
  selectedDate: Date | undefined;
  selectedTime: string | null;
  expectedDeposit: number;
  bookingSettings: unknown;
  form: BookingCustomerForm;
}

export function BookingConfirmStep({
  selectedService,
  effectiveProfessional,
  selectedDate,
  selectedTime,
  expectedDeposit,
  bookingSettings,
  form,
}: Props) {
  const {
    customerName, setCustomerName,
    customerPhone, setCustomerPhone,
    customerEmail, setCustomerEmail,
    notes, setNotes,
    countryCode, setCountryCode,
    errors,
  } = form;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Quase lá! ✨</h2>
        <p className="text-sm text-muted-foreground mt-1">Confirme os dados e finalize seu agendamento</p>
      </div>

      {/* Booking Summary - Rich */}
      <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Resumo do agendamento</h3>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Scissors className="w-3.5 h-3.5" /> Serviço
              </span>
              <span className="font-medium text-foreground">{selectedService?.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <User className="w-3.5 h-3.5" /> Profissional
              </span>
              <span className="font-medium text-foreground">{effectiveProfessional?.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="w-3.5 h-3.5" /> Data
              </span>
              <span className="font-medium text-foreground">
                {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" /> Horário
              </span>
              <span className="font-medium text-foreground">{selectedTime}</span>
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-border">
              <span className="text-sm font-medium text-foreground">Total</span>
              <span className="text-lg font-bold text-primary">
                {selectedService && formatPrice(selectedService.price, selectedService.price_type)}
              </span>
            </div>
            {expectedDeposit > 0 && (
              <div className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-foreground">
                <p className="font-semibold">Sinal de {formatDepositBRL(expectedDeposit)} para garantir o horário</p>
                <p className="text-xs text-muted-foreground">
                  {(bookingSettings as any)?.deposit_payment_mode === 'mostralo'
                    ? 'Depois de confirmar, você paga o sinal por Pix e o horário é confirmado na hora. O restante é pago no atendimento.'
                    : 'Depois de confirmar, você recebe a chave Pix para pagar o sinal. O restante é pago no atendimento.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Form */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Seus dados
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">Nome completo *</Label>
            <Input
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Como devemos te chamar?"
              className={cn("mt-1.5 rounded-xl h-11", errors.customerName && 'border-destructive')}
            />
            {errors.customerName && (
              <p className="text-destructive text-xs mt-1">{errors.customerName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
              <Phone className="h-4 w-4 text-emerald-500" />
              Telefone/WhatsApp *
            </Label>

            <div className="flex gap-2">
              <CountryCodeSelect
                value={countryCode}
                onChange={setCountryCode}
              />

              <Input
                id="phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => {
                  const formatted = countryCode === '+55'
                    ? formatBrazilianPhone(e.target.value)
                    : formatInternationalPhone(e.target.value);
                  setCustomerPhone(formatted);
                }}
                placeholder={countryCode === '+55' ? '(00) 00000-0000' : 'Número'}
                maxLength={countryCode === '+55' ? 16 : 20}
                className={cn(
                  "rounded-xl h-11",
                  errors.customerPhone && 'border-destructive'
                )}
              />
            </div>

            {errors.customerPhone && (
              <p className="text-destructive text-xs">{errors.customerPhone}</p>
            )}
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-medium">Email (opcional)</Label>
            <Input
              id="email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="seu@email.com"
              className={cn("mt-1.5 rounded-xl h-11", errors.customerEmail && 'border-destructive')}
            />
            {errors.customerEmail && (
              <p className="text-destructive text-xs mt-1">{errors.customerEmail}</p>
            )}
          </div>
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">Observações (opcional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alguma observação especial?"
              className="mt-1.5 rounded-xl h-11"
              maxLength={500}
            />
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground py-2">
        <span className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          Dados protegidos
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          {expectedDeposit > 0 ? 'Horário garantido com o sinal' : 'Confirmação imediata'}
        </span>
      </div>
    </div>
  );
}
