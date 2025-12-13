import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Heart, TrendingUp, Zap } from 'lucide-react';
import { RecruitmentPromptType, getRecruitmentPromptTypeInfo } from '@/utils/recruitmentPromptGenerator';

interface RecruitmentPromptSelectorProps {
  selectedType: RecruitmentPromptType;
  onSelectType: (type: RecruitmentPromptType) => void;
}

export function RecruitmentPromptSelector({ selectedType, onSelectType }: RecruitmentPromptSelectorProps) {
  const types: { id: RecruitmentPromptType; icon: typeof Heart; color: string; bgColor: string }[] = [
    { 
      id: 'moderate', 
      icon: Heart, 
      color: 'text-green-600',
      bgColor: 'bg-green-500/10'
    },
    { 
      id: 'aggressive', 
      icon: TrendingUp, 
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500/10'
    },
    { 
      id: 'super_aggressive', 
      icon: Zap, 
      color: 'text-red-600',
      bgColor: 'bg-red-500/10'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {types.map((type) => {
        const info = getRecruitmentPromptTypeInfo(type.id);
        const isSelected = selectedType === type.id;
        const Icon = type.icon;
        
        return (
          <Card
            key={type.id}
            className={cn(
              "p-6 cursor-pointer transition-all hover:shadow-md",
              isSelected
                ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                : "hover:border-primary/50"
            )}
            onClick={() => onSelectType(type.id)}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("p-2 rounded-lg", type.bgColor)}>
                <Icon className={cn("h-5 w-5", type.color)} />
              </div>
              <span className="text-2xl">{info.emoji}</span>
            </div>
            
            <h4 className="font-semibold mb-2">{info.name}</h4>
            <p className="text-sm text-muted-foreground mb-3">{info.description}</p>
            
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                {info.idealFor}
              </Badge>
            </div>
            
            {isSelected && (
              <Badge className="mt-3" variant="default">
                Selecionado
              </Badge>
            )}
          </Card>
        );
      })}
    </div>
  );
}
