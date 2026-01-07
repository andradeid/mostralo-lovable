import { useState } from "react";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { useDentalProcedures, PROCEDURE_CATEGORIES, DentalProcedure } from "@/hooks/dental/useDentalProcedures";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Stethoscope, Edit2, Trash2, Clock, DollarSign } from "lucide-react";
import DentalProcedureDialog from "@/components/admin/dental/DentalProcedureDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DentalProceduresPage() {
  const { storeId } = useStoreAccess();
  const { procedures, proceduresByCategory, isLoading, deleteProcedure } = useDentalProcedures(storeId);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<DentalProcedure | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<DentalProcedure | null>(null);

  const filteredProcedures = procedures.filter(proc =>
    proc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proc.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryLabel = (category: string) => {
    return PROCEDURE_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const handleEdit = (procedure: DentalProcedure) => {
    setSelectedProcedure(procedure);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedProcedure(null);
    setDialogOpen(true);
  };

  const handleDeleteClick = (procedure: DentalProcedure, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcedureToDelete(procedure);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (procedureToDelete) {
      await deleteProcedure.mutateAsync(procedureToDelete.id);
      setDeleteDialogOpen(false);
      setProcedureToDelete(null);
    }
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
          <h1 className="text-2xl font-bold">Procedimentos</h1>
          <p className="text-muted-foreground">Cadastre e gerencie procedimentos odontológicos</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Procedimento
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredProcedures.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Stethoscope className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum procedimento encontrado</p>
            <Button variant="link" onClick={handleNew}>
              Cadastrar primeiro procedimento
            </Button>
          </CardContent>
        </Card>
      ) : searchTerm ? (
        // Show flat list when searching
        <div className="grid gap-3">
          {filteredProcedures.map((procedure) => (
            <ProcedureCard
              key={procedure.id}
              procedure={procedure}
              getCategoryLabel={getCategoryLabel}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      ) : (
        // Show grouped by category when not searching
        <div className="space-y-6">
          {Object.entries(proceduresByCategory).map(([category, procs]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{getCategoryLabel(category)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {procs.map((procedure) => (
                  <ProcedureCard
                    key={procedure.id}
                    procedure={procedure}
                    getCategoryLabel={getCategoryLabel}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    showCategory={false}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DentalProcedureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        procedure={selectedProcedure}
        storeId={storeId || ""}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover procedimento?</AlertDialogTitle>
            <AlertDialogDescription>
              O procedimento "{procedureToDelete?.name}" será desativado e não aparecerá mais nas listagens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ProcedureCardProps {
  procedure: DentalProcedure;
  getCategoryLabel: (category: string) => string;
  onEdit: (procedure: DentalProcedure) => void;
  onDelete: (procedure: DentalProcedure, e: React.MouseEvent) => void;
  showCategory?: boolean;
}

function ProcedureCard({ procedure, getCategoryLabel, onEdit, onDelete, showCategory = true }: ProcedureCardProps) {
  return (
    <div
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onEdit(procedure)}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {procedure.code && (
            <Badge variant="outline" className="font-mono text-xs">
              {procedure.code}
            </Badge>
          )}
          <span className="font-medium">{procedure.name}</span>
          {showCategory && procedure.category && (
            <Badge variant="secondary" className="text-xs">
              {getCategoryLabel(procedure.category)}
            </Badge>
          )}
        </div>
        {procedure.description && (
          <p className="text-sm text-muted-foreground line-clamp-1">{procedure.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            R$ {procedure.default_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {procedure.estimated_duration_minutes} min
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(procedure);
          }}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => onDelete(procedure, e)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
