import { Check } from "lucide-react";

interface Step {
  id: string;
  number: number;
  label: string;
}

interface CheckoutProgressIndicatorProps {
  currentStep: number;
  steps: Step[];
  primaryColor: string;
}

export const CheckoutProgressIndicator = ({
  currentStep,
  steps,
  primaryColor,
}: CheckoutProgressIndicatorProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isFuture = index > currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Círculo do passo */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 
                    flex items-center justify-center font-semibold
                    transition-all duration-300
                    ${
                      isCompleted
                        ? "border-transparent text-white"
                        : isCurrent
                        ? "border-current text-current"
                        : "border-muted text-muted-foreground"
                    }
                  `}
                  style={{
                    backgroundColor: isCompleted ? primaryColor : "transparent",
                    borderColor: isCurrent ? primaryColor : undefined,
                    color: isCurrent ? primaryColor : undefined,
                  }}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <span className="text-sm sm:text-base">{step.number}</span>
                  )}
                </div>
                <span
                  className={`
                    text-xs sm:text-sm font-medium text-center whitespace-nowrap
                    transition-colors duration-300
                    ${
                      isCompleted || isCurrent
                        ? "text-current"
                        : "text-muted-foreground"
                    }
                  `}
                  style={{
                    color:
                      isCompleted || isCurrent ? primaryColor : undefined,
                  }}
                >
                  {step.label}
                </span>
              </div>

              {/* Linha de conexão */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 sm:mx-4 transition-colors duration-300">
                  <div
                    className="h-full rounded"
                    style={{
                      backgroundColor: isCompleted ? primaryColor : "hsl(var(--muted))",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
