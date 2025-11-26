import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Store as StoreIcon, 
  Phone, 
  MapPin, 
  Clock,
  MessageCircle,
  Search,
  ShoppingCart,
  User
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface Store {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
  phone?: string;
  address?: string;
  theme_colors: any;
  configuration?: {
    primary_color?: string;
    secondary_color?: string;
  };
}

interface StoreHeaderProps {
  store: Store;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  onCartClick?: () => void;
}

export function StoreHeader({ 
  store, 
  searchTerm = '', 
  onSearchChange,
  showSearch = true,
  onCartClick 
}: StoreHeaderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { getTotalPrice, getTotalItems } = useCart();

  const primaryColor = store?.configuration?.primary_color || store?.theme_colors?.primary || '#3B82F6';

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  const installPWA = async () => {
    if (deferredPrompt) {
      try {
        const { outcome } = await deferredPrompt.prompt();
        if (outcome === 'accepted') {
          console.log('PWA instalado com sucesso');
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
      // iOS manual instructions would be shown via toast
    } else {
      // Android/Chrome/Edge manual instructions would be shown via toast
    }
  };

  const getCategoryEmoji = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('cozinha') || name.includes('bar')) return '🏗️';
    if (name.includes('futevôlei')) return '⚽';
    if (name.includes('beach tennis') || name.includes('tennis')) return '🎾';
    if (name.includes('vôlei') || name.includes('volei')) return '🏐';
    if (name.includes('funcional')) return '🏃';
    if (name.includes('locação') || name.includes('locacao')) return '🏗️';
    if (name.includes('pratos') || name.includes('prato')) return '🍽️';
    if (name.includes('petiscos') || name.includes('petisco')) return '🍤';
    return '';
  };

  return (
    <>
      {/* Barra Superior - Mobile/Tablet */}
      <div 
        className="lg:hidden text-white px-4 py-3"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center justify-between">
          {/* Menu Hambúrguer */}
          <div>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          
          {/* Carrinho */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={onCartClick}>
            <div className="bg-black/50 px-3 py-1 rounded text-sm font-medium">
              R$ {getTotalPrice().toFixed(2)}
            </div>
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs bg-red-500 text-white flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra Superior - Desktop */}
      <div 
        className="hidden lg:block text-white px-4 py-2"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center justify-between text-sm max-w-[1080px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>Pedido mínimo: R$ 0,00</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>Olá Visitante</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Estabelecimento aberto</span>
          </div>
        </div>
      </div>

      {/* Header Principal - Mobile/Tablet */}
      <div className="lg:hidden bg-white px-4 py-4">
        {/* Layout Mobile */}
        <div className="md:hidden">
          {/* Logo Centralizada */}
          <div className="text-center mb-4">
            {store?.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-20 h-20 rounded-full object-cover mx-auto"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                <StoreIcon className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Nome e Descrição */}
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-foreground mb-1">{store?.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 flex-wrap">
              {getCategoryEmoji('cozinha')} Cozinha-Bar {getCategoryEmoji('futevôlei')}Futevôlei {getCategoryEmoji('beach tennis')}Beach tennis {getCategoryEmoji('vôlei')}Vôlei de praia {getCategoryEmoji('funcional')}Funcional {getCategoryEmoji('locação')}Locação
            </p>
          </div>

          {/* Status Aberto */}
          <div className="mb-4">
            <Button 
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3"
            >
              🏪 Aberto para Pedidos
            </Button>
          </div>

          {/* Botões de Instalação */}
          <div className="space-y-2 mb-4">
            <Button 
              variant="outline" 
              className="w-full py-3 text-gray-700 border-gray-300"
              onClick={installPWA}
            >
              📱 Instale nosso App - Android
            </Button>
            <Button 
              variant="outline" 
              className="w-full py-3 text-gray-700 border-gray-300"
              onClick={installPWA}
            >
              🍎 Instale nosso App - IOS
            </Button>
          </div>

          {/* Informações */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Pedido mínimo:</p>
                <p className="text-sm text-gray-600">R$ 0,00</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Compartilhe</p>
                <p className="text-sm text-gray-600">no WhatsAPP</p>
              </div>
            </div>
          </div>

          {/* Barra de Busca - Mobile */}
          {showSearch && (
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Digite sua busca..."
                value={searchTerm}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10 w-full bg-background border border-muted rounded-lg py-3"
              />
            </div>
          )}
        </div>

        {/* Layout Tablet */}
        <div className="hidden md:block">
          <div className="max-w-[1080px] mx-auto">
            {/* Linha 1: Logo + Nome */}
            <div className="flex items-center gap-3 mb-3">
              {store?.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <StoreIcon className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <h1 className="text-lg font-bold text-foreground">{store?.name}</h1>
            </div>

            {/* Linha 2: Descrição ou Categorias */}
            <div className="mb-3">
              {store?.description ? (
                <p className="text-sm text-muted-foreground">{store.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
                  {getCategoryEmoji('cozinha')} Cozinha-Bar {getCategoryEmoji('futevôlei')} Futevôlei {getCategoryEmoji('beach tennis')} Beach tennis {getCategoryEmoji('vôlei')} Vôlei de praia {getCategoryEmoji('funcional')} Funcional {getCategoryEmoji('locação')} Locação
                </p>
              )}
            </div>

            {/* Linha 3: Busca + Minha Conta + Carrinho */}
            <div className="flex items-center gap-3">
              {/* Busca */}
              {showSearch && (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Digite sua busca..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="pl-10 w-full bg-background border border-muted rounded-lg"
                  />
                </div>
              )}

              {/* Minha Conta */}
              <Button 
                variant="outline"
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap"
                aria-label="Minha conta"
              >
                <User className="w-4 h-4" />
                <span>Minha conta</span>
              </Button>

              {/* Carrinho */}
              <button
                type="button"
                onClick={onCartClick}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                aria-label="Abrir carrinho"
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full text-xs bg-red-500 text-white flex items-center justify-center">
                      {getTotalItems()}
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-primary">
                  R$ {getTotalPrice().toFixed(2)}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Header Principal - Desktop */}
      <div className="hidden lg:block bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between max-w-[1080px] mx-auto">
          {/* Logo e Informações da Loja */}
          <div className="flex items-center gap-4">
            {store?.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <StoreIcon className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            
            <div>
              <h1 className="text-2xl font-bold text-foreground">{store?.name}</h1>
              <p className="text-sm text-muted-foreground">{store?.description}</p>
              <div className="flex items-center mt-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                <span>Seg - Dom: 08:00 - 22:00</span>
              </div>
            </div>
          </div>

          {/* Barra de Busca e Carrinho */}
          <div className="flex items-center gap-4">
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Digite sua busca..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="pl-10 w-80 bg-background"
                />
              </div>
            )}
            
            <div className="flex items-center gap-3 cursor-pointer" onClick={onCartClick}>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total do pedido</p>
                <p className="font-bold text-lg">R$ {getTotalPrice().toFixed(2)}</p>
              </div>
              <div className="relative">
                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs bg-red-500 text-white flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}