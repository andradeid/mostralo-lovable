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
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 h-10 w-10 rounded-full ${config.color} flex items-center justify-center`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <Badge variant="outline" className="text-xs mb-1">
                        {config.label}
                      </Badge>
                      {note.title && (
                        <h4 className="font-semibold">{note.title}</h4>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(note.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>

                  {/* Tooth info */}
                  {note.tooth_number && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span>Dente: {note.tooth_number}</span>
                      {note.surfaces && <span>| Faces: {note.surfaces}</span>}
                    </div>
                  )}

                  {/* Content */}
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>

                  {/* Professional */}
                  {note.professional && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Por: {note.professional.name}
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
