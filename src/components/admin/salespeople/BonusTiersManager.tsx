import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Save, X } from "lucide-react";
import { BonusTierCard } from "./BonusTierCard";

interface BonusTier {
  id: string;
  tier_name: string;
  min_sales: number;
  bonus_amount: number;
  is_active: boolean;
}

export function BonusTiersManager() {
  const { toast } = useToast();
  const [tiers, setTiers] = useState<BonusTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ min_sales: 0, bonus_amount: 0 });

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from("salesperson_bonus_tiers")
        .select("*")
        .order("min_sales", { ascending: true });

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error("Erro ao carregar tiers:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os tiers de bônus",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tier: BonusTier) => {
    setEditingId(tier.id);
    setEditValues({
      min_sales: tier.min_sales,
      bonus_amount: tier.bonus_amount,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({ min_sales: 0, bonus_amount: 0 });
  };

  const handleSave = async (tierId: string) => {
    try {
      const { error } = await supabase
        .from("salesperson_bonus_tiers")
        .update({
          min_sales: editValues.min_sales,
          bonus_amount: editValues.bonus_amount,
        })
        .eq("id", tierId);

      if (error) throw error;

      toast({
        title: "Tier atualizado",
        description: "O tier de bônus foi atualizado com sucesso",
      });

      setEditingId(null);
      setEditValues({ min_sales: 0, bonus_amount: 0 });
      fetchTiers();
    } catch (error) {
      console.error("Erro ao salvar tier:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar o tier",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-base md:text-lg">Tiers de Bônus Trimestral</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Configure os valores de bônus para cada tier
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
        {/* Mobile: Cards empilhados */}
        <div className="space-y-3 md:hidden">
          {tiers.map((tier) => (
            <BonusTierCard
              key={tier.id}
              tier={tier}
              isEditing={editingId === tier.id}
              editValues={editValues}
              onEdit={() => handleEdit(tier)}
              onSave={() => handleSave(tier.id)}
              onCancel={handleCancel}
              onEditValuesChange={setEditValues}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>

        {/* Desktop: Tabela tradicional */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead>Mínimo de Vendas</TableHead>
                <TableHead>Valor do Bônus</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="font-medium">{tier.tier_name}</TableCell>
                  <TableCell>
                    {editingId === tier.id ? (
                      <Input
                        type="number"
                        min="1"
                        value={editValues.min_sales}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            min_sales: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-24"
                      />
                    ) : (
                      `${tier.min_sales} vendas`
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === tier.id ? (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editValues.bonus_amount}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            bonus_amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-32"
                      />
                    ) : (
                      formatCurrency(tier.bonus_amount)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === tier.id ? (
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSave(tier.id)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(tier)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
