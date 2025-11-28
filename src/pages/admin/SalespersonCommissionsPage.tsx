import { BonusTiersManager } from "@/components/admin/salespeople/BonusTiersManager";

export default function SalespersonCommissionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuração de Comissões</h1>
        <p className="text-muted-foreground">
          Configure os tiers de bônus trimestral para vendedores
        </p>
      </div>

      <BonusTiersManager />
    </div>
  );
}
