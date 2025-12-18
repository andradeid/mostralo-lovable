import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";

interface CloudflareProgressBarProps {
  completed: number;
  total: number;
}

export function CloudflareProgressBar({ completed, total }: CloudflareProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {percentage === 100 ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-muted-foreground">
            {completed} de {total} configurações concluídas
          </span>
        </div>
        <span className="font-medium text-foreground">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
