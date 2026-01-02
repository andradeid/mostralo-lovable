import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  Home,
  ShoppingCart,
  Users,
  BarChart3,
  Package,
  Settings,
  LogOut,
  Monitor,
  Receipt,
  UtensilsCrossed,
  Tag,
  Grid,
  Plus,
  Grid3X3,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useAttendantPermissions, PermissionKey } from "@/hooks/useAttendantPermissions";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { cn } from "@/lib/utils";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  permissionKey?: PermissionKey | null;
}

export function MobileAdminNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile, userRole } = useAuth();
  const { storeId } = useStoreAccess();
  
  const attendantPermissions = useAttendantPermissions({
    userId: userRole === 'attendant' ? (profile?.id ?? '') : '',
    storeId: userRole === 'attendant' ? (storeId ?? '') : ''
  });

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (url: string) => {
    navigate(url);
    setOpen(false);
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
  };

  // Menu items baseado no tipo de usuário
  const getMenuItems = (): MenuItem[] => {
    if (userRole === 'attendant') {
      const allItems: MenuItem[] = [
        { title: 'Pedidos', url: '/dashboard/orders', icon: ShoppingCart, permissionKey: null },
        { title: 'PDV', url: '/dashboard/pdv', icon: Monitor, permissionKey: 'pdv' },
        { title: 'Comandas', url: '/dashboard/comandas', icon: Receipt, permissionKey: 'comandas' },
        { title: 'Cozinha (KDS)', url: '/dashboard/cozinha', icon: UtensilsCrossed, permissionKey: 'kds' },
        { title: 'Clientes', url: '/dashboard/customers', icon: Users, permissionKey: 'clientes' },
        { title: 'Relatórios', url: '/dashboard/reports', icon: BarChart3, permissionKey: 'relatorios' },
        { title: 'Produtos', url: '/dashboard/products', icon: Package, permissionKey: 'produtos' },
        { title: 'Categorias', url: '/dashboard/categories', icon: Grid, permissionKey: 'produtos' },
        { title: 'Adicionais', url: '/dashboard/addons', icon: Plus, permissionKey: 'produtos' },
        { title: 'Promoções', url: '/dashboard/promotions', icon: Tag, permissionKey: null },
        { title: 'Perfil', url: '/dashboard/profile', icon: User, permissionKey: null },
      ];

      return allItems.filter(item => {
        if (!item.permissionKey) return true;
        return attendantPermissions.hasPermission(item.permissionKey);
      });
    }

    // Store admin - menu completo
    return [
      { title: 'Dashboard', url: '/dashboard', icon: Home },
      { title: 'Pedidos', url: '/dashboard/orders', icon: ShoppingCart },
      { title: 'PDV', url: '/dashboard/pdv', icon: Monitor },
      { title: 'Comandas', url: '/dashboard/comandas', icon: Receipt },
      { title: 'Cozinha (KDS)', url: '/dashboard/cozinha', icon: UtensilsCrossed },
      { title: 'Clientes', url: '/dashboard/customers', icon: Users },
      { title: 'Relatórios', url: '/dashboard/reports', icon: BarChart3 },
      { title: 'Produtos', url: '/dashboard/products', icon: Package },
      { title: 'Categorias', url: '/dashboard/categories', icon: Grid },
      { title: 'Adicionais', url: '/dashboard/addons', icon: Plus },
      { title: 'Promoções', url: '/dashboard/promotions', icon: Tag },
      { title: 'Configurações', url: '/dashboard/settings', icon: Settings },
      { title: 'Perfil', url: '/dashboard/profile', icon: User },
    ];
  };

  const menuItems = getMenuItems();
  const userName = profile?.full_name || profile?.email?.split('@')[0] || 'Usuário';
  const userInitials = userName.slice(0, 2).toUpperCase();
  const roleLabel = userRole === 'attendant' ? 'Atendente' : 'Lojista';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 pb-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <SheetTitle className="text-sm font-semibold">{userName}</SheetTitle>
              <span className="text-xs text-muted-foreground">{roleLabel}</span>
            </div>
          </div>
        </SheetHeader>
        
        <Separator />
        
        <div className="flex flex-col h-[calc(100vh-120px)]">
          <nav className="flex-1 overflow-y-auto p-2">
            {menuItems.map((item) => (
              <button
                key={item.url}
                onClick={() => handleNavigate(item.url)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  isActive(item.url)
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </button>
            ))}
          </nav>
          
          <Separator />
          
          <div className="p-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
