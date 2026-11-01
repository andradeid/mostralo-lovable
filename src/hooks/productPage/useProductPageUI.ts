// Estado de tela da página do produto: quantidade, observações, gaveta do carrinho, checkout,
// login/cadastro do cliente e o modal de upsell.
import { useState } from 'react';
import type { Store } from '@/lib/productPage/types';
import type { Toast } from './useProductAddons';

export function useProductPageUI(store: Store | null, toast: Toast) {
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState('');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [customerRegisterOpen, setCustomerRegisterOpen] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [upsellTriggerProductId, setUpsellTriggerProductId] = useState<string | null>(null);

  // Verificar se o cliente está logado
  const isCustomerLoggedIn = () => {
    if (!store?.id) return false;

    const savedProfile = localStorage.getItem(`customer_${store.id}`);
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        return !!profile.name || !!profile.email;
      } catch (error) {
        return false;
      }
    }
    return false;
  };

  // Callback quando o cliente fizer login/registro com sucesso
  const handleAuthSuccess = (profile: any) => {
    setCustomerName(profile.name || null);
    setShowAuthDialog(false);
    setCustomerRegisterOpen(false);

    toast({
      title: "Login realizado!",
      description: `Bem-vindo, ${profile.name}! Agora você pode adicionar produtos ao carrinho.`,
    });
  };

  return {
    quantity, setQuantity,
    observations, setObservations,
    cartDrawerOpen, setCartDrawerOpen,
    showAuthDialog, setShowAuthDialog,
    customerRegisterOpen, setCustomerRegisterOpen,
    customerName, setCustomerName,
    checkoutOpen, setCheckoutOpen,
    showUpsellModal, setShowUpsellModal,
    upsellTriggerProductId, setUpsellTriggerProductId,
    isCustomerLoggedIn,
    handleAuthSuccess,
  };
}

export type ProductPageUI = ReturnType<typeof useProductPageUI>;
