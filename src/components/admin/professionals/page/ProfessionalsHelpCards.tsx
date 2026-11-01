// Cartões de ajuda: como configurar, como o profissional acessa e Google Calendar.
// JSX movido da ProfessionalsPage sem mudança.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, ChevronDown, ChevronUp, ExternalLink, Key, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleCalendarInstructionsCard } from '@/components/admin/booking/GoogleCalendarInstructionsCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


interface ProfessionalsHelpCardsProps {
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
}

export function ProfessionalsHelpCards({ isHelpOpen, setIsHelpOpen }: ProfessionalsHelpCardsProps) {
  return (
    <>
      <Collapsible open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2 px-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Como configurar Profissionais</CardTitle>
                </div>
                {isHelpOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0 px-4">
              <div className="grid gap-2.5 text-sm text-muted-foreground">
                {[
                  { step: 1, title: 'Cadastre o profissional', desc: ' com nome e especialidade.' },
                  { step: 2, title: 'Configure os HORÁRIOS', desc: ' no menu ⋮ → Horários.' },
                  { step: 3, title: 'Adicione BLOQUEIOS', desc: ' para férias ou folgas.' },
                  { step: 4, title: 'Vincule os SERVIÇOS', desc: ' que pode realizar.' },
                  { step: 5, title: 'Defina a COMISSÃO', desc: ' (% ou R$ fixo).' },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">{item.step}</span>
                    <div className="text-xs sm:text-sm">
                      <span className="font-medium text-foreground">{item.title}</span>{item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Card: Como o profissional acessa */}
      <Collapsible>
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-2 px-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent group">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-sm">Como o profissional acessa sua agenda?</CardTitle>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0 px-4 space-y-4">
              <div className="grid gap-3 text-sm text-muted-foreground">
                {[
                  { step: 1, text: <>Ao cadastrar o profissional, <span className="font-medium text-foreground">você define email e senha</span>. Essas são as credenciais de acesso dele.</> },
                  { step: 2, text: <>O profissional <span className="font-medium text-foreground">acessa a página de login</span> e entra com o email e senha que você cadastrou.</> },
                  { step: 3, text: <>Após o login, <span className="font-medium text-foreground">ele é redirecionado automaticamente</span> para seu painel onde pode ver agenda, comissões, horários e bloqueios.</> },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">{item.step}</span>
                    <div className="text-xs sm:text-sm">{item.text}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => {
                    const loginUrl = `${window.location.origin}/auth`;
                    navigator.clipboard.writeText(loginUrl);
                    toast.success('Link de login copiado!', { description: loginUrl });
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar Link de Login
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 text-muted-foreground"
                  asChild
                >
                  <a href="/auth" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir Página de Login
                  </a>
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Google Calendar Integration */}
      <GoogleCalendarInstructionsCard />
    </>
  );
}
