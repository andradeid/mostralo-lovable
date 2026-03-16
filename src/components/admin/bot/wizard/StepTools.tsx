import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AVAILABLE_TOOLS, AssistantType, TYPE_PRESETS } from "./types";

interface StepToolsProps {
  enabledTools: string[];
  onChange: (tools: string[]) => void;
  assistantType: AssistantType;
}

const categoryLabels: Record<string, string> = {
  catalog: '📦 Catálogo e Produtos',
  store: '🏪 Informações da Loja',
  advanced: '⚡ Avançado',
};

export function StepTools({ enabledTools, onChange, assistantType }: StepToolsProps) {
  const toggleTool = (toolId: string) => {
    if (enabledTools.includes(toolId)) {
      onChange(enabledTools.filter(t => t !== toolId));
    } else {
      onChange([...enabledTools, toolId]);
    }
  };

  const categories = ['catalog', 'store', 'advanced'];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm sm:text-base font-semibold">Funções do Assistente</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Escolha o que o assistente pode fazer durante o atendimento
        </p>
      </div>

      {categories.map(category => {
        const tools = AVAILABLE_TOOLS.filter(t => t.category === category);
        return (
          <div key={category} className="space-y-2">
            <Label className="text-xs sm:text-sm font-medium text-muted-foreground">
              {categoryLabels[category]}
            </Label>
            <div className="space-y-1.5">
              {tools.map(tool => {
                const isEnabled = enabledTools.includes(tool.id);
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => toggleTool(tool.id)}
                    className={`flex items-center gap-3 w-full p-2.5 rounded-lg border text-left transition-colors ${
                      isEnabled
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox checked={isEnabled} className="shrink-0 pointer-events-none" />
                    <span className="text-base shrink-0">{tool.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{tool.label}</span>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {tool.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex items-center gap-2 pt-2">
        <Badge variant="secondary" className="text-[10px]">
          {enabledTools.length} de {AVAILABLE_TOOLS.length} habilitadas
        </Badge>
      </div>
    </div>
  );
}
