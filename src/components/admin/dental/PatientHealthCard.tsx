import { AlertTriangle, Heart, Pill, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PatientRecord } from "@/hooks/dental/usePatientRecord";

interface PatientHealthCardProps {
  record: PatientRecord | null | undefined;
  isLoading: boolean;
}

export function PatientHealthCard({ record, isLoading }: PatientHealthCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  const hasAllergies = record?.allergy_latex || record?.allergy_anesthesia || record?.allergy_penicillin || record?.allergies;
  const hasConditions = record?.has_diabetes || record?.has_hypertension || record?.has_heart_condition || 
                        record?.has_pacemaker || record?.has_bleeding_disorder || record?.has_hepatitis || 
                        record?.has_hiv || record?.is_pregnant || record?.is_breastfeeding;

  const allergies: string[] = [];
  if (record?.allergy_latex) allergies.push("Látex");
  if (record?.allergy_anesthesia) allergies.push("Anestésico");
  if (record?.allergy_penicillin) allergies.push("Penicilina");
  if (record?.allergies) allergies.push(record.allergies);

  const conditions: string[] = [];
  if (record?.has_diabetes) conditions.push("Diabetes");
  if (record?.has_hypertension) conditions.push("Hipertensão");
  if (record?.has_heart_condition) conditions.push("Cardiopatia");
  if (record?.has_pacemaker) conditions.push("Marcapasso");
  if (record?.has_bleeding_disorder) conditions.push("Distúrbio de Sangramento");
  if (record?.has_hepatitis) conditions.push("Hepatite");
  if (record?.has_hiv) conditions.push("HIV");
  if (record?.is_pregnant) conditions.push("Gestante");
  if (record?.is_breastfeeding) conditions.push("Lactante");

  if (!record && !hasAllergies && !hasConditions) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Alertas de Saúde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum alerta de saúde registrado. Complete o prontuário do paciente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={hasAllergies ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20" : ""}>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          {hasAllergies ? (
            <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
          ) : (
            <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          )}
          Alertas de Saúde
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 pt-0">
        {/* Allergies */}
        {hasAllergies && (
          <div>
            <p className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Alergias
            </p>
            <div className="flex flex-wrap gap-1">
              {allergies.map((allergy, index) => (
                <Badge key={index} variant="destructive" className="text-xs">
                  {allergy}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Medical Conditions */}
        {hasConditions && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Condições Médicas
            </p>
            <div className="flex flex-wrap gap-1">
              {conditions.map((condition, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {condition}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Current Medications */}
        {record?.current_medications && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Pill className="h-3 w-3" />
              Medicamentos em Uso
            </p>
            <p className="text-sm">{record.current_medications}</p>
          </div>
        )}

        {/* Blood Type */}
        {record?.blood_type && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Tipo Sanguíneo: <span className="font-medium text-foreground">{record.blood_type}</span></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
