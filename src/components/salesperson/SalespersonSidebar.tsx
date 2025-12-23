import { Home, Link2, FileText, User, LogOut, MessageSquare, Target, ClipboardList, Users, Printer, History, Wallet, BookOpen, Film, DollarSign, UserCheck, Megaphone } from "lucide-react";
import { useLocation } from "react-router-dom";
import { PreloadLink } from "@/components/PreloadLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUnreadUpdates } from "@/hooks/useUnreadUpdates";

interface SalespersonSidebarProps {
  onSignOut: () => void;
}

export function SalespersonSidebar({ onSignOut }: SalespersonSidebarProps) {
  const location = useLocation();
  const { unreadCount } = useUnreadUpdates();

  const menuItems = [
    { icon: Home, title: "Dashboard", path: "/vendedor" },
    { icon: BookOpen, title: "📚 Guia Completo", path: "/vendedor/guia" },
    { icon: Megaphone, title: "Novidades", path: "/vendedor/novidades", badge: unreadCount },
    { icon: Link2, title: "Meu Link", path: "/vendedor/link" },
    { icon: UserCheck, title: "Meus Clientes", path: "/vendedor/clientes" },
    { icon: DollarSign, title: "Minhas Comissões", path: "/vendedor/comissoes" },
    { icon: Wallet, title: "Pagamentos", path: "/vendedor/pagamentos" },
    { icon: Printer, title: "Material", path: "/vendedor/compartilhar" },
    { icon: Film, title: "Mídias", path: "/vendedor/midias" },
    { icon: Users, title: "Meus Leads", path: "/vendedor/leads" },
    { icon: MessageSquare, title: "Prompts de IA", path: "/vendedor/prompts" },
    { icon: Target, title: "Prospecção", path: "/vendedor/prospeccao" },
    { icon: ClipboardList, title: "Guia de Cadastro", path: "/vendedor/onboarding" },
    { icon: FileText, title: "Contrato", path: "/vendedor/contrato" },
    { icon: History, title: "Histórico", path: "/vendedor/contratos" },
    { icon: User, title: "Perfil", path: "/vendedor/perfil" },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              V
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Vendedor</p>
            <p className="text-xs text-muted-foreground truncate">Painel Afiliado</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarMenu className="space-y-1 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className="w-full justify-start h-10 px-3"
                >
                  <PreloadLink to={item.path} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.title}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </PreloadLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <Button
          variant="ghost"
          onClick={onSignOut}
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
