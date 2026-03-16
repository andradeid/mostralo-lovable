import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wand2, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { StepType } from "./StepType";
import { StepIdentity } from "./StepIdentity";
import { StepTools } from "./StepTools";
import { StepRules } from "./StepRules";
import { StepReview } from "./StepReview";
import {
  WizardData,
  DEFAULT_WIZARD_DATA,
  AssistantType,
  TYPE_PRESETS,
  AssistantIdentity,
  AssistantRules,
  AssistantStoreInfo,
  UpsellProduct,
} from "./types";

interface AssistantWizardProps {
  initialData?: Partial<WizardData>;
  onComplete: (data: WizardData) => Promise<void>;
  saving?: boolean;
  storeId: string | null;
}

const STEPS = [
  { id: 'type', label: 'Tipo', number: 1 },
  { id: 'identity', label: 'Identidade', number: 2 },
  { id: 'tools', label: 'Funções', number: 3 },
  { id: 'rules', label: 'Regras', number: 4 },
  { id: 'review', label: 'Revisão', number: 5 },
];

export function AssistantWizard({ initialData, onComplete, saving, storeId }: AssistantWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    ...DEFAULT_WIZARD_DATA,
    ...initialData,
  });

  const handleTypeChange = useCallback((type: AssistantType) => {
    const preset = TYPE_PRESETS[type];
    setData(prev => ({
      ...prev,
      assistantType: type,
      enabledTools: preset.defaultTools,
      rules: { ...prev.rules, ...preset.defaultRules } as AssistantRules,
    }));
  }, []);

  const handleIdentityChange = useCallback((identity: AssistantIdentity) => {
    setData(prev => ({ ...prev, identity }));
  }, []);

  const handleToolsChange = useCallback((tools: string[]) => {
    setData(prev => ({ ...prev, enabledTools: tools }));
  }, []);

  const handleRulesChange = useCallback((rules: AssistantRules) => {
    setData(prev => ({ ...prev, rules }));
  }, []);

  const handleStoreInfoChange = useCallback((storeInfo: AssistantStoreInfo) => {
    setData(prev => ({ ...prev, storeInfo }));
  }, []);

  const handleCustomInstructionsChange = useCallback((customInstructions: string) => {
    setData(prev => ({ ...prev, customInstructions }));
  }, []);

  const handleUpsellProductsChange = useCallback((upsellProducts: UpsellProduct[]) => {
    setData(prev => ({ ...prev, upsellProducts }));
  }, []);

  const canAdvance = step < STEPS.length - 1;
  const canGoBack = step > 0;
  const isLastStep = step === STEPS.length - 1;

  return (
    <Card>
      <CardHeader className="!p-3 !pb-2 sm:!p-6 sm:!pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Wand2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
          Criador de Assistente
          <Badge variant="secondary" className="text-[10px] sm:text-xs ml-auto">
            {step + 1} de {STEPS.length}
          </Badge>
        </CardTitle>

        {/* Stepper */}
        <div className="flex items-center gap-1 pt-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={`flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full text-xs font-bold transition-colors shrink-0 ${
                  i === step
                    ? 'bg-primary text-primary-foreground'
                    : i < step
                    ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < step ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  s.number
                )}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded ${
                  i < step ? 'bg-primary/30' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[9px] sm:text-[10px] text-muted-foreground px-1">
          {STEPS.map(s => (
            <span key={s.id} className="text-center" style={{ width: `${100 / STEPS.length}%` }}>
              {s.label}
            </span>
          ))}
        </div>
      </CardHeader>

      <CardContent className="!p-3 !pt-0 sm:!p-6 sm:!pt-0">
        {/* Step content */}
        <div className="min-h-[300px] sm:min-h-[400px] py-3">
          {step === 0 && (
            <StepType value={data.assistantType} onChange={handleTypeChange} />
          )}
          {step === 1 && (
            <StepIdentity value={data.identity} onChange={handleIdentityChange} />
          )}
          {step === 2 && (
            <StepTools
              enabledTools={data.enabledTools}
              onChange={handleToolsChange}
              assistantType={data.assistantType}
            />
          )}
          {step === 3 && (
            <StepRules
              rules={data.rules}
              storeInfo={data.storeInfo}
              customInstructions={data.customInstructions}
              onRulesChange={handleRulesChange}
              onStoreInfoChange={handleStoreInfoChange}
              onCustomInstructionsChange={handleCustomInstructionsChange}
              assistantType={data.assistantType}
              storeId={storeId}
              upsellProducts={data.upsellProducts}
              onUpsellProductsChange={handleUpsellProductsChange}
            />
          )}
          {step === 4 && (
            <StepReview data={data} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep(s => s - 1)}
            disabled={!canGoBack || saving}
            className="gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>

          {isLastStep ? (
            <Button
              size="sm"
              onClick={() => onComplete(data)}
              disabled={saving}
              className="gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Criar e Sincronizar
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance}
              className="gap-1.5"
            >
              <span className="hidden sm:inline">Próximo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
