// Abas da tela de Configurações de Agendamento.
import { Clock, Settings, MessageSquare, Star, MapPin, Zap, CreditCard, FlaskConical, Palette } from 'lucide-react';
import type { SectionKey } from '@/lib/bookingSettings/bookingSettingsForm';

export const SECTIONS: { key: SectionKey; label: string; icon: any; description: string }[] = [
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
