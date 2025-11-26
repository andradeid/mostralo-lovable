import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, Download, Trash2, Settings, Shield, AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface DataProcessingActivity {
  id: string;
  name: string;
  purpose: string;
  dataTypes: string[];
  retention: string;
  thirdParties: string[];
  legal_basis: string;
  required: boolean;
  active: boolean;
}

export const PrivacyConsent = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [dataActivities, setDataActivities] = useState<DataProcessingActivity[]>([
    {
      id: 'essential',
      name: 'Dados Essenciais',
      purpose: 'Funcionamento básico da plataforma',
      dataTypes: ['Email', 'Nome', 'Dados de autenticação'],
      retention: '2 anos após inatividade',
      thirdParties: ['Supabase (hospedagem)'],
      legal_basis: 'Execução de contrato',
      required: true,
      active: true
    },
    {
      id: 'analytics',
      name: 'Análise de Uso',
      purpose: 'Melhorar experiência do usuário',
      dataTypes: ['Páginas visitadas', 'Tempo de uso', 'Dispositivo'],
      retention: '26 meses',
      thirdParties: ['Google Analytics'],
      legal_basis: 'Interesse legítimo',
      required: false,
      active: false
    },
    {
      id: 'marketing',
      name: 'Marketing e Comunicação',
      purpose: 'Envio de ofertas e novidades',
      dataTypes: ['Email', 'Preferências', 'Histórico de compras'],
      retention: 'Até cancelamento',
      thirdParties: ['MailChimp', 'Facebook'],
      legal_basis: 'Consentimento',
      required: false,
      active: false
    },
    {
      id: 'personalization',
      name: 'Personalização',
      purpose: 'Customizar interface e sugestões',
      dataTypes: ['Preferências', 'Configurações', 'Uso da plataforma'],
      retention: '1 ano',
      thirdParties: [],
      legal_basis: 'Consentimento',
      required: false,
      active: false
    }
  ]);

  const [showDataExport, setShowDataExport] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');

  useEffect(() => {
    const savedConsent = localStorage.getItem('privacy-consent');
    if (savedConsent) {
      try {
        const consent = JSON.parse(savedConsent);
        setDataActivities(prev => prev.map(activity => ({
          ...activity,
          active: consent[activity.id] ?? activity.required
        })));
      } catch (error) {
        console.error('Erro ao carregar consentimentos:', error);
      }
    }
  }, []);

  const updateConsent = (activityId: string, active: boolean) => {
    if (activityId === 'essential') return; // Essencial não pode ser desabilitado
    
    setDataActivities(prev => {
      const updated = prev.map(activity => 
        activity.id === activityId ? { ...activity, active } : activity
      );
      
      // Salvar no localStorage
      const consent = updated.reduce((acc, activity) => ({
        ...acc,
        [activity.id]: activity.active
      }), {});
      
      localStorage.setItem('privacy-consent', JSON.stringify({
        ...consent,
        timestamp: new Date().toISOString()
      }));
      
      return updated;
    });
  };

  const handleDataExport = async () => {
    setExportStatus('generating');
    
    // Simular geração do export
    setTimeout(() => {
      const userData = {
        user_info: {
          email: 'usuario@exemplo.com',
          name: 'Nome do Usuário',
          created_at: '2024-01-01T00:00:00Z',
          last_login: new Date().toISOString()
        },
        consent_history: JSON.parse(localStorage.getItem('privacy-consent') || '{}'),
        platform_data: {
          stores_created: 1,
          products_added: 15,
          orders_processed: 45
        },
        settings: {
          theme: 'system',
          language: 'pt-BR',
          notifications: true
        }
      };
      
      const blob = new Blob([JSON.stringify(userData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mostralo-dados-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportStatus('ready');
      setTimeout(() => setExportStatus('idle'), 3000);
    }, 2000);
  };

  const handleDataDeletion = () => {
    if (confirm('Tem certeza que deseja solicitar a exclusão dos seus dados? Esta ação é irreversível.')) {
      alert('Solicitação de exclusão enviada. Entraremos em contato em até 30 dias.');
    }
  };

  const getLegalBasisColor = (basis: string) => {
    switch (basis) {
      case 'Execução de contrato': return 'bg-blue-100 text-blue-800';
      case 'Interesse legítimo': return 'bg-yellow-100 text-yellow-800';
      case 'Consentimento': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {/* Privacy Settings Trigger */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            data-privacy-trigger
            className="hidden"
            title="Configurações de Privacidade"
          >
            <Shield className="h-4 w-4 mr-2" />
            Privacidade
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Central de Privacidade
            </DialogTitle>
            <DialogDescription>
              Gerencie seus dados pessoais e configure suas preferências de privacidade.
              Todos os controles estão em suas mãos.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6">
              <div className="space-y-6 py-4">
                {/* Status Compliance */}
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <h4 className="font-semibold text-green-800 dark:text-green-300">
                          Proteção LGPD Ativa
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-400">
                          Seus dados estão protegidos conforme a Lei Geral de Proteção de Dados
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Atividades de Processamento */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Atividades de Processamento de Dados</h3>
                  
                  <div className="space-y-3">
                    {dataActivities.map((activity) => (
                      <Card key={activity.id} className="transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={activity.active}
                                onCheckedChange={(checked) => updateConsent(activity.id, checked)}
                                disabled={activity.required}
                              />
                              <div>
                                <h4 className="font-semibold text-sm">{activity.name}</h4>
                                {activity.required && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    Obrigatório
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getLegalBasisColor(activity.legal_basis)}`}
                            >
                              {activity.legal_basis}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {activity.purpose}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div>
                              <h5 className="font-semibold mb-1">Dados Coletados:</h5>
                              <ul className="text-muted-foreground space-y-1">
                                {activity.dataTypes.map((type, index) => (
                                  <li key={index}>• {type}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h5 className="font-semibold mb-1">Retenção:</h5>
                              <p className="text-muted-foreground">{activity.retention}</p>
                            </div>
                            
                            <div>
                              <h5 className="font-semibold mb-1">Terceiros:</h5>
                              {activity.thirdParties.length > 0 ? (
                                <ul className="text-muted-foreground space-y-1">
                                  {activity.thirdParties.map((party, index) => (
                                    <li key={index}>• {party}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-muted-foreground">Nenhum</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Seus Direitos */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Seus Direitos LGPD</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Exportar Dados */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Download className="h-5 w-5" />
                          Exportar Meus Dados
                        </CardTitle>
                        <CardDescription>
                          Baixe uma cópia de todos os seus dados em formato JSON
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={handleDataExport}
                          disabled={exportStatus === 'generating'}
                          className="w-full"
                          variant="outline"
                        >
                          {exportStatus === 'generating' && (
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          {exportStatus === 'generating' ? 'Gerando...' : 
                           exportStatus === 'ready' ? 'Download Concluído!' : 
                           'Baixar Dados'}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Solicitar Exclusão */}
                    <Card className="border-red-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-red-700">
                          <Trash2 className="h-5 w-5" />
                          Excluir Meus Dados
                        </CardTitle>
                        <CardDescription>
                          Solicite a exclusão permanente de todos os seus dados
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={handleDataDeletion}
                          variant="destructive"
                          className="w-full"
                        >
                          Solicitar Exclusão
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Processo irreversível. Resposta em até 30 dias.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Informações de Contato */}
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                          Dúvidas sobre Privacidade?
                        </h4>
                        <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                          <p><strong>DPO (Encarregado):</strong> privacidade@mostralo.com</p>
                          <p><strong>Telefone:</strong> (11) 3456-7890</p>
                          <p><strong>Endereço:</strong> Rua das Flores, 123 - São Paulo/SP</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>

          <div className="border-t p-6">
            <Button onClick={() => setShowSettings(false)} className="w-full">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};