// Regras da tela de Configurações de Agendamento. Funções puras: mesmo código que
// ficava dentro da BookingSettingsPage, só movido para cá.
import { renderBookingTemplate } from '../../../supabase/functions/_shared/booking-template.ts';
import { normalizeDepositTimeout } from '../../../supabase/functions/_shared/booking-deposit.ts';
import type { BookingSettings } from '@/hooks/useBooking';

export const DEFAULT_SETTINGS: Omit<BookingSettings, 'id' | 'store_id' | 'created_at' | 'updated_at'> = {
  slot_interval_minutes: 30,
  max_advance_days: 30,
  min_advance_hours: 2,
  allow_any_professional: true,
  cancellation_hours_limit: 24,
  require_deposit: false,
  default_deposit_percentage: 30,
  deposit_payment_mode: 'store',
  deposit_payment_timeout_minutes: 15,
  send_confirmation_message: true,
  use_interactive_buttons: false,
  interactive_test_phones: '',
  confirmation_message_template: '✅ *Agendamento confirmado com sucesso!*\n\nOlá *{cliente}*, tudo certo por aqui! 🎉\n\n📋 *Resumo do seu horário:*\n👤 Profissional: *{profissional}*\n💇 Serviço: *{servico}*\n📅 Data: *{data}*\n🕐 Horário: *{horario}*\n💰 Valor: *{valor}*\n\n🔗 *Gerencie seu agendamento (remarcar/cancelar):*\n{link}\n\n📌 *Dicas importantes:*\n• Chegue 5 minutos antes do horário\n• Em caso de imprevisto, avise com antecedência\n\nEstamos ansiosos para te atender! 😊',
  reschedule_message_template: '🔄 *Horário atualizado!*\n\nOlá *{cliente}*, seu agendamento anterior foi cancelado automaticamente e agora vale apenas o novo horário abaixo. 👇',
  send_cancellation_message: true,
  cancellation_message_template: '❌ *Agendamento cancelado*\n\nOlá *{cliente}*, seu agendamento foi cancelado:\n\n👤 Profissional: {profissional}\n💇 Serviço: {servico}\n📅 Data: {data}\n🕐 Horário: {horario}\n{motivo}\nQuer marcar outro horário?\n🔗 {link}\n\n_{loja} agradece a preferência! 💙_',
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

export type SectionKey = 'agenda' | 'regras' | 'localizacao' | 'aparencia' | 'automacao' | 'comunicacao' | 'pagamentos' | 'avaliacoes' | 'testes';

export type BookingSettingsForm = typeof DEFAULT_SETTINGS;

export type UpdateBookingSettingsField = <K extends keyof BookingSettingsForm>(field: K, value: BookingSettingsForm[K]) => void;

export interface BookingStoreLocation {
  latitude: number | null;
  longitude: number | null;
  address: string;
  business_hours: any;
  slug: string;
  name: string;
  theme_colors: any;
}

/** Formulário a partir das configurações salvas (o que faltar usa o padrão). */
export function bookingSettingsFormFromRow(bookingSettings: BookingSettings): BookingSettingsForm {
  return {
    slot_interval_minutes: bookingSettings.slot_interval_minutes ?? DEFAULT_SETTINGS.slot_interval_minutes,
    max_advance_days: bookingSettings.max_advance_days ?? DEFAULT_SETTINGS.max_advance_days,
    min_advance_hours: bookingSettings.min_advance_hours ?? DEFAULT_SETTINGS.min_advance_hours,
    allow_any_professional: bookingSettings.allow_any_professional ?? DEFAULT_SETTINGS.allow_any_professional,
    cancellation_hours_limit: bookingSettings.cancellation_hours_limit ?? DEFAULT_SETTINGS.cancellation_hours_limit,
    require_deposit: bookingSettings.require_deposit ?? DEFAULT_SETTINGS.require_deposit,
    default_deposit_percentage: bookingSettings.default_deposit_percentage ?? DEFAULT_SETTINGS.default_deposit_percentage,
    deposit_payment_mode: bookingSettings.deposit_payment_mode === 'mostralo' ? 'mostralo' : 'store',
    deposit_payment_timeout_minutes: normalizeDepositTimeout(bookingSettings.deposit_payment_timeout_minutes),
    send_confirmation_message: bookingSettings.send_confirmation_message ?? DEFAULT_SETTINGS.send_confirmation_message,
    use_interactive_buttons: bookingSettings.use_interactive_buttons ?? false,
    interactive_test_phones: bookingSettings.interactive_test_phones ?? '',
    confirmation_message_template: bookingSettings.confirmation_message_template ?? DEFAULT_SETTINGS.confirmation_message_template,
    reschedule_message_template: (bookingSettings as { reschedule_message_template?: string }).reschedule_message_template ?? DEFAULT_SETTINGS.reschedule_message_template,
    send_cancellation_message: (bookingSettings as { send_cancellation_message?: boolean }).send_cancellation_message ?? DEFAULT_SETTINGS.send_cancellation_message,
    cancellation_message_template: (bookingSettings as { cancellation_message_template?: string | null }).cancellation_message_template || DEFAULT_SETTINGS.cancellation_message_template,
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
  };
}

/** Bolinha de status de cada aba (null = aba sem status). */
export function getSectionStatus(
  key: SectionKey,
  formData: BookingSettingsForm,
  hasConnectedWhatsApp: boolean,
  storeLocation: Pick<BookingStoreLocation, 'latitude'>,
): { active: boolean; label: string } | null {
  switch (key) {
    case 'automacao': return { active: formData.auto_status_enabled, label: formData.auto_status_enabled ? 'Ativo' : 'Off' };
    case 'comunicacao': return { active: hasConnectedWhatsApp, label: hasConnectedWhatsApp ? 'Conectado' : 'Off' };
    case 'pagamentos': return { active: formData.require_deposit || formData.send_pix_payment, label: formData.require_deposit || formData.send_pix_payment ? 'Ativo' : 'Off' };
    case 'avaliacoes': return { active: formData.enable_professional_reviews, label: formData.enable_professional_reviews ? 'Ativo' : 'Off' };
    case 'localizacao': return { active: !!storeLocation.latitude, label: storeLocation.latitude ? 'Definida' : 'Pendente' };
    default: return null;
  }
}

/**
 * Mensagem de teste de uma notificação, com dados fictícios e a mesma troca de
 * variáveis das mensagens reais (_shared/booking-template.ts).
 */
export function buildTestNotificationMessage(
  type: string,
  formData: BookingSettingsForm,
  locationShortLink: string,
  shortenedUrl: string | null,
  today: Date = new Date(),
): string {
  const sampleData = {
    customerName: 'João Teste',
    professionalName: 'Carlos Barbeiro',
    serviceName: 'Corte Masculino',
    date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
    time: '14:30',
    price: 50,
    locationLink: locationShortLink,
    link: type === 'review' ? 'https://mostralo.com.br/avaliar/exemplo' : 'https://mostralo.com.br/meu-agendamento/exemplo',
    googleReviewUrl: shortenedUrl || formData.google_review_url || '',
  };
  const replaceVars = (template: string) => renderBookingTemplate(template, sampleData);

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

  return message;
}
