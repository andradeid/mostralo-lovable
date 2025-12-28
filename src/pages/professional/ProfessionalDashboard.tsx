import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useProfessionalData, useProfessionalBookings, useProfessionalStats } from "@/hooks/useProfessionalData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function ProfessionalDashboard() {
  const queryClient = useQueryClient();
  const { data: professional, isLoading: loadingProfessional } = useProfessionalData();
  const today = new Date().toISOString().split("T")[0];
  const { data: todayBookings, isLoading: loadingBookings } = useProfessionalBookings(professional?.id, today);
  const { data: stats, isLoading: loadingStats } = useProfessionalStats(professional?.id);

  const handleConfirm = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    if (error) {
      toast.error("Erro ao confirmar agendamento");
      return;
    }

    toast.success("Agendamento confirmado!");
    queryClient.invalidateQueries({ queryKey: ["professional-bookings"] });
  };

  const handleCancel = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", bookingId);

    if (error) {
      toast.error("Erro ao cancelar agendamento");
      return;
    }

    toast.success("Agendamento cancelado");
    queryClient.invalidateQueries({ queryKey: ["professional-bookings"] });
  };

  if (loadingProfessional) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: "Pendente" },
      confirmed: { variant: "default", label: "Confirmado" },
      completed: { variant: "secondary", label: "Concluído" },
      cancelled: { variant: "destructive", label: "Cancelado" },
      no_show: { variant: "destructive", label: "Não Compareceu" },
    };
    const style = styles[status] || { variant: "outline", label: status };
    return <Badge variant={style.variant}>{style.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          Olá, {professional?.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-muted-foreground">
          {professional?.specialty && `${professional.specialty} • `}
          {professional?.stores?.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.todayCount || 0}</p>
                <p className="text-xs text-muted-foreground">Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.weekCount || 0}</p>
                <p className="text-xs text-muted-foreground">Semana</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  R$ {(stats?.pendingCommissions || 0).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Pendente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-500/10">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  R$ {(stats?.paidCommissions || 0).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Recebido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Agendamentos de Hoje
          </CardTitle>
          <CardDescription>
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingBookings ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : todayBookings && todayBookings.length > 0 ? (
            <div className="space-y-3">
              {todayBookings.map((booking: any) => (
                <div
                  key={booking.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-card gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">
                        {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
                      </span>
                      {getStatusBadge(booking.status)}
                    </div>
                    <p className="text-sm font-medium">{booking.booking_services?.name}</p>
                    <p className="text-sm text-muted-foreground">{booking.customer_name}</p>
                    {booking.customer_phone && (
                      <p className="text-xs text-muted-foreground">{booking.customer_phone}</p>
                    )}
                  </div>

                  {booking.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(booking.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={() => handleConfirm(booking.id)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Confirmar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum agendamento para hoje</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
