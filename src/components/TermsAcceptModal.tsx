import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, Shield, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TermsAcceptModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  userType?: 'customer' | 'business';
}

export const TermsAcceptModal = ({ 
  isOpen, 
  onAccept, 
  onDecline,
  userType = 'customer' 
}: TermsAcceptModalProps) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedCookies, setAcceptedCookies] = useState(false);
  const [acceptedMarketing, setAcceptedMarketing] = useState(false);

  const canProceed = acceptedTerms && acceptedPrivacy && acceptedCookies;

  const handleAccept = () => {
    if (!canProceed) return;
    
    const consent = {
      terms: acceptedTerms,
      privacy: acceptedPrivacy,
      cookies: acceptedCookies,
      marketing: acceptedMarketing,
      timestamp: new Date().toISOString(),
      userType,
      ip: 'unknown', // Em produção, capturar IP real
      userAgent: navigator.userAgent
    };
    
    localStorage.setItem('legal-consent', JSON.stringify(consent));
    onAccept();
  };

  const resetForm = () => {
    setAcceptedTerms(false);
    setAcceptedPrivacy(false);
    setAcceptedCookies(false);
    setAcceptedMarketing(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-6 w-6 text-primary" />
              Termos de Uso e Política de Privacidade
            </DialogTitle>
            <DialogDescription>
              Para continuar usando o Mostralo, você precisa aceitar nossos termos e políticas.
              {userType === 'business' && ' Como usuário empresarial, termos adicionais se aplicam.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6">
              <div className="space-y-6 py-4">
                {/* Warning Banner */}
                <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <h4 className="font-semibold text-amber-800 dark:text-amber-300">
                          Leia com Atenção
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Estes termos contêm informações importantes sobre seus direitos, 
                          responsabilidades e como processamos seus dados pessoais.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumo dos Termos */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Resumo dos Principais Pontos</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm">Seus Dados</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Coletamos apenas dados necessários para o serviço. 
                              Você pode exportar ou deletar seus dados a qualquer momento.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm">Uso do Serviço</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Plataforma para criar cardápios digitais. 
                              Uso comercial permitido. Conteúdo é de sua responsabilidade.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm">Pagamentos</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Cobrança mensal. Cancelamento a qualquer momento. 
                              Reembolso proporcional em casos específicos.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm">Responsabilidades</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Você é responsável pelo conteúdo publicado. 
                              Somos um provedor de tecnologia, não de alimentos.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                {/* Consentimentos Obrigatórios */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Consentimentos Necessários</h3>
                  
                  <div className="space-y-4">
                    {/* Termos de Uso */}
                    <Card className={`transition-all ${acceptedTerms ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            id="terms"
                            checked={acceptedTerms}
                            onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <label htmlFor="terms" className="font-semibold text-sm cursor-pointer">
                              Li e aceito os Termos de Uso *
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Concordo com as condições de uso da plataforma, responsabilidades, 
                              limitações e políticas de cancelamento.
                            </p>
                            <Link 
                              to="/terms" 
                              target="_blank"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              Ler Termos Completos
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Política de Privacidade */}
                    <Card className={`transition-all ${acceptedPrivacy ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            id="privacy"
                            checked={acceptedPrivacy}
                            onCheckedChange={(checked) => setAcceptedPrivacy(checked === true)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <label htmlFor="privacy" className="font-semibold text-sm cursor-pointer">
                              Li e aceito a Política de Privacidade *
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Concordo com o tratamento dos meus dados pessoais conforme LGPD,
                              incluindo coleta, uso, armazenamento e compartilhamento.
                            </p>
                            <Link 
                              to="/privacy" 
                              target="_blank"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              Ler Política Completa
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cookies */}
                    <Card className={`transition-all ${acceptedCookies ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            id="cookies"
                            checked={acceptedCookies}
                            onCheckedChange={(checked) => setAcceptedCookies(checked === true)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <label htmlFor="cookies" className="font-semibold text-sm cursor-pointer">
                              Aceito o uso de cookies essenciais *
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Permito o uso de cookies necessários para funcionamento básico,
                              autenticação e preferências. Cookies opcionais podem ser configurados depois.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Marketing (Opcional) */}
                    <Card className="border-dashed">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            id="marketing"
                            checked={acceptedMarketing}
                            onCheckedChange={(checked) => setAcceptedMarketing(checked === true)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <label htmlFor="marketing" className="font-semibold text-sm cursor-pointer">
                              Aceito receber comunicações de marketing
                            </label>
                            <Badge variant="secondary" className="text-xs">Opcional</Badge>
                            <p className="text-xs text-muted-foreground">
                              Emails sobre novos recursos, dicas de uso, ofertas especiais.
                              Você pode cancelar a qualquer momento.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {userType === 'business' && (
                  <>
                    <Separator />
                    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                          Termos Empresariais Adicionais
                        </h4>
                        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                          <li>• Você é responsável pela veracidade das informações dos produtos</li>
                          <li>• Deve cumprir regulamentações sanitárias e fiscais aplicáveis</li>
                          <li>• Preços e disponibilidade devem ser mantidos atualizados</li>
                          <li>• Atendimento ao cliente é de sua responsabilidade</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="border-t p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={onDecline}
                className="flex-1"
              >
                Não Aceito
              </Button>
              <Button 
                onClick={handleAccept}
                disabled={!canProceed}
                className="flex-1"
              >
                {canProceed ? 'Aceito e Continuar' : 'Aceite os termos obrigatórios'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Ao aceitar, você confirma ter lido e compreendido todos os termos e políticas.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};