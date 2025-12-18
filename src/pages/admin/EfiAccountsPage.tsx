import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Search,
  RefreshCw,
  Clock,
  AlertTriangle,
  Store,
  ExternalLink,
  Send,
  Pencil
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditStoreCommissionDialog } from "@/components/admin/EditStoreCommissionDialog";

interface StoreEfiAccount {
  id: string;
  name: string;
  owner_email: string;
  wants_online_payment: boolean;
  efi_account_status: string | null;
  efi_account_id: string | null;
  created_at: string;
  subscription_expires_at: string | null;
  online_payment_commission: number | null;
}

export default function EfiAccountsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<StoreEfiAccount[]>([]);
  const [filteredStores, setFilteredStores] = useState<StoreEfiAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [resending, setResending] = useState<string | null>(null);
  const [editingStore, setEditingStore] = useState<StoreEfiAccount | null>(null);
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);

  // Estatísticas
  const stats = {
    total: stores.filter(s => s.wants_online_payment).length,
    active: stores.filter(s => s.efi_account_status === 'active').length,
    pending: stores.filter(s => s.efi_account_status === 'pending_authorization').length,
    rejected: stores.filter(s => s.efi_account_status === 'rejected').length,
    notRequested: stores.filter(s => s.wants_online_payment && !s.efi_account_status).length,
  };

  const fetchStores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          id,
          name,
          wants_online_payment,
          efi_account_status,
          efi_account_id,
          created_at,
          subscription_expires_at,
          online_payment_commission,
          profiles:owner_id (email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedStores: StoreEfiAccount[] = (data || []).map((store: any) => ({
        id: store.id,
        name: store.name,
        owner_email: store.profiles?.email || 'N/A',
        wants_online_payment: store.wants_online_payment || false,
        efi_account_status: store.efi_account_status,
        efi_account_id: store.efi_account_id,
        created_at: store.created_at,
        subscription_expires_at: store.subscription_expires_at,
        online_payment_commission: store.online_payment_commission,
      }));

      setStores(formattedStores);
      setFilteredStores(formattedStores);
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as lojas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Filtrar lojas
  useEffect(() => {
    let filtered = stores;

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de status
    if (statusFilter !== "all") {
      if (statusFilter === "wants_payment") {
        filtered = filtered.filter(s => s.wants_online_payment);
      } else if (statusFilter === "active") {
        filtered = filtered.filter(s => s.efi_account_status === 'active');
      } else if (statusFilter === "pending") {
        filtered = filtered.filter(s => s.efi_account_status === 'pending_authorization');
      } else if (statusFilter === "rejected") {
        filtered = filtered.filter(s => s.efi_account_status === 'rejected');
      } else if (statusFilter === "not_requested") {
        filtered = filtered.filter(s => s.wants_online_payment && !s.efi_account_status);
      }
    }

    setFilteredStores(filtered);
  }, [stores, searchTerm, statusFilter]);

  const getStatusBadge = (store: StoreEfiAccount) => {
    if (!store.wants_online_payment) {
      return <Badge variant="secondary">Não solicitado</Badge>;
    }

    switch (store.efi_account_status) {
      case 'active':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Ativo
          </Badge>
        );
      case 'pending_authorization':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Aguardando Autorização
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        );
      case 'pending_creation':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Criando Conta
          </Badge>
        );
      default:
        if (store.wants_online_payment) {
          return (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Pendente de Criação
            </Badge>
          );
        }
        return <Badge variant="secondary">-</Badge>;
    }
  };

  const handleResendAuthLink = async (storeId: string) => {
    setResending(storeId);
    try {
      // Aqui chamaríamos uma função para reenviar o link de autorização
      const { data, error } = await supabase.functions.invoke('create-efi-simplified-account', {
        body: { store_id: storeId, resend: true }
      });

      if (error) throw error;

      toast({
        title: "Link reenviado!",
        description: "Um novo link de autorização foi enviado ao lojista.",
      });
    } catch (error: any) {
      console.error('Erro ao reenviar link:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível reenviar o link.",
        variant: "destructive",
      });
    } finally {
      setResending(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-500" />
          Contas EFI dos Lojistas
        </h1>
        <p className="text-muted-foreground">
          Gerencie as contas simplificadas EFI para pagamento PIX
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Solicitaram PIX</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Contas Ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Aguardando Autorização</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Rejeitadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{stats.notRequested}</div>
            <p className="text-xs text-muted-foreground">Pendentes Criação</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="wants_payment">Quer PIX Online</SelectItem>
                <SelectItem value="active">Conta Ativa</SelectItem>
                <SelectItem value="pending">Aguardando Autorização</SelectItem>
                <SelectItem value="rejected">Rejeitadas</SelectItem>
                <SelectItem value="not_requested">Pendente Criação</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchStores}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de lojas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="h-5 w-5" />
            Lojas ({filteredStores.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>PIX Online</TableHead>
                  <TableHead>Status EFI</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>ID Conta</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma loja encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell className="font-medium">{store.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {store.owner_email}
                      </TableCell>
                      <TableCell>
                        {store.wants_online_payment ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Sim
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Não</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(store)}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {(store.online_payment_commission ?? 7).toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {store.efi_account_id ? (
                          <span className="truncate max-w-[100px] block">
                            {store.efi_account_id}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingStore(store);
                              setCommissionDialogOpen(true);
                            }}
                            title="Editar comissão"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {store.wants_online_payment && store.efi_account_status === 'pending_authorization' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendAuthLink(store.id)}
                              disabled={resending === store.id}
                            >
                              {resending === store.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-1" />
                                  Reenviar
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EditStoreCommissionDialog
        open={commissionDialogOpen}
        onOpenChange={setCommissionDialogOpen}
        store={editingStore}
        onSuccess={fetchStores}
      />
    </div>
  );
}
