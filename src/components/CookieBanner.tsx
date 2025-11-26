import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Cookie, Shield, Settings, Info, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    functional: false
  });

  useEffect(() => {
    const cookieConsent = localStorage.getItem('cookie-consent');
    if (!cookieConsent) {
      // Delay para mostrar o banner após a página carregar
      setTimeout(() => setShowBanner(true), 2000);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('cookie-consent', JSON.stringify(allAccepted));
    setShowBanner(false);
    
    // Inicializar scripts de analytics/marketing aqui
    initializeTrackingScripts(allAccepted);
  };

  const handleAcceptSelected = () => {
    const selectedPreferences = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('cookie-consent', JSON.stringify(selectedPreferences));
    setShowBanner(false);
    setShowPreferences(false);
    
    // Inicializar apenas scripts aceitos
    initializeTrackingScripts(selectedPreferences);
  };

  const handleRejectAll = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('cookie-consent', JSON.stringify(essentialOnly));
    setShowBanner(false);
  };

  const initializeTrackingScripts = (prefs: any) => {
    if (prefs.analytics) {
      // Google Analytics
      console.log('Inicializando Google Analytics');
    }
    
    if (prefs.marketing) {
      // Facebook Pixel, Google Ads
      console.log('Inicializando scripts de marketing');
    }
    
    if (prefs.functional) {
      // Chat widgets, mapas
      console.log('Inicializando scripts funcionais');
    }
  };

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'essential') return; // Essential cookies não podem ser desabilitados
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg">
        <Card className="max-w-[1080px] mx-auto">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Cookie className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Nós utilizamos cookies 🍪</h3>
                  <p className="text-sm text-muted-foreground">
                    Este site utiliza cookies essenciais e outras tecnologias para melhorar sua experiência, 
                    personalizar conteúdo, exibir anúncios relevantes e analisar o tráfego. 
                    Ao continuar navegando, você concorda com nossa{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Política de Privacidade
                    </Link>{' '}
                    e{' '}
                    <Link to="/terms" className="text-primary hover:underline">
                      Termos de Uso
                    </Link>
                    .
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      LGPD Compliant
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Dados Seguros
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Personalizar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Cookie className="h-5 w-5" />
                        Preferências de Cookies
                      </DialogTitle>
                      <DialogDescription>
                        Gerencie suas preferências de cookies e privacidade. Você pode alterar essas configurações a qualquer momento.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                      {/* Essential Cookies */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">Cookies Essenciais</h4>
                            <p className="text-sm text-muted-foreground">
                              Necessários para o funcionamento básico do site
                            </p>
                          </div>
                          <Switch checked={true} disabled />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Incluem cookies de sessão, autenticação e preferências básicas. Sempre ativados.
                        </p>
                      </div>
                      
                      <Separator />
                      
                      {/* Analytics Cookies */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">Cookies de Análise</h4>
                            <p className="text-sm text-muted-foreground">
                              Nos ajudam a entender como você usa o site
                            </p>
                          </div>
                          <Switch 
                            checked={preferences.analytics}
                            onCheckedChange={(checked) => updatePreference('analytics', checked)}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Google Analytics, Hotjar. Dados anônimos para melhorar nossos serviços.
                        </p>
                      </div>
                      
                      <Separator />
                      
                      {/* Marketing Cookies */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">Cookies de Marketing</h4>
                            <p className="text-sm text-muted-foreground">
                              Para exibir anúncios relevantes
                            </p>
                          </div>
                          <Switch 
                            checked={preferences.marketing}
                            onCheckedChange={(checked) => updatePreference('marketing', checked)}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Facebook Pixel, Google Ads. Publicidade personalizada baseada em seus interesses.
                        </p>
                      </div>
                      
                      <Separator />
                      
                      {/* Functional Cookies */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">Cookies Funcionais</h4>
                            <p className="text-sm text-muted-foreground">
                              Recursos avançados e personalização
                            </p>
                          </div>
                          <Switch 
                            checked={preferences.functional}
                            onCheckedChange={(checked) => updatePreference('functional', checked)}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Chat ao vivo, mapas interativos, preferências de idioma.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button onClick={handleAcceptSelected} className="flex-1">
                        Salvar Preferências
                      </Button>
                      <Button variant="outline" onClick={() => setShowPreferences(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline" size="sm" onClick={handleRejectAll}>
                  Rejeitar Tudo
                </Button>
                <Button size="sm" onClick={handleAcceptAll} className="bg-primary">
                  Aceitar Tudo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Floating Cookie Settings Button */}
      <button
        onClick={() => setShowBanner(true)}
        className="fixed left-4 bottom-4 z-40 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
        title="Configurações de Cookies"
      >
        <Cookie className="h-5 w-5 group-hover:scale-110 transition-transform" />
      </button>
    </>
  );
};