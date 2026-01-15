import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  Calendar,
  Check,
  ArrowRight,
  Smartphone,
  Monitor,
  RefreshCw,
  Bell,
  Shield,
  Zap,
  Users,
  ExternalLink
} from 'lucide-react';

export const GoogleCalendarInstructionsCard = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader className="pb-2 px-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent group">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <CardTitle className="text-sm">Integração com Google Agenda</CardTitle>
                <Badge variant="outline" className="ml-2 text-[10px] border-green-500/30 text-green-600 bg-green-500/10">
                  Premium
                </Badge>
              </div>
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0 px-4 space-y-5">
            {/* O que é */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                <Zap className="h-4 w-4 text-green-600" />
                O que é?
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                A integração com Google Agenda sincroniza automaticamente todos os agendamentos da sua loja 
                com o Google Calendar dos profissionais. Quando um cliente agenda, o compromisso aparece 
                instantaneamente no celular e computador de quem vai atender.
              </p>
            </div>

            {/* Benefícios */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                <Check className="h-4 w-4 text-green-600" />
                Benefícios
              </h4>
              <div className="grid gap-2 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <RefreshCw className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span><strong>Sincronização em tempo real</strong> - Novos agendamentos, alterações e cancelamentos refletem imediatamente</span>
                </div>
                <div className="flex items-start gap-2">
                  <Bell className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span><strong>Lembretes automáticos</strong> - O profissional recebe notificações do Google antes de cada atendimento</span>
                </div>
                <div className="flex items-start gap-2">
                  <Smartphone className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span><strong>Acesso em qualquer lugar</strong> - Visualize a agenda no celular, tablet ou computador</span>
                </div>
                <div className="flex items-start gap-2">
                  <Monitor className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span><strong>Visão unificada</strong> - O profissional vê compromissos pessoais e de trabalho no mesmo lugar</span>
                </div>
              </div>
            </div>

            {/* Como configurar */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                <Users className="h-4 w-4 text-green-600" />
                Como configurar?
              </h4>
              
              <div className="rounded-lg border bg-card p-3 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-xs font-bold shrink-0">1</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Você (Admin) configura pelo painel</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      No menu ⋮ de cada profissional, clique em "Google Calendar" para vincular a conta dele.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-xs font-bold shrink-0">2</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Autorização do Google</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      O profissional precisa autorizar o acesso à conta Google dele. Isso pode ser feito 
                      por você (se tiver acesso à conta) ou pelo próprio profissional no painel dele.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-xs font-bold shrink-0">3</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Escolha a agenda</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Selecione em qual calendário do Google os agendamentos serão criados 
                      (pode ser a agenda principal ou uma específica para trabalho).
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white text-xs font-bold shrink-0">✓</span>
                  <div>
                    <p className="text-sm font-medium text-foreground text-green-600">Pronto!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      A partir de agora, todos os agendamentos serão sincronizados automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Alternativa para o profissional */}
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-600">
                <Shield className="h-4 w-4" />
                O profissional também pode conectar sozinho
              </h4>
              <p className="text-xs text-muted-foreground">
                Se o profissional preferir não compartilhar a senha do Google, ele pode fazer a conexão 
                diretamente pelo painel dele em <strong>"Google Calendar"</strong> após fazer login.
              </p>
            </div>

            {/* Como funciona depois */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                <RefreshCw className="h-4 w-4 text-green-600" />
                O que acontece automaticamente?
              </h4>
              <div className="grid gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600 shrink-0" />
                  <span>Novo agendamento → Evento criado no Google Calendar</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600 shrink-0" />
                  <span>Reagendamento → Evento atualizado automaticamente</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600 shrink-0" />
                  <span>Cancelamento → Evento removido do calendário</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600 shrink-0" />
                  <span>O evento inclui: nome do cliente, serviço, horário e telefone</span>
                </div>
              </div>
            </div>

            {/* Link para docs */}
            <div className="pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-green-600 border-green-500/30 hover:bg-green-500/10"
                asChild
              >
                <a 
                  href="https://support.google.com/calendar/answer/37095" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Como usar o Google Calendar
                </a>
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
