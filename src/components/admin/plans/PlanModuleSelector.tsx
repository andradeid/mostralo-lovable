import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface Module {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  key: string | null;
  is_active: boolean | null;
}

interface PlanModuleSelectorProps {
  planId: string;
  selectedModuleIds: string[];
  onModulesChange: (moduleIds: string[]) => void;
}

// Mapeamento de nomes de ícones para componentes Lucide
const getIconComponent = (iconName: string | null) => {
  if (!iconName) return LucideIcons.Package;
  
const iconMap: Record<string, React.ComponentType<any>> = {
    Menu: LucideIcons.Menu,
    ShoppingCart: LucideIcons.ShoppingCart,
    Truck: LucideIcons.Truck,
    Palette: LucideIcons.Palette,
    BarChart: LucideIcons.BarChart,
    MessageCircle: LucideIcons.MessageCircle,
    Package: LucideIcons.Package,
    Users: LucideIcons.Users,
    Image: LucideIcons.Image,
    Printer: LucideIcons.Printer,
    Calendar: LucideIcons.Calendar,
    Tag: LucideIcons.Tag,
    Megaphone: LucideIcons.Megaphone,
    ExternalLink: LucideIcons.ExternalLink,
    Code: LucideIcons.Code,
    QrCode: LucideIcons.QrCode,
    Wallet: LucideIcons.Wallet,
    Utensils: LucideIcons.Utensils,
    Monitor: LucideIcons.Monitor,
    Target: LucideIcons.Target,
  };
  
  return iconMap[iconName] || LucideIcons.Package;
};

export function PlanModuleSelector({ planId, selectedModuleIds, onModulesChange }: PlanModuleSelectorProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const { data, error } = await supabase
          .from('modules')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setModules(data || []);
      } catch (error) {
        console.error('Erro ao buscar módulos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  const handleToggleModule = (moduleId: string) => {
    if (selectedModuleIds.includes(moduleId)) {
      onModulesChange(selectedModuleIds.filter(id => id !== moduleId));
    } else {
      onModulesChange([...selectedModuleIds, moduleId]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Agrupar módulos por categoria (baseado no key)
  const coreModules = modules.filter(m => 
    ['digital_menu', 'order_management', 'delivery', 'customization'].includes(m.key || '')
  );
  const advancedModules = modules.filter(m => 
    ['reports', 'whatsapp', 'printing', 'scheduled_orders', 'delivery_drivers', 'promotions', 'password_call'].includes(m.key || '')
  );
  const premiumModules = modules.filter(m => 
    ['marketing', 'integrations', 'custom_scripts', 'marketing_material', 'financial_management', 'ifood_integration', 'whatsapp_recovery', 'banners', 'attendants', 'digital_signage', 'sentinela'].includes(m.key || '')
  );

  const renderModuleGroup = (groupModules: Module[], title: string, badgeColor: string) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge className={badgeColor}>{title}</Badge>
        <span className="text-xs text-muted-foreground">
          {groupModules.filter(m => selectedModuleIds.includes(m.id)).length}/{groupModules.length} selecionados
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {groupModules.map((module) => {
          const IconComponent = getIconComponent(module.icon);
          const isSelected = selectedModuleIds.includes(module.id);
          
          return (
            <Card 
              key={module.id}
              className={`p-3 cursor-pointer transition-all ${
                isSelected 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleToggleModule(module.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{module.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {module.description || 'Sem descrição'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isSelected}
                  onCheckedChange={() => handleToggleModule(module.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Módulos do Plano</Label>
          <p className="text-sm text-muted-foreground">
            Selecione os módulos que serão liberados para lojas com este plano
          </p>
        </div>
        <Badge variant="outline">
          {selectedModuleIds.length} de {modules.length} módulos
        </Badge>
      </div>

      {coreModules.length > 0 && renderModuleGroup(coreModules, 'Essenciais', 'bg-blue-600')}
      {advancedModules.length > 0 && renderModuleGroup(advancedModules, 'Avançados', 'bg-purple-600')}
      {premiumModules.length > 0 && renderModuleGroup(premiumModules, 'Premium', 'bg-amber-600')}

      {modules.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum módulo disponível no sistema
        </p>
      )}
    </div>
  );
}
