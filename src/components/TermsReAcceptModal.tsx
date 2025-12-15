import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface TermsReAcceptModalProps {
  open: boolean;
  currentVersion: string;
  changelog: string | null;
  onAccept: () => Promise<boolean>;
}

export const TermsReAcceptModal = ({
  open,
  currentVersion,
  changelog,
  onAccept,
}: TermsReAcceptModalProps) => {
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedChanges, setAcceptedChanges] = useState(false);

  const canAccept = acceptedTerms && acceptedPrivacy && acceptedChanges;

  const handleAccept = async () => {
    if (!canAccept) return;
    
    setIsLoading(true);
    try {
      const success = await onAccept();
      if (success) {
        toast.success('Termos aceitos com sucesso!');
      } else {
        toast.error('Erro ao aceitar os termos. Tente novamente.');
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    toast.info('Você precisa aceitar os termos para continuar usando a plataforma.');
    await signOut('/');
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Atualização dos Termos de Uso</DialogTitle>
              <Badge variant="secondary" className="mt-1">
                Versão {currentVersion}
              </Badge>
            </div>
          </div>
          <DialogDescription>
            Nossos termos de uso foram atualizados. Por favor, revise as alterações e aceite para continuar usando a plataforma.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          {/* Changelog */}
          {changelog && (
            <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                O que mudou nesta versão:
              </h4>
              <p className="text-sm text-muted-foreground">{changelog}</p>
            </div>
          )}

          {/* Nova Cláusula em Destaque */}
          <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Nova Cláusula: Evolução e Alteração Contratual
            </h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>10.1.</strong> A CONTRATADA reserva-se o direito de promover alterações nestes termos a qualquer momento, visando:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Sustentabilidade operacional e financeira da empresa</li>
                <li>Melhoria contínua dos serviços</li>
                <li>Adequação às mudanças do mercado, legislação ou tecnologia</li>
                <li>Proteção dos interesses legítimos de todas as partes</li>
              </ul>
              <p className="mt-3">
                <strong>10.2.</strong> Alterações serão comunicadas com <strong>antecedência mínima de 30 dias</strong>.
              </p>
              <p>
                <strong>10.4.</strong> Você poderá solicitar rescisão <strong>sem multas ou penalidades</strong> se não concordar com alterações.
              </p>
            </div>
          </div>

          {/* Direitos do Usuário */}
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-green-700 dark:text-green-400">
              <Shield className="h-4 w-4" />
              Seus Direitos Garantidos
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Notificação com 30 dias de antecedência para qualquer alteração</li>
              <li>✓ Direito de rescisão sem multas se discordar das mudanças</li>
              <li>✓ Alterações financeiras sempre comunicadas individualmente</li>
              <li>✓ Exportação de dados por 30 dias após rescisão</li>
            </ul>
          </div>

          {/* Links para documentos completos */}
          <div className="mb-6 text-sm text-muted-foreground">
            <p>Documentos completos:</p>
            <div className="flex gap-4 mt-2">
              <a 
                href="/termos" 
                target="_blank" 
                className="text-primary hover:underline"
              >
                Termos de Uso →
              </a>
              <a 
                href="/privacidade" 
                target="_blank" 
                className="text-primary hover:underline"
              >
                Política de Privacidade →
              </a>
            </div>
          </div>
        </ScrollArea>

        {/* Checkboxes de Aceite */}
        <div className="space-y-3 py-4 border-t">
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="terms" 
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            />
            <Label htmlFor="terms" className="text-sm cursor-pointer">
              Li e aceito os <strong>Termos de Uso</strong> atualizados
            </Label>
          </div>
          
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="privacy" 
              checked={acceptedPrivacy}
              onCheckedChange={(checked) => setAcceptedPrivacy(checked === true)}
            />
            <Label htmlFor="privacy" className="text-sm cursor-pointer">
              Li e aceito a <strong>Política de Privacidade</strong>
            </Label>
          </div>
          
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="changes" 
              checked={acceptedChanges}
              onCheckedChange={(checked) => setAcceptedChanges(checked === true)}
            />
            <Label htmlFor="changes" className="text-sm cursor-pointer">
              Compreendo que a empresa pode alterar os termos com <strong>30 dias de antecedência</strong> e que posso rescindir sem multas se discordar
            </Label>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={handleDecline}
            disabled={isLoading}
            className="flex-1"
          >
            Não Aceito (Sair)
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={!canAccept || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Aceito os Termos'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
