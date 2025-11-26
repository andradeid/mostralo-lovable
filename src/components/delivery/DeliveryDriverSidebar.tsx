import { Link, useLocation } from "react-router-dom";
import { Package, BarChart3, DollarSign, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

interface DeliveryDriverSidebarProps {
  onSignOut: () => void;
  pendingInvitations?: number;
}

export function DeliveryDriverSidebar({ onSignOut, pendingInvitations = 0 }: DeliveryDriverSidebarProps) {
  const location = useLocation();
  const { user, profile } = useAuth();
  const { open } = useSidebar();
  const isMobile = useIsMobile();

  const menuItems = [
    {
      title: "Meus Pedidos",
      icon: Package,
      path: "/delivery-panel",
    },
    {
      title: "Relatórios",
      icon: BarChart3,
      path: "/delivery-reports",
    },
    {
      title: "Pagamentos",
      icon: DollarSign,
      path: "/delivery-payments",
    },
    {
      title: "Perfil",
      icon: User,
      path: "/delivery-profile",
    },
    {
      title: "Configurações",
      icon: Settings,
      path: "/delivery-settings",
      badge: pendingInvitations > 0 ? pendingInvitations : undefined,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const collapsed = isMobile ? !open : !open;

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"}>
      <SidebarHeader className="border-b p-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile?.full_name ? getInitials(profile.full_name) : "EN"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold text-sm truncate">{profile?.full_name || "Entregador"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <Avatar className="h-8 w-8 mx-auto">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {profile?.full_name ? getInitials(profile.full_name) : "EN"}
            </AvatarFallback>
          </Avatar>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton asChild isActive={isActive(item.path)}>
                <Link to={item.path} className="flex items-center gap-3 py-3">
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge variant="destructive" className="h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onSignOut} className="w-full">
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
