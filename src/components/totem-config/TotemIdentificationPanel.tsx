import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { TotemConfig } from '@/hooks/useTotemConfig';

interface TotemIdentificationPanelProps {
  config: Partial<TotemConfig>;
  onChange: (updates: Partial<TotemConfig>) => void;
}

const identificationOptions = [
  { id: 'phone', label: 'Telefone' },
  { id: 'cpf', label: 'CPF' },
  { id: 'name', label: 'Nome' },
];

export function TotemIdentificationPanel({ config, onChange }: TotemIdentificationPanelProps) {
  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    const currentFields = config.identification_fields || ['phone'];
    const newFields = checked
      ? [...currentFields, fieldId]
      : currentFields.filter(f => f !== fieldId);
    onChange({ identification_fields: newFields });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Tipo de Identificação</Label>
        <Select
          value={config.identification_type || 'optional'}
          onValueChange={(value) => onChange({ identification_type: value as 'none' | 'optional' | 'required' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            <SelectItem value="optional">Opcional</SelectItem>
            <SelectItem value="required">Obrigatória</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {config.identification_type === 'none' && 'O cliente não precisará se identificar'}
          {config.identification_type === 'optional' && 'O cliente pode pular a identificação'}
          {config.identification_type === 'required' && 'O cliente deve se identificar para continuar'}
        </p>
      </div>

      {config.identification_type !== 'none' && (
        <div className="space-y-3">
          <Label>Campos de Identificação</Label>
          <div className="space-y-2">
            {identificationOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`field-${option.id}`}
                  checked={(config.identification_fields || ['phone']).includes(option.id)}
                  onCheckedChange={(checked) => handleFieldToggle(option.id, checked as boolean)}
                />
                <label
                  htmlFor={`field-${option.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
