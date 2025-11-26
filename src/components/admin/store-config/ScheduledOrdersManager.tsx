import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Calendar, Package, Truck, Settings as SettingsIcon, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ScheduledOrdersSettings {
  enabled: boolean;
  pickup_settings: {
    min_advance_value: number;
    min_advance_unit: 'minutes' | 'hours' | 'days';
    max_advance_value: number;
    max_advance_unit: 'minutes' | 'hours' | 'days';
  };
  delivery_settings: {
    min_advance_value: number;
    min_advance_unit: 'minutes' | 'hours' | 'days';
    max_advance_value: number;
    max_advance_unit: 'minutes' | 'hours' | 'days';
    time_interval: number;
  };
  hide_asap: boolean;
}

interface ScheduledOrdersManagerProps {
  value: ScheduledOrdersSettings;
  onChange: (value: ScheduledOrdersSettings) => void;
}

export function ScheduledOrdersManager({ value, onChange }: ScheduledOrdersManagerProps) {
  const [openPickup, setOpenPickup] = useState(true);
  const [openDelivery, setOpenDelivery] = useState(true);
  const [openOther, setOpenOther] = useState(false);

  const updatePickupSettings = (field: string, val: any) => {
    onChange({
      ...value,
      pickup_settings: {
        ...value.pickup_settings,
        [field]: val
      }
    });
  };

  const updateDeliverySettings = (field: string, val: any) => {
    onChange({
      ...value,
      delivery_settings: {
        ...value.delivery_settings,
        [field]: val
      }
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Calendar className="w-5 h-5 text-primary" />
            Pedidos Agendados
          </CardTitle>
          <Button 
            variant="default" 
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Próximo →
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 space-y-6">
        {/* Pergunta Principal com Botões Grandes */}
        <div className="space-y-4">
          <Label className="text-base font-medium">
            Permitir que os clientes agendem pedidos para horários específicos:
          </Label>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={value.enabled ? "default" : "outline"}
              size="lg"
              onClick={() => onChange({ ...value, enabled: true })}
              className={`h-14 text-base font-semibold transition-all ${
                value.enabled 
                  ? 'bg-green-500 hover:bg-green-600 text-white border-green-600' 
                  : 'hover:bg-secondary/50'
              }`}
            >
              ✓ Sim
            </Button>
            
            <Button
              type="button"
              variant={!value.enabled ? "default" : "outline"}
              size="lg"
              onClick={() => onChange({ ...value, enabled: false })}
              className={`h-14 text-base font-semibold transition-all ${
                !value.enabled 
                  ? 'bg-gray-500 hover:bg-gray-600 text-white border-gray-600' 
                  : 'hover:bg-secondary/50'
              }`}
            >
              ✗ Não
            </Button>
          </div>
        </div>

        {value.enabled && (
          <div className="space-y-4 animate-fade-in">
            {/* Configurações de Retirada */}
            <Collapsible open={openPickup} onOpenChange={setOpenPickup} className="border rounded-lg">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-secondary/10 hover:bg-secondary/20 transition-colors rounded-lg">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="font-medium">Definições para retirar no local</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${openPickup ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              
              <CollapsibleContent className="p-4 space-y-4 border-t">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tempo mínimo de antecedência</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={value.pickup_settings.min_advance_value}
                      onChange={(e) => updatePickupSettings('min_advance_value', parseInt(e.target.value) || 1)}
                      className="text-center"
                      placeholder="1"
                    />
                    <Select
                      value={value.pickup_settings.min_advance_unit}
                      onValueChange={(val) => updatePickupSettings('min_advance_unit', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutos</SelectItem>
                        <SelectItem value="hours">Horas</SelectItem>
                        <SelectItem value="days">Dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tempo máximo de antecedência</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={value.pickup_settings.max_advance_value}
                      onChange={(e) => updatePickupSettings('max_advance_value', parseInt(e.target.value) || 1)}
                      className="text-center"
                      placeholder="7"
                    />
                    <Select
                      value={value.pickup_settings.max_advance_unit}
                      onValueChange={(val) => updatePickupSettings('max_advance_unit', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutos</SelectItem>
                        <SelectItem value="hours">Horas</SelectItem>
                        <SelectItem value="days">Dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Configurações de Entrega */}
            <Collapsible open={openDelivery} onOpenChange={setOpenDelivery} className="border rounded-lg">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-secondary/10 hover:bg-secondary/20 transition-colors rounded-lg">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  <span className="font-medium">Definições para entrega</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${openDelivery ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              
              <CollapsibleContent className="p-4 space-y-4 border-t">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tempo mínimo de antecedência</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={value.delivery_settings.min_advance_value}
                      onChange={(e) => updateDeliverySettings('min_advance_value', parseInt(e.target.value) || 1)}
                      className="text-center"
                      placeholder="1"
                    />
                    <Select
                      value={value.delivery_settings.min_advance_unit}
                      onValueChange={(val) => updateDeliverySettings('min_advance_unit', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutos</SelectItem>
                        <SelectItem value="hours">Horas</SelectItem>
                        <SelectItem value="days">Dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tempo máximo de antecedência</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={value.delivery_settings.max_advance_value}
                      onChange={(e) => updateDeliverySettings('max_advance_value', parseInt(e.target.value) || 1)}
                      className="text-center"
                      placeholder="5"
                    />
                    <Select
                      value={value.delivery_settings.max_advance_unit}
                      onValueChange={(val) => updateDeliverySettings('max_advance_unit', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutos</SelectItem>
                        <SelectItem value="hours">Horas</SelectItem>
                        <SelectItem value="days">Dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Intervalo de tempo (a cada)</Label>
                  <Select
                    value={value.delivery_settings.time_interval.toString()}
                    onValueChange={(val) => updateDeliverySettings('time_interval', parseInt(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o intervalo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Outras Configurações */}
            <Collapsible open={openOther} onOpenChange={setOpenOther} className="border rounded-lg">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-secondary/10 hover:bg-secondary/20 transition-colors rounded-lg">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4 text-primary" />
                  <span className="font-medium">Outros</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${openOther ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              
              <CollapsibleContent className="p-4 border-t">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <Label className="text-sm font-medium">
                        Ocultar "o mais rápido possível"
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Permitir apenas pedidos agendados (oculta opção ASAP)
                      </p>
                    </div>
                    <Switch
                      checked={value.hide_asap}
                      onCheckedChange={(checked) => onChange({ ...value, hide_asap: checked })}
                    />
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-start gap-2 cursor-help">
                            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                                Como isso funciona fora do horário?
                              </p>
                              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                Quando a loja está fechada, apenas horários futuros dentro do horário de funcionamento serão exibidos.
                              </p>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-sm">
                            O sistema valida automaticamente os horários de funcionamento configurados e só permite agendamentos dentro desses períodos.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
