// Estado de tela da página da loja: diálogos/gavetas, cabeçalho fixo ao rolar,
// instalação do app (PWA) e o evento que abre o login do cliente a partir do checkout.
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { StorePageProduct } from './storePageTypes';

export function useStorePageUI() {
  const [selectedProduct, setSelectedProduct] = useState<StorePageProduct | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [customerRegisterOpen, setCustomerRegisterOpen] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [storeInfoDrawerOpen, setStoreInfoDrawerOpen] = useState(false);
  const { toast } = useToast();

  // Ouvir evento de autenticação do checkout
  useEffect(() => {
    const handleOpenAuth = () => {
      setShowAuthDialog(true);
    };

    window.addEventListener('openCustomerAuth', handleOpenAuth);

    return () => {
      window.removeEventListener('openCustomerAuth', handleOpenAuth);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 200;
      setShowStickyHeader(scrolled);
    };

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  const isStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any)?.standalone;
  };

  const installPWA = async () => {
    // Se já está instalado como PWA
    if (isStandalone()) {
      toast({
        title: 'App já instalado!',
        description: 'O aplicativo já está instalado em seu dispositivo.',
      });
      return;
    }

    if (deferredPrompt) {
      // Instalação direta para browsers que suportam
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          toast({
            title: 'App instalado!',
            description: 'O aplicativo foi instalado com sucesso.',
          });
        } else {
          toast({
            title: 'Instalação cancelada',
            description: 'Você pode instalar o app a qualquer momento.',
          });
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Erro na instalação:', error);
        showManualInstructions();
      }
    } else {
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    if (isIOS()) {
      toast({
        title: 'Instalar no iOS',
        description: 'Toque no botão de compartilhar (⬆️) e selecione "Adicionar à Tela de Início".',
        duration: 8000,
      });
    } else {
      // Android/Chrome/Edge
      toast({
        title: 'Instalar App',
        description: 'Toque no menu do navegador (⋮) e selecione "Instalar app" ou "Adicionar à tela inicial".',
        duration: 8000,
      });
    }
  };

  const handleOpenCheckout = async () => {
    // Abrir o CheckoutDialog diretamente (guest checkout, sem necessidade de login)
    setCartDrawerOpen(false);
    setCheckoutDialogOpen(true);
  };

  return {
    selectedProduct, setSelectedProduct, showProductDetail, setShowProductDetail,
    showStickyHeader, deferredPrompt,
    cartDrawerOpen, setCartDrawerOpen, checkoutDialogOpen, setCheckoutDialogOpen,
    customerRegisterOpen, setCustomerRegisterOpen, showAuthDialog, setShowAuthDialog,
    storeInfoDrawerOpen, setStoreInfoDrawerOpen,
    isIOS, isStandalone, installPWA, handleOpenCheckout,
  };
}
