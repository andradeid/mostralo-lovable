import { useNavigate } from 'react-router-dom';
import { Home, Receipt, User, Tag, Store, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BottomNavigationProps {
  currentRoute: 'home' | 'promotions' | 'orders' | 'profile';
  storeSlug?: string;
  pendingOrdersCount?: number;
  promotionsCount?: number;
  customerName?: string | null;
  onOpenAuth?: () => void;
  cartItemsCount?: number;
  onCartClick?: () => void;
  cartColor?: string;
}

export default function BottomNavigation({ 
  currentRoute, 
  storeSlug,
  pendingOrdersCount = 0,
  promotionsCount = 0,
  customerName = null,
  onOpenAuth,
  cartItemsCount = 0,
  onCartClick,
  cartColor = 'hsl(var(--primary))'
}: BottomNavigationProps) {
  const navigate = useNavigate();

  const leftItems = [
    {
      id: 'home',
      label: 'Início',
      icon: Home,
      onClick: () => storeSlug && navigate(`/loja/${storeSlug}`),
      disabled: !storeSlug,
    },
    {
      id: 'promotions',
      label: 'Promoções',
      icon: Tag,
      onClick: () => storeSlug && navigate(`/loja/${storeSlug}/promocoes`),
      badge: promotionsCount,
    },
  ];

  const rightItems = [
    {
      id: 'orders',
      label: 'Pedidos',
      icon: Receipt,
      onClick: () => storeSlug && navigate(`/loja/${storeSlug}/meus-pedidos`),
      badge: pendingOrdersCount,
    },
    {
      id: 'profile',
      label: customerName ? 'Perfil' : 'Login',
      icon: User,
      onClick: () => {
        if (!customerName && onOpenAuth) {
          onOpenAuth();
        } else if (storeSlug) {
          navigate(`/painel-cliente/${storeSlug}/perfil`);
        }
      },
    },
  ];

  const renderItem = (item: typeof leftItems[0]) => {
    const isActive = currentRoute === item.id;
    const Icon = item.icon;
    
    return (
      <button
        key={item.id}
        onClick={item.onClick}
        disabled={item.disabled}
        className={`
          flex flex-col items-center justify-center gap-1
          transition-colors relative
          ${isActive ? 'text-primary' : 'text-muted-foreground'}
          ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-primary'}
        `}
      >
        <div className="relative">
          <Icon className={`h-6 w-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
          {'badge' in item && (item as any).badge > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {(item as any).badge > 9 ? '9+' : (item as any).badge}
            </Badge>
          )}
        </div>
        <span className={`text-xs ${isActive ? 'font-semibold' : ''}`}>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-50 pb-safe">
      <div className="grid grid-cols-5 h-16 relative">
        {/* Left items */}
        {leftItems.map(renderItem)}

        {/* Center cart button */}
        <div className="flex items-center justify-center">
          <button
            onClick={onCartClick}
            className="relative -mt-5 flex items-center justify-center w-12 h-12 rounded-full shadow-md border-[3px] border-card transition-transform hover:scale-105 active:scale-95 bg-muted"
            style={cartItemsCount > 0 ? { backgroundColor: cartColor } : undefined}
            aria-label="Carrinho"
          >
            <ShoppingBag className={`h-5 w-5 ${cartItemsCount > 0 ? 'text-white' : 'text-muted-foreground'}`} />
            {cartItemsCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
              >
                {cartItemsCount > 9 ? '9+' : cartItemsCount}
              </Badge>
            )}
          </button>
        </div>

        {/* Right items */}
        {rightItems.map(renderItem)}
      </div>
      
      {/* Linha Mostralo - discreta */}
      <div className="border-t py-1.5 bg-card/95">
        <a 
          href="https://mostralo.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 hover:opacity-70 transition-opacity"
        >
          <span className="text-[10px] text-muted-foreground">Feito por</span>
          <Store className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-semibold text-primary">Mostralo</span>
        </a>
      </div>
    </nav>
  );
}
