import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  X, 
  Edit2, 
  Calendar, 
  PauseCircle,
  Save,
  AlertCircle,
  Check
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface BusinessHours {
  service_paused?: boolean;
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

type BusinessHoursKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface SpecialDay {
  id: string;
  date: string;
  name: string;
  open: string;
  close: string;
  closed: boolean;
}

interface BusinessHoursManagerProps {
  value: BusinessHours;
  onChange: (hours: BusinessHours) => void;
}

const weekDays = [
  { key: 'monday', label: 'Segunda-feira', short: 'Seg' },
  { key: 'tuesday', label: 'Terça-feira', short: 'Ter' },
  { key: 'wednesday', label: 'Quarta-feira', short: 'Qua' },
  { key: 'thursday', label: 'Quinta-feira', short: 'Qui' },
  { key: 'friday', label: 'Sexta-feira', short: 'Sex' },
  { key: 'saturday', label: 'Sábado', short: 'Sáb' },
  { key: 'sunday', label: 'Domingo', short: 'Dom' },
];

export function BusinessHoursManager({ value, onChange }: BusinessHoursManagerProps) {
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState('10:00');
  const [editClose, setEditClose] = useState('20:00');
  const [editClosed, setEditClosed] = useState(false);
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [showSpecialDayDialog, setShowSpecialDayDialog] = useState(false);
  const [newSpecialDay, setNewSpecialDay] = useState({
    date: '',
    name: '',
    open: '10:00',
    close: '20:00',
    closed: false
  });

  // Inicializar horários padrão se não existir
  useEffect(() => {
    if (Object.keys(value).length === 0) {
      const defaultHours: BusinessHours = {};
      weekDays.forEach(({ key }) => {
        defaultHours[key] = { open: '10:00', close: '20:00', closed: key === 'sunday' };
      });
      onChange(defaultHours);
    }
  }, []);

  const validateHours = (open: string, close: string): boolean => {
    const [openHour, openMin] = open.split(':').map(Number);
    const [closeHour, closeMin] = close.split(':').map(Number);
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    return closeMinutes > openMinutes;
  };

  const handleEditDay = (dayKey: string) => {
    const dayHours = (value as any)[dayKey] as DayHours | undefined || { open: '10:00', close: '20:00', closed: false };
    setEditingDay(dayKey);
    setEditOpen(dayHours.open);
    setEditClose(dayHours.close);
    setEditClosed(dayHours.closed);
  };

  const handleSaveDay = () => {
    if (!editingDay) return;

    if (!editClosed && !validateHours(editOpen, editClose)) {
      toast.error('Horário de fechamento deve ser após o horário de abertura');
      return;
    }

    const newHours = {
      ...value,
      [editingDay]: {
        open: editOpen,
        close: editClose,
        closed: editClosed
      }
    };

    onChange(newHours);
    setEditingDay(null);
    toast.success('Horário atualizado com sucesso!');
  };

  const handleAddSpecialDay = () => {
    if (!newSpecialDay.date || !newSpecialDay.name) {
      toast.error('Preencha a data e o nome do dia especial');
      return;
    }

    if (!newSpecialDay.closed && !validateHours(newSpecialDay.open, newSpecialDay.close)) {
      toast.error('Horário de fechamento deve ser após o horário de abertura');
      return;
    }

    const specialDay: SpecialDay = {
      id: `special-${Date.now()}`,
      ...newSpecialDay
    };

    setSpecialDays([...specialDays, specialDay]);
    setShowSpecialDayDialog(false);
    setNewSpecialDay({
      date: '',
      name: '',
      open: '10:00',
      close: '20:00',
      closed: false
    });
    toast.success('Dia especial adicionado!');
  };

  const removeSpecialDay = (id: string) => {
    setSpecialDays(specialDays.filter(day => day.id !== id));
    toast.success('Dia especial removido');
  };

  const getGroupedHours = () => {
    const groups: { [key: string]: string[] } = {};
    
    weekDays.forEach(({ key, label }) => {
      const dayHours = (value as any)[key] as DayHours | undefined || { open: '10:00', close: '20:00', closed: true };
      const hoursKey = dayHours.closed 
        ? 'CLOSED' 
        : `${dayHours.open}-${dayHours.close}`;
      
      if (!groups[hoursKey]) {
        groups[hoursKey] = [];
      }
      groups[hoursKey].push(label);
    });

    return groups;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Horário de Funcionamento
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Lista de Horários por Dia */}
        <div className="space-y-3">
          <div className="grid gap-2">
            {weekDays.map(({ key, label }) => {
              const dayHours = (value as any)[key] as DayHours | undefined || { open: '10:00', close: '20:00', closed: true };
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 md:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm md:text-base">{label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {dayHours.closed ? (
                        <Badge variant="secondary" className="text-xs">
                          Fechado
                        </Badge>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {dayHours.open} - {dayHours.close}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditDay(key)}
                    className="ml-2"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Exceções */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-semibold">Exceções e Configurações Especiais</h4>
          </div>

          {/* Dias Especiais */}
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setShowSpecialDayDialog(true)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Adicionar dias especiais / feriados
            </Button>

            {/* Lista de Dias Especiais */}
            {specialDays.length > 0 && (
              <div className="space-y-2">
                {specialDays.map((day) => (
                  <div
                    key={day.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{day.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        {day.closed ? ' - Fechado' : ` - ${day.open} às ${day.close}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSpecialDay(day.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pausar Serviço */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-start gap-3">
              <PauseCircle className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Pausar serviço temporariamente</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {value.service_paused ? 'Serviço pausado - pedidos desabilitados' : 'Desabilite temporariamente novos pedidos'}
                </p>
              </div>
            </div>
            <Switch
              checked={value.service_paused || false}
              onCheckedChange={(checked) => {
                onChange({
                  ...value,
                  service_paused: checked
                });
                toast.success(checked ? 'Serviço pausado' : 'Serviço retomado');
              }}
            />
          </div>
        </div>

        {/* Dialog de Edição de Dia */}
        <Dialog open={editingDay !== null} onOpenChange={(open) => !open && setEditingDay(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Horário</DialogTitle>
              <DialogDescription>
                Configure o horário de funcionamento para {weekDays.find(d => d.key === editingDay)?.label}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <Label htmlFor="closed-switch" className="text-sm font-medium">
                  Fechado neste dia
                </Label>
                <Switch
                  id="closed-switch"
                  checked={editClosed}
                  onCheckedChange={setEditClosed}
                />
              </div>

              {!editClosed && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm mb-2 block">Horário de Abertura</Label>
                    <Input
                      type="time"
                      value={editOpen}
                      onChange={(e) => setEditOpen(e.target.value)}
                      className="text-center"
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">Horário de Fechamento</Label>
                    <Input
                      type="time"
                      value={editClose}
                      onChange={(e) => setEditClose(e.target.value)}
                      className="text-center"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingDay(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveDay}>
                <Check className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Dia Especial */}
        <Dialog open={showSpecialDayDialog} onOpenChange={setShowSpecialDayDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Dia Especial</DialogTitle>
              <DialogDescription>
                Configure horários diferentes para feriados ou datas especiais
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm mb-2 block">Data</Label>
                <Input
                  type="date"
                  value={newSpecialDay.date}
                  onChange={(e) => setNewSpecialDay({ ...newSpecialDay, date: e.target.value })}
                />
              </div>
              
              <div>
                <Label className="text-sm mb-2 block">Nome do Dia</Label>
                <Input
                  placeholder="Ex: Natal, Ano Novo, Black Friday..."
                  value={newSpecialDay.name}
                  onChange={(e) => setNewSpecialDay({ ...newSpecialDay, name: e.target.value })}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <Label htmlFor="special-closed-switch" className="text-sm font-medium">
                  Fechado neste dia
                </Label>
                <Switch
                  id="special-closed-switch"
                  checked={newSpecialDay.closed}
                  onCheckedChange={(checked) => 
                    setNewSpecialDay({ ...newSpecialDay, closed: checked })
                  }
                />
              </div>

              {!newSpecialDay.closed && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm mb-2 block">Horário de Abertura</Label>
                    <Input
                      type="time"
                      value={newSpecialDay.open}
                      onChange={(e) => setNewSpecialDay({ ...newSpecialDay, open: e.target.value })}
                      className="text-center"
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">Horário de Fechamento</Label>
                    <Input
                      type="time"
                      value={newSpecialDay.close}
                      onChange={(e) => setNewSpecialDay({ ...newSpecialDay, close: e.target.value })}
                      className="text-center"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSpecialDayDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddSpecialDay}>
                <Check className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
