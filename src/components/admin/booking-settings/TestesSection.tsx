// Aba Testes: envia cada notificação de teste para um número.
// JSX movido da BookingSettingsPage sem mudança.
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Send } from 'lucide-react';
import { SectionTitle } from './SettingsFields';
import type { BookingSettingsForm, UpdateBookingSettingsField, BookingStoreLocation } from '@/lib/bookingSettings/bookingSettingsForm';

interface TestesSectionProps {
  formData: BookingSettingsForm;
  storeLocation: BookingStoreLocation;
  testPhone: string;
  setTestPhone: (phone: string) => void;
  isLoadingModules: boolean;
  isLoadingWhatsApp: boolean;
  hasConnectedWhatsApp: boolean;
  sendingTestType: string | null;
  sendTestNotification: (type: string) => void;
}

export function TestesSection({ formData, storeLocation, testPhone, setTestPhone, isLoadingModules, isLoadingWhatsApp, hasConnectedWhatsApp, sendingTestType, sendTestNotification }: TestesSectionProps) {
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
}
