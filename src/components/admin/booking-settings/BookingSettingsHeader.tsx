// Cabeçalho fixo com o botão de salvar.
// JSX movido da BookingSettingsPage sem mudança.
import { Button } from '@/components/ui/button';
import { Settings, Save, Loader2 } from 'lucide-react';


interface BookingSettingsHeaderProps {
  handleSave: () => void;
  isSaving: boolean;
}

export function BookingSettingsHeader({ handleSave, isSaving }: BookingSettingsHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-4 border-b mb-0">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações de Agendamento
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Defina como funcionam os agendamentos da sua loja</p>
      </div>
      <Button onClick={handleSave} disabled={isSaving} size="sm" className="h-9">
        {isSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
        Salvar alterações
      </Button>
    </div>
  );
}
