import { useState } from "react";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { useDentalQuotesByStore, DentalQuote } from "@/hooks/dental/useDentalQuotes";
import { useDentalProcedures } from "@/hooks/dental/useDentalProcedures";
import { usePatients } from "@/hooks/dental/usePatients";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Receipt, User, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import DentalQuoteDialog from "@/components/admin/dental/DentalQuoteDialog";

export default function DentalQuotesPage() {
  const { storeId } = useStoreAccess();
  const { quotes, isLoading } = useDentalQuotesByStore(storeId);
  const { patients } = usePatients(storeId);
  const { procedures } = useDentalProcedures(storeId);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<DentalQuote | null>(null);

  const filteredQuotes = quotes.filter(quote => {
    const patient = patients.find(p => p.id === quote.patient_id);
    const patientName = patient?.name?.toLowerCase() || "";
    return patientName.includes(searchTerm.toLowerCase()) ||
           quote.quote_number?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      sent: "bg-blue-100 text-blue-800",
      viewed: "bg-purple-100 text-purple-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      expired: "bg-orange-100 text-orange-800",
    };
    const labels: Record<string, string> = {
      draft: "Rascunho",
      sent: "Enviado",
      viewed: "Visualizado",
      accepted: "Aceito",
      rejected: "Rejeitado",
      expired: "Expirado",
    };
    return <Badge className={styles[status] || styles.draft}>{labels[status] || status}</Badge>;
  };

  const handleEdit = (quote: any) => {
    setSelectedQuote(quote);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedQuote(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orçamentos</h1>
          <p className="text-muted-foreground">Gerencie orçamentos odontológicos</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por paciente ou número..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum orçamento encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredQuotes.map((quote) => {
            const patient = patients.find(p => p.id === quote.patient_id);
            return (
              <Card 
                key={quote.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleEdit(quote)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">#{quote.quote_number}</h3>
                        {getStatusBadge(quote.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {patient?.name || "Paciente não encontrado"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(quote.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      {quote.valid_until && (
                        <p className="text-xs text-muted-foreground">
                          Válido até: {format(new Date(quote.valid_until), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-semibold flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {quote.total_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        {quote.discount_value > 0 && (
                          <p className="text-xs text-green-600">
                            Desconto: R$ {quote.discount_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DentalQuoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        quote={selectedQuote}
        patients={patients}
        procedures={procedures}
        storeId={storeId || ""}
      />
    </div>
  );
}
