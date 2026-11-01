// Cartão de um profissional: menu ⋮, números de hoje, comissão, serviços e atalhos.
// JSX movido da ProfessionalsPage sem mudança.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, MoreVertical, Calendar, Clock, DollarSign, CalendarOff, Scissors, UserCheck, UserX, Key, Link2, Copy, BarChart3, CalendarDays } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { brl } from '@/lib/brl';
import { getInitials } from '@/lib/professionals/professionalsList';
import type { Professional } from '@/hooks/useBooking';
import type { ProfessionalDialogs } from '@/hooks/professionals/useProfessionalDialogs';
import type { ProfessionalTodayStat } from '@/lib/professionals/professionalsList';

interface ProfessionalCardProps {
  professional: Professional;
  stats: ProfessionalTodayStat | undefined;
  services: { id: string; name: string }[];
  storeSlug: string | null;
  dialogs: ProfessionalDialogs;
  openEditDialog: (professional: Professional) => void;
  handleToggleActive: (professional: Professional) => void;
  copyBookingLink: (professional: Professional) => void;
}

export function ProfessionalCard({ professional, stats, services, storeSlug, dialogs, openEditDialog, handleToggleActive, copyBookingLink }: ProfessionalCardProps) {
  const {
    openDialogFromMenu,
    setIsServicesDialogOpen,
    setIsScheduleDialogOpen,
    setIsBlocksDialogOpen,
    setInviteDialog,
    setIsAgendaDialogOpen,
    setIsGoogleCalendarDialogOpen,
    setIsDeleteDialogOpen,
  } = dialogs;

  return (
    <Card 
      className={`group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 ${!professional.is_active ? 'opacity-60' : ''}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
              <AvatarImage src={professional.photo_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(professional.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{professional.name}</CardTitle>
              {professional.specialty && (
                <CardDescription className="text-xs truncate">{professional.specialty}</CardDescription>
              )}
              <div className="flex items-center gap-1.5 mt-1">
                <Badge 
                  variant={professional.is_active ? 'default' : 'secondary'}
                  className={`text-[10px] h-5 ${professional.is_active ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}`}
                >
                  {professional.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
                {professional.is_active && stats && (
                  <span className="text-[10px] text-muted-foreground">
                    {stats.hasScheduleToday 
                      ? (stats.todayBookings > 0 ? '• Atendendo hoje' : '• Agenda livre')
                      : '• Folga hoje'
                    }
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* 3 dots menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Configuração</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openEditDialog(professional)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDialogFromMenu(setIsServicesDialogOpen, professional)}>
                <Scissors className="h-4 w-4 mr-2" />
                Serviços
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDialogFromMenu(setIsScheduleDialogOpen, professional)}>
                <Clock className="h-4 w-4 mr-2" />
                Horários
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDialogFromMenu(setIsBlocksDialogOpen, professional)}>
                <CalendarOff className="h-4 w-4 mr-2" />
                Bloqueios
              </DropdownMenuItem>
              {!professional.user_id && (
                <DropdownMenuItem onClick={() => {
                  window.setTimeout(() => {
                    document.body.style.removeProperty('pointer-events');
                    setInviteDialog({ professional: { id: professional.id, name: professional.name, phone: (professional as any).phone ?? null } });
                  }, 0);
                }}>
                  <Key className="h-4 w-4 mr-2" />
                  Enviar convite de acesso
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Operação</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openDialogFromMenu(setIsAgendaDialogOpen, professional)}>
                <Calendar className="h-4 w-4 mr-2" />
                Ver Agenda Completa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDialogFromMenu(setIsGoogleCalendarDialogOpen, professional)}>
                <Calendar className="h-4 w-4 mr-2" />
                Google Calendar
              </DropdownMenuItem>
              {storeSlug && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Compartilhamento</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => copyBookingLink(professional)}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Copiar Link de Agendamento
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleToggleActive(professional)}>
                {professional.is_active ? (
                  <><UserX className="h-4 w-4 mr-2" />Desativar</>
                ) : (
                  <><UserCheck className="h-4 w-4 mr-2" />Ativar</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => openDialogFromMenu(setIsDeleteDialogOpen, professional)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Today Stats */}
        {professional.is_active && stats && (
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <BarChart3 className="h-3 w-3 text-primary" />
                <span className="text-sm font-bold">{stats.occupancyPercent}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Ocupação</p>
            </div>
            <div className="text-center border-x border-border/50">
              <div className="flex items-center justify-center gap-1">
                <CalendarDays className="h-3 w-3 text-blue-500" />
                <span className="text-sm font-bold">{stats.todayBookings}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Hoje</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <DollarSign className="h-3 w-3 text-green-500" />
                <span className="text-sm font-bold">
                  {stats.todayRevenue > 0 ? `R$${stats.todayRevenue.toFixed(0)}` : '-'}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">Faturamento</p>
            </div>
          </div>
        )}

        {/* Commission */}
        <div className="flex items-center gap-2 text-sm">
          {professional.commission_type === 'percentage' ? (
            <Badge variant="secondary" className="text-xs">
              {professional.commission_value}% comissão
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 text-xs">
              <DollarSign className="h-3 w-3" />
              {brl(professional.commission_value)} fixo
            </Badge>
          )}
        </div>

        {/* Services */}
        {services.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Scissors className="h-3 w-3 text-muted-foreground shrink-0" />
            {services.slice(0, 2).map((service) => (
              <Badge key={service.id} variant="outline" className="text-[10px] h-5">
                {service.name}
              </Badge>
            ))}
            {services.length > 2 && (
              <Badge variant="outline" className="text-[10px] h-5">
                +{services.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => openDialogFromMenu(setIsAgendaDialogOpen, professional)}
          >
            <Calendar className="h-3.5 w-3.5" />
            Ver Agenda
          </Button>
          {storeSlug && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={() => copyBookingLink(professional)}
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar Link
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
