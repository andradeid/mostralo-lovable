// Topo da Agenda: disponibilidade, chave "Online" e menu (página pública, profissionais, serviços, Google).
// JSX movido da BookingCalendarPage sem mudança.
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { User, Settings, ExternalLink, Globe, RefreshCw, MoreHorizontal, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { useSalesChannels } from '@/hooks/useSalesChannels';

type SalesChannelsApi = ReturnType<typeof useSalesChannels>;

interface CalendarHeaderProps {
  storeSlug: string | null;
  channels: SalesChannelsApi['channels'];
  updateChannel: SalesChannelsApi['updateChannel'];
  loadingChannels: boolean;
  updatingChannel: boolean;
  handleSyncGoogleCalendar: () => void;
  syncingCalendar: boolean;
}

export function CalendarHeader({ storeSlug, channels, updateChannel, loadingChannels, updatingChannel, handleSyncGoogleCalendar, syncingCalendar }: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Agenda</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">Gerencie seus agendamentos</p>
      </div>

       <div className="flex items-center gap-2">
        {/* Disponibilidade button */}
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" asChild>
          <Link to="/dashboard/booking/disponibilidade">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Disponibilidade</span>
            <span className="sm:hidden">Disp.</span>
          </Link>
        </Button>
        {/* Online toggle - desktop only */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Online</span>
          <Switch
            checked={channels?.booking_enabled !== false}
            onCheckedChange={(checked) => updateChannel('booking_enabled', checked)}
            disabled={loadingChannels || updatingChannel}
            className="scale-75"
          />
        </div>

        {/* Settings dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {storeSlug && (
              <DropdownMenuItem asChild>
                <a href={`/agendar/${storeSlug}`} target="_blank" rel="noopener noreferrer" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Página Pública
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link to="/dashboard/booking/professionals" className="gap-2">
                <User className="h-4 w-4" />
                Profissionais
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/booking/services" className="gap-2">
                <Settings className="h-4 w-4" />
                Serviços
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSyncGoogleCalendar}
              disabled={syncingCalendar}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", syncingCalendar && "animate-spin")} />
              Sincronizar Google
            </DropdownMenuItem>
            {/* Mobile online toggle */}
            <DropdownMenuSeparator className="sm:hidden" />
            <div className="sm:hidden flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Online</span>
              </div>
              <Switch
                checked={channels?.booking_enabled !== false}
                onCheckedChange={(checked) => updateChannel('booking_enabled', checked)}
                disabled={loadingChannels || updatingChannel}
                className="scale-90"
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
