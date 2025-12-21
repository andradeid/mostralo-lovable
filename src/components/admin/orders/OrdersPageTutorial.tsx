import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Minimize2, Settings, Volume2 } from "lucide-react";

interface OrdersPageTutorialProps {
  open: boolean;
  onComplete: (dontShowAgain: boolean) => void;
}

const steps = [
  {
    title: "Modo Tela Cheia",
    description: "A tela de pedidos abre em modo tela cheia para você ter mais espaço de trabalho.",
    detail: "Para ver o menu lateral e acessar outras páginas, clique no botão **'Sair'** ao lado do título.",
    icon: "minimize",
  },
  {
    title: "Configurações de Som",
    description: "Você pode ativar ou desativar os sons de alerta de novos pedidos.",
    detail: "Clique no botão **'Config'** ao lado do título para acessar as configurações de som e notificações.",
    icon: "settings",
  },
];

export function OrdersPageTutorial({ open, onComplete }: OrdersPageTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  const handleNext = () => {
    if (isLastStep) {
      onComplete(dontShowAgain);
      setCurrentStep(0);
      setDontShowAgain(false);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleClose = () => {
    onComplete(dontShowAgain);
    setCurrentStep(0);
    setDontShowAgain(false);
  };

  const renderIcon = () => {
    if (step.icon === "minimize") {
      return (
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Minimize2 className="h-8 w-8 text-primary" />
        </div>
      );
    }
    return (
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <div className="relative">
          <Settings className="h-8 w-8 text-primary" />
          <Volume2 className="h-4 w-4 text-primary absolute -bottom-1 -right-1" />
        </div>
      </div>
    );
  };

  // Formatar texto com **negrito**
  const formatText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-sm font-normal text-muted-foreground">
            Passo {currentStep + 1} de {steps.length}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center py-4">
          {renderIcon()}

          <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
          
          <p className="text-muted-foreground mb-2">{step.description}</p>
          
          <p className="text-sm text-muted-foreground">
            {formatText(step.detail)}
          </p>

          {/* Indicador de progresso */}
          <div className="flex gap-2 mt-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Checkbox no último passo */}
        {isLastStep && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Checkbox
              id="dontShowAgain"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <Label
              htmlFor="dontShowAgain"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Não mostrar novamente
            </Label>
          </div>
        )}

        <div className="flex justify-center pt-2">
          <Button onClick={handleNext} className="min-w-[120px]">
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
