import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePageSEO } from '@/hooks/useSEO';
import { Package, Sparkles, Clock } from 'lucide-react';

const ModulesPage = () => {
  usePageSEO({
    title: 'Módulos - Mostralo | Em Breve',
    description: 'Novos módulos e recursos estarão disponíveis em breve na plataforma Mostralo.',
    keywords: 'módulos mostralo, recursos, funcionalidades'
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          Gerenciamento de módulos e extensões do sistema
        </p>
      </div>

        {/* Card Principal - Em Breve */}
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <Package className="w-20 h-20 text-primary" />
                  <Sparkles className="w-8 h-8 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
                </div>
              </div>
              <CardTitle className="text-3xl">Novos Recursos em Breve</CardTitle>
              <CardDescription className="text-base">
                Estamos trabalhando em novos módulos e funcionalidades para tornar sua experiência ainda melhor
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <Clock className="w-5 h-5" />
                <span>Em desenvolvimento</span>
              </div>

              {/* Preview de Módulos Futuros */}
              <div className="space-y-3 pt-4">
                <h4 className="text-sm font-semibold text-center">O que está por vir:</h4>
                <div className="grid gap-3">
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Módulo de Integrações</p>
                      <p className="text-xs text-muted-foreground">
                        Conecte sua loja com WhatsApp, iFood, Rappi e mais
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Módulo de Marketing</p>
                      <p className="text-xs text-muted-foreground">
                        Campanhas por e-mail, SMS e notificações push
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Módulo de Fidelidade</p>
                      <p className="text-xs text-muted-foreground">
                        Programas de pontos e recompensas para clientes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Módulo de Análise Avançada</p>
                      <p className="text-xs text-muted-foreground">
                        Relatórios detalhados e insights sobre seu negócio
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Fique atento! Avisaremos assim que novos módulos estiverem disponíveis.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
};

export default ModulesPage;

