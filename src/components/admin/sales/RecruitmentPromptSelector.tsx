import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Heart, TrendingUp, Zap, Snowflake } from 'lucide-react';
import { RecruitmentPromptType, getRecruitmentPromptTypeInfo } from '@/utils/recruitmentPromptGenerator';

interface RecruitmentPromptSelectorProps {
  selectedType: RecruitmentPromptType;
  onSelectType: (type: RecruitmentPromptType) => void;
}

export function RecruitmentPromptSelector({ selectedType, onSelectType }: RecruitmentPromptSelectorProps) {
  const types: { id: RecruitmentPromptType; icon: typeof Heart; color: string; bgColor: string }[] = [
    { 
      id: 'cold_lead', 
      icon: Snowflake, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10'
    },
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {types.map((type) => {
        const info = getRecruitmentPromptTypeInfo(type.id);
        const isSelected = selectedType === type.id;
        const Icon = type.icon;
        
        return (
          <Card
            key={type.id}
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-md",
              isSelected
                ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                : "hover:border-primary/50"
            )}
            onClick={() => onSelectType(type.id)}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-2 rounded-lg", type.bgColor)}>
                <Icon className={cn("h-4 w-4", type.color)} />
              </div>
              <span className="text-xl">{info.emoji}</span>
            </div>
            
            <h4 className="font-semibold text-sm mb-1">{info.name}</h4>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{info.description}</p>
            
            <Badge variant="outline" className="text-xs">
              {info.idealFor}
            </Badge>
            
            {isSelected && (
              <Badge className="mt-2 block w-fit" variant="default">
                Selecionado
              </Badge>
            )}
          </Card>
        );
      })}
    </div>
  );
}
