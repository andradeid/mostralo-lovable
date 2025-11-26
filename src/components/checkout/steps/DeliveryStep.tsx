import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bike, Store, UtensilsCrossed, MapPin, Calendar as CalendarIcon, Clock, Zap } from 'lucide-react';
import { CustomerLocationPicker } from '../CustomerLocationPicker';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ZoneValidationResult } from '@/utils/deliveryZoneValidation';
import type { Database } from '@/integrations/supabase/types';

type DeliveryType = Database['public']['Enums']['delivery_type'];

interface DeliveryStepProps {
  deliveryType: DeliveryType;
  onDeliveryTypeChange: (type: DeliveryType) => void;
  customerAddress: string;
  onAddressChange: (address: string) => void;
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number | null, lng: number | null) => void;
  deliveryZoneInfo: ZoneValidationResult | null;
  onDeliveryZoneChange: (info: ZoneValidationResult | null) => void;
  deliveryFee: number;
  isScheduled: boolean;
  onScheduledChange: (scheduled: boolean) => void;
  selectedDate?: Date;
  onDateChange: (date?: Date) => void;
  selectedTime: string;
  onTimeChange: (time: string) => void;
  availableSlots: Date[];
  storeId: string;
  isServicePaused: boolean;
  scheduledOrdersEnabled: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}

export const DeliveryStep = ({
  deliveryType,
  onDeliveryTypeChange,
  customerAddress,
  onAddressChange,
  latitude,
  longitude,
  onLocationChange,
  deliveryZoneInfo,
  onDeliveryZoneChange,
  deliveryFee,
  isScheduled,
  onScheduledChange,
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  availableSlots,
  storeId,
  isServicePaused,
  scheduledOrdersEnabled,
  primaryColor = '#FF9500',
  secondaryColor
}: DeliveryStepProps) => {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  const finalDeliveryFee = deliveryType === 'delivery' 
    ? (deliveryZoneInfo?.deliveryFee ?? deliveryFee) 
    : 0;

  const deliveryOptions = [
    {
      value: 'delivery' as DeliveryType,
      icon: Bike,
      title: 'Receber no seu endereço',
      subtitle: customerAddress || 'Adicione seu endereço',
      fee: finalDeliveryFee,
      time: 'A definir'
    },
    {
      value: 'pickup' as DeliveryType,
      icon: Store,
      title: 'Retirar no estabelecimento',
      subtitle: 'Retire sem custo adicional',
      fee: 0,
      time: 'A definir'
    },
    {
      value: 'table' as DeliveryType,
      icon: UtensilsCrossed,
      title: 'Consumir no local',
      subtitle: 'Pedido direto na mesa',
      fee: 0,
      time: 'Imediato'
    }
  ];

  return (
    <>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-3">Como deseja receber?</h3>
          <div className="space-y-3">
            {deliveryOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = deliveryType === option.value;
              
              return (
                <Card
                  key={option.value}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isSelected ? "bg-primary/5" : ""
                  )}
                  style={{
                    borderWidth: '2px',
                    borderColor: isSelected ? primaryColor : 'hsl(var(--border))'
                  }}
                  onClick={() => onDeliveryTypeChange(option.value)}
                >
                  <div className="p-4 flex items-start gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Custom Radio Button */}
                      <div 
                        className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{
                          borderColor: isSelected ? primaryColor : 'hsl(var(--border))'
                        }}
                      >
                        {isSelected && (
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: primaryColor }}
                          />
                        )}
                      </div>
                      
                      <Icon 
                        className="w-5 h-5 flex-shrink-0" 
                        style={{ color: isSelected ? primaryColor : 'currentColor' }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{option.title}</p>
                        <p className="text-xs text-muted-foreground break-words line-clamp-2">{option.subtitle}</p>
                        
                        {option.value === 'delivery' && isSelected && customerAddress && (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs mt-1"
                            style={{ color: primaryColor }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowLocationPicker(true);
                            }}
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            Editar endereço
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold">
                        {option.fee > 0 ? `R$ ${option.fee.toFixed(2)}` : 'Grátis'}
                      </p>
                      <p className="text-xs text-muted-foreground">{option.time}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          
          {deliveryType === 'delivery' && !customerAddress && (
            <Button
              type="button"
              variant="outline"
              className="w-full mt-3"
              onClick={() => setShowLocationPicker(true)}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Adicionar endereço
            </Button>
          )}
        </div>

        {/* Agendamento - só mostra se habilitado e há slots disponíveis */}
        {scheduledOrdersEnabled && availableSlots.length > 0 && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">Quando deseja receber?</Label>
            
            <RadioGroup
              value={isScheduled ? 'scheduled' : 'asap'}
              onValueChange={(value) => onScheduledChange(value === 'scheduled')}
              disabled={isServicePaused}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all",
                  !isScheduled && !isServicePaused ? "bg-primary/5" : ""
                )}
                style={{
                  borderWidth: '2px',
                  borderColor: !isScheduled && !isServicePaused ? primaryColor : 'hsl(var(--border))',
                  opacity: isServicePaused ? 0.5 : 1
                }}
                onClick={() => !isServicePaused && onScheduledChange(false)}
              >
                <div className="p-4 flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                    style={{
                      borderColor: !isScheduled && !isServicePaused ? primaryColor : 'hsl(var(--border))'
                    }}
                  >
                    {!isScheduled && !isServicePaused && (
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: primaryColor }}
                      />
                    )}
                  </div>
                  <Zap className="w-5 h-5" style={{ color: !isScheduled ? primaryColor : 'currentColor' }} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">O mais rápido possível</p>
                    <p className="text-xs text-muted-foreground">Receba em breve</p>
                  </div>
                </div>
              </Card>

              <Card
                className={cn(
                  "cursor-pointer transition-all",
                  isScheduled ? "bg-primary/5" : ""
                )}
                style={{
                  borderWidth: '2px',
                  borderColor: isScheduled ? primaryColor : 'hsl(var(--border))'
                }}
                onClick={() => onScheduledChange(true)}
              >
                <div className="p-4 flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                    style={{
                      borderColor: isScheduled ? primaryColor : 'hsl(var(--border))'
                    }}
                  >
                    {isScheduled && (
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: primaryColor }}
                      />
                    )}
                  </div>
                  <Clock className="w-5 h-5" style={{ color: isScheduled ? primaryColor : 'currentColor' }} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Agendar para depois</p>
                    <p className="text-xs text-muted-foreground">Escolha data e horário</p>
                  </div>
                </div>
              </Card>
            </RadioGroup>

            {isScheduled && (
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-sm mb-2 block">Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione a data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={onDateChange}
                        locale={ptBR}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {selectedDate && availableSlots.length > 0 && (
                  <div>
                    <Label className="text-sm mb-2 block">Horário</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => {
                        const timeStr = format(slot, 'HH:mm');
                        const isSelected = selectedTime === timeStr;
                        
                        return (
                          <Button
                            key={timeStr}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                              "text-xs",
                              isSelected && "text-white"
                            )}
                            style={isSelected ? { backgroundColor: primaryColor } : {}}
                            onClick={() => onTimeChange(timeStr)}
                          >
                            {timeStr}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showLocationPicker && (
        <CustomerLocationPicker
          open={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          onLocationSelect={(data) => {
            onAddressChange(data.address);
            onLocationChange(data.latitude, data.longitude);
            if (data.zoneInfo) {
              onDeliveryZoneChange(data.zoneInfo);
            }
            setShowLocationPicker(false);
          }}
          storeId={storeId}
          initialCoords={latitude && longitude ? { latitude, longitude } : undefined}
        />
      )}
    </>
  );
};
