import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, UserPlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AssignClientToSalespersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salespersonId: string;
  salespersonName: string;
  onSuccess: () => void;
}

export function AssignClientToSalespersonDialog({
  open,
  onOpenChange,
  salespersonId,
  salespersonName,
  onSuccess,
}: AssignClientToSalespersonDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Buscar payment_approvals sem vendedor vinculado
  const { data: unassignedClients, isLoading, refetch } = useQuery({
    queryKey: ["unassigned-clients", search],
    queryFn: async () => {
      let query = supabase
        .from("payment_approvals")
        .select("id, company_name, company_document, status, created_at, user_id")
        .is("referred_by_salesperson_id", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (search.trim()) {
        query = query.or(`company_name.ilike.%${search}%,company_document.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const handleToggle = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (selectedIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("payment_approvals")
        .update({ referred_by_salesperson_id: salespersonId })
        .in("id", selectedIds);

      if (error) throw error;

      toast({
        title: "Lojistas vinculados",
        description: `${selectedIds.length} lojista(s) adicionado(s) à carteira de ${salespersonName}`,
      });

      setSelectedIds([]);
      refetch();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao vincular:", error);
      toast({
        title: "Erro ao vincular",
        description: "Não foi possível vincular os lojistas",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      approved: { label: "Aprovado", variant: "default" },
      pending: { label: "Pendente", variant: "secondary" },
      rejected: { label: "Rejeitado", variant: "destructive" },
    };
    const { label, variant } = config[status] || { label: status, variant: "outline" };
    return <Badge variant={variant} className="text-xs">{label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Adicionar à Carteira
          </DialogTitle>
          <DialogDescription>
            Selecione lojistas sem vendedor vinculado para adicionar à carteira de <strong>{salespersonName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : unassignedClients && unassignedClients.length > 0 ? (
            <div className="divide-y">
              {unassignedClients.map((client) => (
                <label
                  key={client.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.includes(client.id)}
                    onCheckedChange={() => handleToggle(client.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm truncate">
                        {client.company_name || "Sem nome"}
                      </span>
                      {getStatusBadge(client.status)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      {client.company_document && (
                        <span className="font-mono">{client.company_document}</span>
                      )}
                      <span>•</span>
                      <span>{format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Building2 className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhum lojista sem vendedor encontrado</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">
            {selectedIds.length > 0 ? `${selectedIds.length} selecionado(s)` : "Nenhum selecionado"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={selectedIds.length === 0 || isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Vincular
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
