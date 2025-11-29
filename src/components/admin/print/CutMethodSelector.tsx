import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Settings, Scissors, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

type CutMethod = 'driver' | 'visual' | 'qz_tray';

interface CutMethodSelectorProps {
  value: CutMethod;
  onChange: (method: CutMethod) => void;
  onConfigureQZ?: () => void;
}

export const CutMethodSelector = ({ value, onChange, onConfigureQZ }: CutMethodSelectorProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Método de Corte</h3>
          <p className="text-sm text-muted-foreground">
            Escolha como a impressora deve cortar o papel entre as vias
          </p>
        </div>

        <RadioGroup value={value} onValueChange={(v) => onChange(v as CutMethod)}>
          {/* Opção 1: Driver */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
            <RadioGroupItem value="driver" id="driver" className="mt-1" />
            <label htmlFor="driver" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <Settings className="h-4 w-4 text-primary" />
                <span className="font-medium">Driver da Impressora</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Recomendado
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure o corte automático diretamente no driver Windows/macOS da sua impressora.
                Método mais simples e confiável.
              </p>
            </label>
          </div>

          {/* Opção 2: Linha Visual */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
            <RadioGroupItem value="visual" id="visual" className="mt-1" />
            <label htmlFor="visual" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <Scissors className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Linha de Corte Visual</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Imprime uma linha tracejada <span className="font-mono">✂️ ─── CORTE AQUI ───</span> 
                {" "}indicando onde cortar manualmente. Funciona em qualquer impressora.
              </p>
            </label>
          </div>

          {/* Opção 3: QZ Tray */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
            <RadioGroupItem value="qz_tray" id="qz_tray" className="mt-1" />
            <label htmlFor="qz_tray" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="font-medium">QZ Tray (Avançado)</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Corte automático via software. Envia comandos ESC/POS diretamente para a impressora.
                Requer instalação do QZ Tray (gratuito).
              </p>
              {value === 'qz_tray' && onConfigureQZ && (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    onConfigureQZ();
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Configurar QZ Tray
                </Button>
              )}
            </label>
          </div>
        </RadioGroup>

        {/* Alertas informativos baseados na seleção */}
        {value === 'driver' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Como configurar:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Abra as preferências da impressora no Windows/macOS</li>
                <li>Procure por "Corte Automático" ou "Auto Cut"</li>
                <li>Ative a opção de corte após cada página</li>
                <li>Salve as configurações</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {value === 'visual' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Funcionamento:</strong> As vias serão impressas em sequência com uma linha 
              tracejada e símbolo ✂️ entre elas. Corte manualmente seguindo a marcação.
            </AlertDescription>
          </Alert>
        )}

        {value === 'qz_tray' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Requisitos:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Baixar e instalar QZ Tray em <a href="https://qz.io/download/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">qz.io/download</a></li>
                <li>Manter o QZ Tray aberto durante as impressões</li>
                <li>Configurar a impressora no QZ Tray Setup acima</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
};
