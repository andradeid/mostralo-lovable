// Segmentação do público.
// JSX movido da WhatsAppCampaignNewPage sem mudança.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X } from "lucide-react";
import type { CampaignNewPageCtx } from "@/hooks/whatsappCampaign/useCampaignNewPage";

export function CampaignAudienceCard({ ctx }: { ctx: CampaignNewPageCtx }) {
  const { labels, form, setForm } = ctx;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Segmentação
          </CardTitle>
          <CardDescription>
            Defina quais clientes receberão as mensagens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Dias inativos (mínimo)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[form.filter_days_inactive]}
                onValueChange={([v]) => setForm(prev => ({ ...prev, filter_days_inactive: v }))}
                min={0}
                max={90}
                step={1}
                className="flex-1"
              />
              <span className="w-16 text-right">{form.filter_days_inactive} dias</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes que não compram há pelo menos X dias
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mín. pedidos</Label>
              <Input
                type="number"
                min="0"
                value={form.filter_min_orders}
                onChange={(e) => setForm(prev => ({ ...prev, filter_min_orders: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Máx. pedidos</Label>
              <Input
                type="number"
                min="0"
                value={form.filter_max_orders}
                onChange={(e) => setForm(prev => ({ ...prev, filter_max_orders: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mín. gasto (R$)</Label>
              <Input
                type="number"
                min="0"
                value={form.filter_min_spent}
                onChange={(e) => setForm(prev => ({ ...prev, filter_min_spent: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Máx. gasto (R$)</Label>
              <Input
                type="number"
                min="0"
                value={form.filter_max_spent}
                onChange={(e) => setForm(prev => ({ ...prev, filter_max_spent: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Filtro por Etiquetas */}
          {labels.length > 0 && (
            <div className="space-y-3">
              <Label>Filtrar por etiquetas</Label>
              <div className="flex flex-wrap gap-2">
                {labels.map((label: any) => (
                  <div
                    key={label.id}
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        filter_label_ids: prev.filter_label_ids.includes(label.id)
                          ? prev.filter_label_ids.filter(id => id !== label.id)
                          : [...prev.filter_label_ids, label.id]
                      }));
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all ${
                      form.filter_label_ids.includes(label.id)
                        ? 'ring-2 ring-primary ring-offset-2'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: label.color + '30', color: label.color }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="text-sm font-medium">{label.name}</span>
                    <span className="text-xs opacity-70">({label.contacts_count || 0})</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Enviar apenas para contatos com as etiquetas selecionadas
              </p>
            </div>
          )}

          {/* Incluir contatos importados */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="include_imported"
              checked={form.include_imported_contacts}
              onCheckedChange={(checked) => 
                setForm(prev => ({ ...prev, include_imported_contacts: checked === true }))
              }
            />
            <label
              htmlFor="include_imported"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Incluir contatos importados
            </label>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Além de clientes, incluir contatos da aba "Contatos WhatsApp"
          </p>
        </CardContent>
      </Card>
    </>
  );
}
