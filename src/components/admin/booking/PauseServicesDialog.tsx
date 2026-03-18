import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  PauseCircle,
  CalendarIcon,
  User,
  Building2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface Professional {
  id: string;
  name: string;
  is_active: boolean;
}

interface PauseServicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
  professionals: Professional[];
  onSuccess: () => void;
}

// Motivos rápidos
const QUICK_REASONS = [
  { label: 'Feriado', emoji: '🎉' },
  { label: 'Férias', emoji: '🏖️' },
  { label: 'Imprevisto', emoji: '⚠️' },
  { label: 'Consulta médica', emoji: '🏥' },
  { label: 'Folga', emoji: '😴' },
  { label: 'Recesso', emoji: '🏠' },
];

export function PauseServicesDialog({
  open,
  onOpenChange,
  storeId,
  professionals,
  onSuccess,
}: PauseServicesDialogProps) {
  const [tab, setTab] = useState<'professional' | 'company'>('professional');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [showConfirmCompany, setShowConfirmCompany] = useState(false);

  const activeProfessionals = professionals.filter((p) => p.is_active);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTab('professional');
      setSelectedProfessionalId('');
      setDateRange(undefined);
      setIsAllDay(true);
      setStartTime('08:00');
      setEndTime('18:00');
      setReason('');
    }
  }, [open]);

  // Calcula as datas selecionadas a partir do range
  const selectedDates = dateRange?.from
    ? dateRange.to
      ? eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
      : [dateRange.from]
    : [];

  const canSave =
    selectedDates.length > 0 &&
    (tab === 'company' || selectedProfessionalId) &&
    (!isAllDay ? startTime < endTime : true);

  const buildBlocks = (professionalIds: string[]) => {
    const blocks: Array<{
      professional_id: string;
      block_date: string;
      is_all_day: boolean;
      start_time: string | null;
      end_time: string | null;
      reason: string | null;
      store_id: string;
    }> = [];

    for (const profId of professionalIds) {
      for (const date of selectedDates) {
        blocks.push({
          professional_id: profId,
          block_date: format(date, 'yyyy-MM-dd'),
          is_all_day: isAllDay,
          start_time: isAllDay ? null : startTime,
          end_time: isAllDay ? null : endTime,
          reason: reason || null,
        });
      }
    }
    return blocks;
  };

  const handleSave = async () => {
    if (!storeId) return;

    // Se for empresa inteira, pede confirmação
    if (tab === 'company' && !showConfirmCompany) {
      setShowConfirmCompany(true);
      return;
    }

    setSaving(true);
    try {
      const professionalIds =
        tab === 'professional'
          ? [selectedProfessionalId]
          : activeProfessionals.map((p) => p.id);

      const blocks = buildBlocks(professionalIds);

      const { error } = await (supabase as any)
        .from('professional_blocks')
        .insert(blocks);

      if (error) throw error;

      const label =
        tab === 'professional'
          ? activeProfessionals.find((p) => p.id === selectedProfessionalId)?.name
          : 'toda a empresa';

      toast.success(
        `Serviços pausados para ${label} em ${selectedDates.length} dia(s)`
      );
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Erro ao pausar serviços:', err);
      toast.error('Erro ao pausar serviços. Tente novamente.');
    } finally {
      setSaving(false);
      setShowConfirmCompany(false);
    }
  };

  const selectedProfName =
    activeProfessionals.find((p) => p.id === selectedProfessionalId)?.name || '';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PauseCircle className="h-5 w-5 text-orange-500" />
              Pausar Serviços
            </DialogTitle>
            <DialogDescription>
              Bloqueie horários para profissionais individuais ou para toda a empresa
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as 'professional' | 'company')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="professional" className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                Profissional
              </TabsTrigger>
              <TabsTrigger value="company" className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                Empresa
              </TabsTrigger>
            </TabsList>

            {/* Tab Profissional */}
            <TabsContent value="professional" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Profissional</Label>
                <Select
                  value={selectedProfessionalId}
                  onValueChange={setSelectedProfessionalId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeProfessionals.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Tab Empresa */}
            <TabsContent value="company" className="space-y-4 mt-4">
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-700 dark:text-orange-400">
                      Pausa para toda a empresa
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      Todos os{' '}
                      <strong>{activeProfessionals.length}</strong> profissionais
                      ativos serão bloqueados nas datas selecionadas.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Campos comuns - Date picker */}
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Período</Label>
              <div className="border rounded-lg p-2">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  locale={ptBR}
                  disabled={{ before: new Date() }}
                  numberOfMonths={1}
                  className="rounded-md"
                />
              </div>
              {selectedDates.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedDates.length === 1
                    ? format(selectedDates[0], "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : `${selectedDates.length} dias selecionados: ${format(selectedDates[0], 'dd/MM')} a ${format(selectedDates[selectedDates.length - 1], 'dd/MM/yyyy')}`}
                </p>
              )}
            </div>

            {/* Dia inteiro vs horários */}
            <div className="flex items-center justify-between">
              <Label htmlFor="all-day" className="cursor-pointer">
                Dia inteiro
              </Label>
              <Switch
                id="all-day"
                checked={isAllDay}
                onCheckedChange={setIsAllDay}
              />
            </div>

            {!isAllDay && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="start-time">Início</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end-time">Fim</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Motivo */}
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {QUICK_REASONS.map((r) => (
                  <Badge
                    key={r.label}
                    variant={reason === r.label ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() =>
                      setReason((prev) => (prev === r.label ? '' : r.label))
                    }
                  >
                    {r.emoji} {r.label}
                  </Badge>
                ))}
              </div>
              <Textarea
                placeholder="Descreva o motivo da pausa..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <PauseCircle className="h-4 w-4 mr-1" />
              Pausar{' '}
              {tab === 'company'
                ? 'Empresa'
                : selectedProfName
                ? selectedProfName
                : 'Serviços'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação para pausa da empresa inteira */}
      <AlertDialog
        open={showConfirmCompany}
        onOpenChange={setShowConfirmCompany}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirmar pausa da empresa
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a bloquear{' '}
              <strong>{activeProfessionals.length}</strong> profissionais
              {isAllDay ? ' o dia inteiro' : ` das ${startTime} às ${endTime}`} em{' '}
              <strong>{selectedDates.length} dia(s)</strong>.
              {reason && (
                <>
                  <br />
                  Motivo: <strong>{reason}</strong>
                </>
              )}
              <br />
              <br />
              Clientes não poderão agendar nesses horários. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSave}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Sim, pausar empresa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
