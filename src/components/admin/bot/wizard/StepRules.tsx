import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Lock, MapPin, Clock, CreditCard, Truck, DollarSign } from "lucide-react";
import { AssistantRules, AssistantStoreInfo, AssistantType, TYPE_PRESETS, UpsellProduct } from "./types";
import { UpsellProductPicker } from "./UpsellProductPicker";

interface StepRulesProps {
  rules: AssistantRules;
  storeInfo: AssistantStoreInfo;
  customInstructions: string;
  onRulesChange: (rules: AssistantRules) => void;
  onStoreInfoChange: (info: AssistantStoreInfo) => void;
  onCustomInstructionsChange: (text: string) => void;
  assistantType: AssistantType;
  storeId: string | null;
  upsellProducts: UpsellProduct[];
  onUpsellProductsChange: (products: UpsellProduct[]) => void;
}

const rulesList: { key: keyof AssistantRules; label: string; description: string; icon: string }[] = [
  { key: 'block_prices', label: 'Bloquear preços', description: 'Nunca informar preços ao cliente', icon: '🚫💰' },
  { key: 'block_photos', label: 'Bloquear fotos', description: 'Nunca enviar fotos de produtos', icon: '🚫📷' },
  { key: 'allow_upsell', label: 'Permitir upsell', description: 'Sugerir produtos complementares', icon: '📈' },
  { key: 'suggest_generic', label: 'Sugerir genérico', description: 'Oferecer alternativa genérica por princípio ativo', icon: '💊' },
  { key: 'ask_specification', label: 'Pedir especificação', description: 'Perguntar detalhes antes de buscar (tamanho, marca)', icon: '❓' },
  { key: 'suggest_store_link', label: 'Sugerir loja virtual', description: 'Enviar link da loja online durante atendimento', icon: '🌐' },
  { key: 'require_prescription_check', label: 'Verificar receita', description: 'Checar campo requires_prescription do produto', icon: '📋' },
];

// Sub-regra: enviar link na saudação (aparece dentro de suggest_store_link)

const storeInfoOptions = [
  { key: 'includeLocation' as const, label: 'Localização', icon: MapPin, color: 'text-blue-500' },
  { key: 'includeBusinessHours' as const, label: 'Horário de Funcionamento', icon: Clock, color: 'text-orange-500' },
  { key: 'includePaymentMethods' as const, label: 'Formas de Pagamento', icon: CreditCard, color: 'text-green-500' },
  { key: 'includeDeliveryFee' as const, label: 'Taxa de Entrega', icon: Truck, color: 'text-purple-500' },
  { key: 'includeMinOrder' as const, label: 'Pedido Mínimo', icon: DollarSign, color: 'text-yellow-500' },
];

export function StepRules({
  rules,
  storeInfo,
  customInstructions,
  onRulesChange,
  onStoreInfoChange,
  onCustomInstructionsChange,
  assistantType,
  storeId,
  upsellProducts,
  onUpsellProductsChange,
}: StepRulesProps) {
  const preset = TYPE_PRESETS[assistantType];
  const lockedRules = preset.lockedRules || {};

  return (
    <div className="space-y-5">
      {/* Regras de comportamento */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm sm:text-base font-semibold">Regras de Comportamento</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Defina o que o assistente pode ou não fazer
          </p>
        </div>

        <div className="space-y-2">
          {rulesList.map(rule => {
            const isLocked = rule.key in lockedRules;
            const ruleValue = rules[rule.key];

            return (
              <div key={rule.key}>
                <div
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    isLocked ? 'bg-muted/50 opacity-75' : 'hover:bg-muted/30'
                  } ${rule.key === 'allow_upsell' && ruleValue ? 'rounded-b-none border-b-0' : ''}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-base shrink-0">{rule.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{rule.label}</span>
                        {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{rule.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={ruleValue}
                    onCheckedChange={(checked) => {
                      if (!isLocked) {
                        onRulesChange({ ...rules, [rule.key]: checked });
                        // Limpar produtos de upsell ao desabilitar
                        if (rule.key === 'allow_upsell' && !checked) {
                          onUpsellProductsChange([]);
                        }
                      }
                    }}
                    disabled={isLocked}
                    className="shrink-0"
                  />
                </div>

                {/* Sub-opção: enviar link na saudação */}
                {rule.key === 'suggest_store_link' && ruleValue && !isLocked && (
                  <div className="border border-t-0 rounded-b-lg p-3 bg-muted/10">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-sm font-medium">📨 Enviar link na saudação</span>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          O assistente envia o link da loja já na primeira mensagem para o cliente adiantar o pedido
                        </p>
                      </div>
                      <Switch
                        checked={rules.send_link_on_greeting}
                        onCheckedChange={(checked) => {
                          onRulesChange({ ...rules, send_link_on_greeting: checked });
                        }}
                        className="shrink-0 ml-2"
                      />
                    </div>
                  </div>
                )}

                {/* Picker de produtos de upsell - aparece quando habilitado */}
                {rule.key === 'allow_upsell' && ruleValue && !isLocked && (
                  <div className="border border-t-0 rounded-b-lg p-3 bg-muted/10">
                    <p className="text-xs text-muted-foreground mb-1">
                      Selecione os produtos que o assistente deve sugerir como upsell:
                    </p>
                    <UpsellProductPicker
                      storeId={storeId}
                      selectedProducts={upsellProducts}
                      onChange={onUpsellProductsChange}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info da loja */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm sm:text-base font-semibold">Informações da Loja no Prompt</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Quais informações o assistente deve conhecer
          </p>
        </div>

        <div className="space-y-1.5">
          {storeInfoOptions.map(option => {
            const Icon = option.icon;
            const isChecked = storeInfo[option.key];
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onStoreInfoChange({ ...storeInfo, [option.key]: !isChecked })}
                className={`flex items-center gap-2.5 w-full p-2.5 rounded-lg border text-left transition-colors ${
                  isChecked ? 'border-primary/50 bg-primary/5' : 'border-border hover:bg-muted/50'
                }`}
              >
                <Checkbox checked={isChecked} className="shrink-0 pointer-events-none" />
                <Icon className={`h-4 w-4 shrink-0 ${option.color}`} />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Instruções customizadas */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Instruções adicionais <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Textarea
          value={customInstructions}
          onChange={(e) => onCustomInstructionsChange(e.target.value)}
          placeholder="Adicione regras específicas para o seu negócio..."
          className="min-h-[80px] text-sm resize-none"
        />
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          Estas instruções serão adicionadas ao final do prompt do assistente.
        </p>
      </div>
    </div>
  );
}
