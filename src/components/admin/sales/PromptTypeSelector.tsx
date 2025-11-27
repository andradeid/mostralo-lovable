import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, TrendingUp, Flame } from 'lucide-react';
import { PromptType } from '@/utils/salesPromptGenerator';

interface PromptTypeSelectorProps {
  selectedType: PromptType;
  onSelectType: (type: PromptType) => void;
}

export function PromptTypeSelector({ selectedType, onSelectType }: PromptTypeSelectorProps) {
  const types = [
    {
      id: 'basic' as PromptType,
      icon: MessageCircle,
      title: 'Básico (Consultivo)',
      description: 'Tom amigável e educativo. Ideal para clientes que ainda estão pesquisando.',
      color: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
      iconColor: 'text-blue-500',
    },
    {
      id: 'intermediate' as PromptType,
      icon: TrendingUp,
      title: 'Intermediário (Persuasivo)',
      description: 'Foco em números e comparações. Para clientes interessados que precisam de dados.',
      color: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30',
      iconColor: 'text-orange-500',
    },
    {
      id: 'aggressive' as PromptType,
      icon: Flame,
      title: 'Agressivo (Urgência)',
      description: 'Direto e provocador. Para clientes decidindo que precisam de um empurrão.',
      color: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30',
      iconColor: 'text-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {types.map((type) => {
        const Icon = type.icon;
        const isSelected = selectedType === type.id;

        return (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all ${type.color} ${
              isSelected ? 'ring-2 ring-primary scale-105' : ''
            }`}
            onClick={() => onSelectType(type.id)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <Icon className={`h-6 w-6 ${type.iconColor}`} />
                <CardTitle className="text-base">{type.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">{type.description}</CardDescription>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
