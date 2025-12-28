import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, Save, Loader2 } from "lucide-react";
import { useProfessionalData, useProfessionalSchedules } from "@/hooks/useProfessionalData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

interface ScheduleForm {
  [key: number]: {
    is_available: boolean;
    start_time: string;
    end_time: string;
    break_start: string | null;
    break_end: string | null;
  };
}

export default function ProfessionalSchedule() {
  const queryClient = useQueryClient();
  const { data: professional } = useProfessionalData();
  const { data: schedules, isLoading } = useProfessionalSchedules(professional?.id);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<ScheduleForm>(() => {
    const initial: ScheduleForm = {};
    DAYS_OF_WEEK.forEach(day => {
      initial[day.value] = {
        is_available: day.value >= 1 && day.value <= 5, // Seg-Sex
        start_time: "09:00",
        end_time: "18:00",
        break_start: "12:00",
        break_end: "13:00",
      };
    });
    return initial;
  });

  // Atualizar form quando schedules carregarem
  useState(() => {
    if (schedules && schedules.length > 0) {
      const updated = { ...formData };
      schedules.forEach((schedule: any) => {
        updated[schedule.day_of_week] = {
          is_available: schedule.is_available,
          start_time: schedule.start_time?.slice(0, 5) || "09:00",
          end_time: schedule.end_time?.slice(0, 5) || "18:00",
          break_start: schedule.break_start?.slice(0, 5) || null,
          break_end: schedule.break_end?.slice(0, 5) || null,
        };
      });
      setFormData(updated);
    }
  });

  const handleToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        is_available: !prev[day].is_available,
      },
    }));
  };

  const handleTimeChange = (day: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value || null,
      },
    }));
  };

  const handleSave = async () => {
    if (!professional?.id) return;
    
    setSaving(true);
    try {
      // Deletar schedules existentes
      await supabase
        .from("professional_schedules")
        .delete()
        .eq("professional_id", professional.id);

      // Inserir novos
      const schedulesToInsert = DAYS_OF_WEEK.map(day => ({
        professional_id: professional.id,
        day_of_week: day.value,
        is_available: formData[day.value].is_available,
        start_time: formData[day.value].start_time,
        end_time: formData[day.value].end_time,
        break_start: formData[day.value].break_start,
        break_end: formData[day.value].break_end,
      }));

      const { error } = await supabase
        .from("professional_schedules")
        .insert(schedulesToInsert);

      if (error) throw error;

      toast.success("Horários salvos com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["professional-schedules"] });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar horários");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus Horários</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horários de Atendimento
          </CardTitle>
          <CardDescription>
            Configure os dias e horários em que você está disponível para atendimento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day.value}
              className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border"
            >
              <div className="flex items-center justify-between md:w-48">
                <Label className="font-medium">{day.label}</Label>
                <Switch
                  checked={formData[day.value].is_available}
                  onCheckedChange={() => handleToggle(day.value)}
                />
              </div>

              {formData[day.value].is_available && (
                <div className="flex flex-wrap gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground w-14">Início:</Label>
                    <Input
                      type="time"
                      value={formData[day.value].start_time}
                      onChange={(e) => handleTimeChange(day.value, "start_time", e.target.value)}
                      className="w-28"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground w-10">Fim:</Label>
                    <Input
                      type="time"
                      value={formData[day.value].end_time}
                      onChange={(e) => handleTimeChange(day.value, "end_time", e.target.value)}
                      className="w-28"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Intervalo:</Label>
                    <Input
                      type="time"
                      value={formData[day.value].break_start || ""}
                      onChange={(e) => handleTimeChange(day.value, "break_start", e.target.value)}
                      className="w-28"
                      placeholder="Início"
                    />
                    <span>-</span>
                    <Input
                      type="time"
                      value={formData[day.value].break_end || ""}
                      onChange={(e) => handleTimeChange(day.value, "break_end", e.target.value)}
                      className="w-28"
                      placeholder="Fim"
                    />
                  </div>
                </div>
              )}

              {!formData[day.value].is_available && (
                <p className="text-sm text-muted-foreground italic">Não disponível</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
