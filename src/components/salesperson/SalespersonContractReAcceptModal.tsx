import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, Shield, Loader2, CheckCircle2, TrendingUp, Users, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface SalespersonContractReAcceptModalProps {
  open: boolean;
  currentVersion: string;
  onAccept: () => Promise<boolean>;
}

export const SalespersonContractReAcceptModal = ({
  open,
  currentVersion,
  onAccept,
}: SalespersonContractReAcceptModalProps) => {
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedMaintenance, setAcceptedMaintenance] = useState(false);
  const [acceptedChanges, setAcceptedChanges] = useState(false);

  const canAccept = acceptedTerms && acceptedMaintenance && acceptedChanges;

  const handleAccept = async () => {
    if (!canAccept) return;
    
    setIsLoading(true);
    try {
      const success = await onAccept();
      if (success) {
        toast.success('Contrato aceito com sucesso!');
      } else {
        toast.error('Erro ao aceitar o contrato. Tente novamente.');
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    toast.info('Você precisa aceitar o contrato para continuar usando a plataforma.');
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
              <DialogTitle className="text-xl">Atualização do Contrato de Parceiro PJ</DialogTitle>
              <Badge variant="secondary" className="mt-1">
                Versão {currentVersion}
              </Badge>
            </div>
          </div>
          <DialogDescription>
            O contrato de parceiro comercial foi atualizado. Por favor, revise as alterações e aceite para continuar usando a plataforma.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          {/* Principal Mudança - Cláusula 6 */}
          <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Nova Cláusula: Manutenção de Carteira e Faixas de Comissão
            </h4>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                A <strong>CLÁUSULA 6</strong> foi expandida para detalhar as regras de manutenção de carteira:
              </p>
              
              {/* Faixas de Comissão */}
              <div className="mt-3 p-3 bg-background rounded-md border">
                <h5 className="font-medium flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Faixas de Comissão por Clientes Ativos
                </h5>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="font-medium text-green-600">Integral (100%)</span>
                    <span>10+ clientes ativos</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="font-medium text-yellow-600">Reduzida (80%)</span>
                    <span>5-9 clientes ativos</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="font-medium text-orange-600">Mínima (50%)</span>
                    <span>1-4 clientes ativos</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="font-medium text-red-600">Suspensa (0%)</span>
                    <span>0 clientes ativos</span>
                  </div>
                </div>
              </div>

              {/* Avaliação */}
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <strong>Avaliação Trimestral:</strong> Janeiro, Abril, Julho, Outubro - no 1º dia útil
                </div>
              </div>

              {/* Período de Graça */}
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 text-green-600" />
                <div>
                  <strong>Período de Graça:</strong> 30 dias para regularizar carteira antes de rebaixamento
                </div>
              </div>

              {/* Reativação */}
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 text-blue-600" />
                <div>
                  <strong>Reativação:</strong> Pode recuperar faixas superiores a qualquer momento
                </div>
              </div>
            </div>
          </div>

          {/* Direitos Garantidos */}
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Seus Direitos Garantidos
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ <strong>Proteção Regional:</strong> Comissão integral mantida enquanto clientes ativos, mesmo sem novas vendas</li>
              <li>✓ <strong>Período de Graça:</strong> 30 dias para regularizar antes de rebaixamento</li>
              <li>✓ <strong>Reativação:</strong> Pode subir de faixa a qualquer momento</li>
              <li>✓ <strong>Notificação:</strong> 30 dias de antecedência para alterações</li>
              <li>✓ <strong>Rescisão:</strong> Sem multas se discordar das mudanças</li>
            </ul>
          </div>

          {/* Link para contrato completo */}
          <div className="mb-6 text-sm text-muted-foreground">
            <p>Documento completo:</p>
            <div className="flex gap-4 mt-2">
              <a 
                href="/vendedor/contrato/previa" 
                target="_blank" 
                className="text-primary hover:underline"
              >
                Ver Contrato Completo →
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
              Li e aceito os <strong>termos do contrato de parceiro comercial</strong> atualizados
            </Label>
          </div>
          
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="maintenance" 
              checked={acceptedMaintenance}
              onCheckedChange={(checked) => setAcceptedMaintenance(checked === true)}
            />
            <Label htmlFor="maintenance" className="text-sm cursor-pointer">
              Compreendo as <strong>faixas de comissão por manutenção de carteira</strong> e a avaliação trimestral
            </Label>
          </div>
          
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="changes" 
              checked={acceptedChanges}
              onCheckedChange={(checked) => setAcceptedChanges(checked === true)}
            />
            <Label htmlFor="changes" className="text-sm cursor-pointer">
              Compreendo que alterações serão comunicadas com <strong>30 dias de antecedência</strong> e posso rescindir sem multas
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
              'Aceito o Contrato'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
