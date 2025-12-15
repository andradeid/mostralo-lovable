import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SalespersonClientsPage() {
  const { user } = useAuth();

  // Buscar salesperson_id
  const { data: salesperson } = useQuery({
    queryKey: ["salesperson-self", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salespeople")
        .select("id")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Buscar clientes indicados
  const { data: clients, isLoading } = useQuery({
    queryKey: ["salesperson-clients", salesperson?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_approvals")
        .select(`
          id,
          company_name,
          company_document,
          status,
          created_at,
          approved_at,
          payment_amount,
          plan:plans(name)
        `)
        .eq("referred_by_salesperson_id", salesperson?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!salesperson?.id,
  });

  const totalClients = clients?.length || 0;
  const approvedClients = clients?.filter(c => c.status === "approved").length || 0;
  const pendingClients = clients?.filter(c => c.status === "pending").length || 0;
  const rejectedClients = clients?.filter(c => c.status === "rejected").length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Aprovado</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Meus Clientes</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Todos os clientes que você indicou para a plataforma
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 pt-3 px-3 md:pt-6 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <div className="text-lg md:text-2xl font-bold">{totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 pt-3 px-3 md:pt-6 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <div className="text-lg md:text-2xl font-bold text-green-500">{approvedClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 pt-3 px-3 md:pt-6 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <div className="text-lg md:text-2xl font-bold text-yellow-500">{pendingClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 pt-3 px-3 md:pt-6 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Rejeitados</CardTitle>
            <XCircle className="h-3 w-3 md:h-4 md:w-4 text-destructive" />
          </CardHeader>
          <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
            <div className="text-lg md:text-2xl font-bold text-destructive">{rejectedClients}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Lista de Clientes Indicados</CardTitle>
        </CardHeader>
        <CardContent>
          {clients && clients.length > 0 ? (
            <>
              {/* Mobile: Cards compactos */}
              <div className="md:hidden space-y-3">
                {clients.map((client) => (
                  <div key={client.id} className="p-3 rounded-lg border bg-card w-[90%] mx-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm truncate max-w-[60%]">
                        {client.company_name || "—"}
                      </span>
                      {getStatusBadge(client.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {client.plan?.name || "—"}
                    </p>
                    <div className="flex justify-between mt-2 pt-2 border-t text-[10px] text-muted-foreground">
                      <span>Cadastro: {format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                      {client.approved_at && (
                        <span className="text-green-600">
                          ✓ {format(new Date(client.approved_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Tabela original */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Cadastro</TableHead>
                      <TableHead>Aprovação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.company_name || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {client.company_document || "—"}
                        </TableCell>
                        <TableCell>
                          {client.plan?.name || "—"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(client.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {client.approved_at 
                            ? format(new Date(client.approved_at), "dd/MM/yyyy", { locale: ptBR })
                            : "—"
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum cliente indicado ainda. Compartilhe seu link de indicação!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
