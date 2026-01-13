import { 
  Home, 
  Calendar, 
  DollarSign, 
  Clock, 
  CalendarX, 
  User, 
  LogOut,
  BarChart3,
  CalendarSync
} from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface ProfessionalSidebarProps {
  onSignOut: () => void;
  professionalName?: string;
  professionalPhoto?: string;
  storeName?: string;
}

export function ProfessionalSidebar({ 
  onSignOut, 
  professionalName = "Profissional",
  professionalPhoto,
  storeName 
}: ProfessionalSidebarProps) {
  const location = useLocation();

  const menuItems = [
    { icon: Home, title: "Dashboard", path: "/profissional" },
    { icon: Calendar, title: "Minha Agenda", path: "/profissional/agenda" },
    { icon: BarChart3, title: "Performance", path: "/profissional/performance" },
    { icon: DollarSign, title: "Minhas Comissões", path: "/profissional/comissoes" },
    { icon: Clock, title: "Meus Horários", path: "/profissional/horarios" },
    { icon: CalendarX, title: "Bloqueios", path: "/profissional/bloqueios" },
    { icon: CalendarSync, title: "Google Calendar", path: "/profissional/google-calendar" },
    { icon: User, title: "Perfil", path: "/profissional/perfil" },
  ];

  const initials = professionalName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            {professionalPhoto && <AvatarImage src={professionalPhoto} alt={professionalName} />}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{professionalName}</p>
            {storeName && (
              <p className="text-xs text-muted-foreground truncate">{storeName}</p>
            )}
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
