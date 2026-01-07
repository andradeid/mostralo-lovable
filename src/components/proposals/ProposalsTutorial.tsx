import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  FileText, Plus, Info, Send, Package,
  Users, CheckCircle, Clock, Eye, XCircle,
  Copy, MessageSquare, Lightbulb
} from "lucide-react";

interface ProposalsTutorialProps {
  open: boolean;
  onComplete: (dontShowAgain: boolean) => void;
}

const steps = [
  {
    title: "Bem-vindo às Propostas Comerciais!",
    description: "Esta ferramenta permite criar propostas personalizadas para seus clientes de forma rápida e profissional.",
    details: [
      "📊 Acompanhe o status de cada proposta em tempo real",
      "📈 Veja estatísticas: Total, Enviadas, Visualizadas e Aceitas",
      "🔗 Compartilhe links personalizados com seus clientes"
    ],
    icon: FileText,
  },
  {
    title: "Criando uma Nova Proposta",
    description: "Clique em **Nova Proposta** para iniciar. O processo é dividido em 4 passos simples:",
    details: [
      "1️⃣ **Dados do Cliente**: Nome e telefone (obrigatórios), empresa e e-mail",
      "2️⃣ **Módulos**: Selecione os módulos da proposta (templates por nicho agilizam)",
      "3️⃣ **Valores**: Defina taxa de setup, descontos e prazo de validade",
      "4️⃣ **Revisão**: Confira tudo antes de criar a proposta"
    ],
    icon: Plus,
  },
  {
    title: "Entendendo os Status",
    description: "Cada proposta passa por diferentes status que você pode acompanhar:",
    details: [
      "⏳ **Rascunho**: Proposta salva mas ainda não enviada ao cliente",
      "📤 **Enviada**: Link já foi compartilhado com o cliente",
      "👁️ **Visualizada**: Cliente abriu e viu a proposta",
      "✅ **Aceita**: Cliente aceitou a proposta (Parabéns!)",
      "❌ **Rejeitada**: Cliente recusou (você pode ver o motivo)",
      "⌛ **Expirada**: Prazo de validade passou"
    ],
    icon: Info,
  },
  {
    title: "Compartilhando com o Cliente",
    description: "Existem duas formas de enviar a proposta ao cliente:",
    details: [
      "📋 **Copiar Link**: Copia o link da proposta para você colar onde quiser",
      "💬 **WhatsApp**: Abre o WhatsApp com uma mensagem pronta e o link da proposta",
      "👀 **Ver**: Visualize a página que o cliente verá antes de enviar"
    ],
    icon: Send,
  },
  {
    title: "Dica Avançada: Templates por Nicho",
    description: "Configure módulos padrão para cada nicho de negócio e agilize suas propostas!",
    details: [
      "🏪 Acesse pela página de Módulos → **Templates por Nicho**",
      "⚡ Ao criar uma proposta e selecionar um nicho, os módulos são marcados automaticamente",
      "🎯 Ideal para propostas recorrentes do mesmo tipo de negócio"
    ],
    icon: Package,
  },
];

export function ProposalsTutorial({ open, onComplete }: ProposalsTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (isLastStep) {
      onComplete(dontShowAgain);
      setCurrentStep(0);
      setDontShowAgain(false);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    onComplete(dontShowAgain);
    setCurrentStep(0);
    setDontShowAgain(false);
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-sm font-normal text-muted-foreground">
            Passo {currentStep + 1} de {steps.length}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center py-4">
          {/* Ícone */}
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <StepIcon className="h-8 w-8 text-primary" />
          </div>

          {/* Título */}
          <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
          
          {/* Descrição */}
          <p className="text-muted-foreground mb-4">
            {formatText(step.description)}
          </p>
          
          {/* Detalhes */}
          <div className="text-left w-full space-y-2 bg-muted/50 rounded-lg p-4">
            {step.details.map((detail, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                {formatText(detail)}
              </p>
            ))}
          </div>

          {/* Indicador de progresso */}
          <div className="flex gap-2 mt-6">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-primary"
                    : index < currentStep
                    ? "bg-primary/50"
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

        {/* Botões de navegação */}
        <div className="flex justify-between gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={handlePrev} 
            disabled={currentStep === 0}
            className="min-w-[100px]"
          >
            Anterior
          </Button>
          <Button onClick={handleNext} className="min-w-[100px]">
            {isLastStep ? "Começar!" : "Próximo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook para gerenciar o tutorial
export function useProposalsTutorial() {
  const STORAGE_KEY = "proposals-tutorial-completed";
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setShowTutorial(true);
    }
    setHasCheckedStorage(true);
  }, []);

  const completeTutorial = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setShowTutorial(false);
  };

  const openTutorial = () => {
    setShowTutorial(true);
  };

  return {
    showTutorial,
    hasCheckedStorage,
    completeTutorial,
    openTutorial,
  };
}
