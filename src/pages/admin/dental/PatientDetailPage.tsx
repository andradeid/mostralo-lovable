import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Phone, Mail, Calendar, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatient } from "@/hooks/dental/usePatients";
import { usePatientRecord } from "@/hooks/dental/usePatientRecord";
import { useClinicalNotes } from "@/hooks/dental/useClinicalNotes";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { PatientHealthCard } from "@/components/admin/dental/PatientHealthCard";
import { ClinicalNotesTimeline } from "@/components/admin/dental/ClinicalNotesTimeline";
import { ClinicalNoteFormDialog } from "@/components/admin/dental/ClinicalNoteFormDialog";
import { PatientRecordForm } from "@/components/admin/dental/PatientRecordForm";
import { OdontogramViewer } from "@/components/admin/dental/OdontogramViewer";
import { format, parseISO, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

export default function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { storeId } = useStoreAccess();
  const { data: patient, isLoading: patientLoading } = usePatient(patientId ?? null);
  const { record, isLoading: recordLoading } = usePatientRecord(patientId ?? null);
  const { notes, isLoading: notesLoading, createNote } = useClinicalNotes(patientId ?? null);
  
  const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);

  if (patientLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-2">Paciente não encontrado</h2>
        <p className="text-muted-foreground mb-4">O paciente solicitado não existe ou foi removido.</p>
        <Button onClick={() => navigate("/dashboard/dental/pacientes")}>
          Voltar para a lista
        </Button>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), parseISO(birthDate));
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/dental/pacientes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
          <p className="text-muted-foreground">Prontuário do paciente</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Edit className="h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar - Patient Info */}
        <div className="space-y-6">
          {/* Patient Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={patient.photo_url ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
                    {getInitials(patient.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">{patient.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {patient.birth_date && (
                    <span className="text-muted-foreground">
                      {calculateAge(patient.birth_date)} anos
                    </span>
                  )}
                  {!patient.is_active && (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {patient.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.phone}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                )}
                {patient.birth_date && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(patient.birth_date)}</span>
                  </div>
                )}
                {(patient.address_city || patient.address_state) && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {[patient.address_city, patient.address_state].filter(Boolean).join(" - ")}
                    </span>
                  </div>
                )}
              </div>

              {patient.health_insurance && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Convênio</p>
                  <p className="font-medium">{patient.health_insurance}</p>
                  {patient.health_insurance_number && (
                    <p className="text-sm text-muted-foreground">{patient.health_insurance_number}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Health Alerts */}
          <PatientHealthCard record={record} isLoading={recordLoading} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="notes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="notes">Evoluções</TabsTrigger>
              <TabsTrigger value="health">Saúde</TabsTrigger>
              <TabsTrigger value="odontogram">Odontograma</TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Notas Clínicas</h3>
                <Button size="sm" className="gap-2" onClick={() => setIsNoteFormOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Nova Nota
                </Button>
              </div>
              
              <ClinicalNotesTimeline notes={notes} isLoading={notesLoading} />
            </TabsContent>

            <TabsContent value="health" className="mt-6">
              <PatientRecordForm patientId={patientId ?? ""} record={record} />
            </TabsContent>

            <TabsContent value="odontogram" className="mt-6">
              <OdontogramViewer patientId={patientId ?? ""} storeId={storeId ?? ""} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Note Form Dialog */}
      <ClinicalNoteFormDialog 
        open={isNoteFormOpen} 
        onOpenChange={setIsNoteFormOpen}
        patientId={patientId ?? ""}
        onSubmit={async (data) => {
          await createNote.mutateAsync(data);
          setIsNoteFormOpen(false);
        }}
        isSubmitting={createNote.isPending}
      />
    </div>
  );
}
