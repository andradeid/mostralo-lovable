import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Zap } from "lucide-react";

export type TriggerType = 'all' | 'keyword' | 'advanced' | 'none';
export type TriggerOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex';

interface TriggerConfigCardProps {
  triggerType: TriggerType;
  triggerOperator: TriggerOperator;
  onTriggerTypeChange: (type: TriggerType) => void;
  onTriggerOperatorChange: (operator: TriggerOperator) => void;
  disabled?: boolean;
}

const triggerTypeOptions = [
  { value: 'all', label: 'Todos', description: 'Responde todas as mensagens' },
  { value: 'keyword', label: 'Palavra-chave', description: 'Responde quando contém palavras-chave' },
  { value: 'advanced', label: 'Avançado', description: 'Usa operadores avançados' },
  { value: 'none', label: 'Nenhum', description: 'Bot não responde automaticamente' },
];

const triggerOperatorOptions = [
  { value: 'contains', label: 'Contém' },
  { value: 'equals', label: 'Igual' },
  { value: 'startsWith', label: 'Começa Com' },
  { value: 'endsWith', label: 'Termina Com' },
  { value: 'regex', label: 'Regex' },
];

export function TriggerConfigCard({
  triggerType,
  triggerOperator,
  onTriggerTypeChange,
  onTriggerOperatorChange,
  disabled = false,
}: TriggerConfigCardProps) {
  const showOperator = triggerType === 'keyword' || triggerType === 'advanced';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="w-4 h-4 text-yellow-500" />
          Gatilho do Bot
        </CardTitle>
        <CardDescription className="text-xs">
          Configure quando o bot deve responder
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm">Tipo de Gatilho</Label>
              <InfoTooltip text="'Todos' faz o bot responder a qualquer mensagem. 'Palavra-chave' só responde quando encontra as keywords configuradas. 'Nenhum' desativa o gatilho automático." />
            </div>
            <Select
              value={triggerType}
              onValueChange={(value) => onTriggerTypeChange(value as TriggerType)}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {triggerTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showOperator && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm">Operador</Label>
                <InfoTooltip text="Define como a palavra-chave será comparada: 'Contém' busca a palavra em qualquer lugar, 'Igual' exige correspondência exata, 'Começa Com' e 'Termina Com' checam posição, 'Regex' para expressões regulares." />
              </div>
              <Select
                value={triggerOperator}
                onValueChange={(value) => onTriggerOperatorChange(value as TriggerOperator)}
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o operador" />
                </SelectTrigger>
                <SelectContent>
                  {triggerOperatorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {triggerType === 'all' && (
          <p className="text-xs text-muted-foreground bg-green-500/10 border border-green-500/20 rounded-md p-2">
            ✅ O bot responderá a <strong>todas</strong> as mensagens recebidas.
          </p>
        )}

        {triggerType === 'none' && (
          <p className="text-xs text-muted-foreground bg-yellow-500/10 border border-yellow-500/20 rounded-md p-2">
            ⚠️ O bot <strong>não responderá automaticamente</strong>. Use para pausar o bot temporariamente.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
