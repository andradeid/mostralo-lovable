import { FileText, Stethoscope, Pill, ClipboardList, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClinicalNote } from "@/hooks/dental/useClinicalNotes";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClinicalNotesTimelineProps {
  notes: ClinicalNote[];
  isLoading: boolean;
}

const noteTypeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  evolution: { label: "Evolução", icon: FileText, color: "bg-blue-500" },
  observation: { label: "Observação", icon: ClipboardList, color: "bg-gray-500" },
  procedure: { label: "Procedimento", icon: Stethoscope, color: "bg-green-500" },
  prescription: { label: "Prescrição", icon: Pill, color: "bg-purple-500" },
  initial_exam: { label: "Exame Inicial", icon: ClipboardList, color: "bg-orange-500" },
};

export function ClinicalNotesTimeline({ notes, isLoading }: ClinicalNotesTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma nota clínica</h3>
          <p className="text-muted-foreground text-center">
            As notas clínicas e evoluções do paciente aparecerão aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => {
        const config = noteTypeConfig[note.note_type] ?? noteTypeConfig.evolution;
        const Icon = config.icon;

        return (
          <Card key={note.id} className="relative">
            <CardContent className="p-3 sm:p-4">
              <div className="flex gap-3 sm:gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full ${config.color} flex items-center justify-center`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 mb-1">
                    <div>
                      <Badge variant="outline" className="text-[10px] sm:text-xs mb-1">
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">
                        {format(parseISO(note.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <span className="sm:hidden">
                        {format(parseISO(note.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-xs sm:text-sm whitespace-pre-wrap">{note.content}</p>

                  {/* Professional */}
                  {note.created_by_name && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                      Por: {note.created_by_name}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
