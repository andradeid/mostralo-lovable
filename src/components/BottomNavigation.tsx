import { useNavigate } from 'react-router-dom';
import { Home, Receipt, User, Tag, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BottomNavigationProps {
  currentRoute: 'home' | 'promotions' | 'orders' | 'profile';
  storeSlug?: string;
  pendingOrdersCount?: number;
  promotionsCount?: number;
  customerName?: string | null;
  onOpenAuth?: () => void;
}

export default function BottomNavigation({ 
  currentRoute, 
  storeSlug,
  pendingOrdersCount = 0,
  promotionsCount = 0,
  customerName = null,
  onOpenAuth
}: BottomNavigationProps) {
  const navigate = useNavigate();

  const items = [
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
    {
      id: 'orders',
      label: 'Pedidos',
      icon: Receipt,
      onClick: () => storeSlug && navigate(`/painel-cliente/${storeSlug}`),
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-50 pb-safe">
      <div className="grid grid-cols-4 h-16">
        {items.map((item) => {
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
                {item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-xs ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
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
