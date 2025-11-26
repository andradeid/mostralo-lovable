import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(isInStandaloneMode);

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      if (!wasDismissed && !isInStandaloneMode) {
        setTimeout(() => {
          setShowInstallDialog(true);
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA instalado com sucesso');
    }
    
    setDeferredPrompt(null);
    setShowInstallDialog(false);
  };

  const handleDismiss = () => {
    setShowInstallDialog(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (isStandalone || dismissed) return null;

  return (
    <>
      {deferredPrompt && !showInstallDialog && (
        <Alert className="m-4 border-primary bg-primary/10">
          <Smartphone className="h-5 w-5 text-primary" />
          <AlertTitle className="text-foreground">
            📱 Instale o App de Entregas
          </AlertTitle>
          <AlertDescription className="text-muted-foreground flex items-center justify-between gap-2 flex-wrap">
            <span>Receba notificações mesmo com navegador fechado!</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleInstallClick}>
                Instalar
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Instale o App de Entregas
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <div className="space-y-2">
                <p className="font-semibold text-foreground">🔔 Benefícios:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Receba notificações de novos pedidos</li>
                  <li>Alertas sonoros mesmo com app minimizado</li>
                  <li>Acesso rápido na tela inicial</li>
                  <li>Funciona offline</li>
                  <li>Sem ocupar espaço com downloads</li>
                </ul>
              </div>

              {isIOS ? (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="font-semibold text-foreground">📱 Como instalar no iPhone:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Toque no ícone <strong>Compartilhar</strong> ↗️</li>
                    <li>Role para baixo e toque em <strong>"Adicionar à Tela Inicial"</strong></li>
                    <li>Toque em <strong>"Adicionar"</strong></li>
                  </ol>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleInstallClick} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Instalar Agora
                  </Button>
                  <Button variant="outline" onClick={handleDismiss}>
                    Agora Não
                  </Button>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
