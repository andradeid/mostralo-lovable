import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Unlink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface SalespersonClientsTableProps {
  salespersonId: string;
  onUpdate: () => void;
}

export function SalespersonClientsTable({ salespersonId, onUpdate }: SalespersonClientsTableProps) {
  const { toast } = useToast();
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["salesperson-clients", salespersonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_approvals")
        .select("id, company_name, company_document, status, created_at, plan_id")
        .eq("referred_by_salesperson_id", salespersonId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleUnlink = async (clientId: string, clientName: string) => {
    setUnlinkingId(clientId);
    try {
      const { error } = await supabase
        .from("payment_approvals")
        .update({ referred_by_salesperson_id: null })
        .eq("id", clientId);

      if (error) throw error;

      toast({
        title: "Lojista desvinculado",
        description: `${clientName} foi removido da carteira`,
      });

      refetch();
      onUpdate();
    } catch (error) {
      console.error("Erro ao desvincular:", error);
      toast({
        title: "Erro",
        description: "Não foi possível desvincular o lojista",
        variant: "destructive",
      });
    } finally {
      setUnlinkingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      approved: { label: "Aprovado", variant: "default" },
      pending: { label: "Pendente", variant: "secondary" },
      rejected: { label: "Rejeitado", variant: "destructive" },
    };
    const { label, variant } = config[status] || { label: status, variant: "outline" };
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Clientes na Carteira
          {clients && clients.length > 0 && (
            <Badge variant="secondary" className="ml-auto">{clients.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {clients && clients.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.company_name || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {client.company_document || "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(client.created_at), "dd/MM/yy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnlink(client.id, client.company_name || "Lojista")}
                        disabled={unlinkingId === client.id}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Desvincular"
                      >
                        {unlinkingId === client.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Unlink className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Building2 className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Nenhum cliente na carteira</p>
            <p className="text-xs">Use o botão acima para adicionar lojistas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
