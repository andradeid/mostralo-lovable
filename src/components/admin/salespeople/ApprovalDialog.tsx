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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  salespersonName: string;
  cnpjData?: {
    razao_social?: string;
    nome_fantasia?: string;
    situacao_cadastral?: string;
    atividades_principais?: Array<{ codigo: string; descricao: string }>;
  };
}

export function ApprovalDialog({
  open,
  onOpenChange,
  onConfirm,
  salespersonName,
  cnpjData,
}: ApprovalDialogProps) {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (confirmed) {
      onConfirm();
      setConfirmed(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Aprovar Vendedor?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Você está prestes a aprovar <strong>{salespersonName}</strong>.
            </p>

            {cnpjData && (
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <div>
                  <strong>Razão Social:</strong> {cnpjData.razao_social || "N/A"}
                </div>
                {cnpjData.nome_fantasia && (
                  <div>
                    <strong>Nome Fantasia:</strong> {cnpjData.nome_fantasia}
                  </div>
                )}
                <div>
                  <strong>Situação:</strong>{" "}
                  <span
                    className={
                      cnpjData.situacao_cadastral === "ATIVA"
                        ? "text-green-600"
                        : "text-destructive"
                    }
                  >
                    {cnpjData.situacao_cadastral || "N/A"}
                  </span>
                </div>
                {cnpjData.atividades_principais && (
                  <div>
                    <strong>CNAEs:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {cnpjData.atividades_principais.map((atividade, idx) => (
                        <li key={idx}>
                          {atividade.codigo} - {atividade.descricao}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2 pt-4">
              <Checkbox
                id="confirm-approval"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
              />
              <Label
                htmlFor="confirm-approval"
                className="text-sm font-normal cursor-pointer"
              >
                Confirmo que verifiquei os dados do CNPJ e aprovo este vendedor
              </Label>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmed(false)}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!confirmed}>
            Confirmar Aprovação
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
