import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { weekDays } from './constants';
import type { PromotionSectionProps } from './types';

export function PeriodSection({ formData, setFormData }: PromotionSectionProps) {
  return (
    <>
    {/* Período */}
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Período de Validade</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Data de Início *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.start_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.start_date ? format(formData.start_date, 'PP', { locale: ptBR }) : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.start_date}
                  onSelect={(date) => date && setFormData({ ...formData, start_date: date })}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Data de Término</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.end_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.end_date ? format(formData.end_date, 'PP', { locale: ptBR }) : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.end_date}
                  onSelect={(date) => setFormData({ ...formData, end_date: date })}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <Label>Dias Permitidos</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
            {weekDays.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${day.value}`}
                  checked={formData.allowed_days?.includes(day.value)}
                  onCheckedChange={(checked) => {
                    const current = formData.allowed_days || [];
                    setFormData({
                      ...formData,
                      allowed_days: checked
                        ? [...current, day.value]
                        : current.filter(d => d !== day.value)
                    });
                  }}
                />
                <label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">
                  {day.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_time">Hora Início</Label>
            <Input
              id="start_time"
              type="time"
              value={formData.start_time || ''}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value || undefined })}
            />
          </div>
          <div>
            <Label htmlFor="end_time">Hora Término</Label>
            <Input
              id="end_time"
              type="time"
              value={formData.end_time || ''}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value || undefined })}
            />
          </div>
        </div>
      </div>
    </Card>
    </>
  );
}
