// Destinatário da NF-e: CPF/CNPJ, nome, situação de IE (só CNPJ) e endereço completo.
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UFS } from '../../../../supabase/functions/_shared/fiscal-doc';
import { classifyDocument, type RecipientForm } from '@/lib/fiscal/documents';
import { FiscalField } from './FiscalField';

export function RecipientFields({ value, onChange }: { value: RecipientForm; onChange: (patch: Partial<RecipientForm>) => void }) {
  const isCnpj = classifyDocument(value.document) === 'cnpj';
  const input = (key: keyof RecipientForm, label: string, extra: Record<string, unknown> = {}, className = '') => (
    <FiscalField id={`nfe-${key}`} label={label} className={className}>
      <Input id={`nfe-${key}`} value={value[key]} onChange={(e) => onChange({ [key]: e.target.value })} {...extra} />
    </FiscalField>
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
      {input('document', 'CPF ou CNPJ', { inputMode: 'numeric', autoComplete: 'off' }, 'sm:col-span-3')}
      {input('name', isCnpj ? 'Razão social' : 'Nome', { maxLength: 60 }, 'sm:col-span-3')}
      {isCnpj && (
        <>
          <FiscalField id="nfe-ie-indicator" label="Inscrição estadual" className="sm:col-span-3">
            <Select value={value.ie_indicator} onValueChange={(v) => onChange({ ie_indicator: v as RecipientForm['ie_indicator'] })}>
              <SelectTrigger id="nfe-ie-indicator"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Contribuinte de ICMS (tem IE)</SelectItem>
                <SelectItem value="2">Isento de inscrição</SelectItem>
                <SelectItem value="9">Não contribuinte</SelectItem>
              </SelectContent>
            </Select>
          </FiscalField>
          {value.ie_indicator === '1' && input('inscricao_estadual', 'Número da IE', { inputMode: 'numeric' }, 'sm:col-span-3')}
        </>
      )}
      {input('cep', 'CEP', { inputMode: 'numeric' }, 'sm:col-span-2')}
      {input('logradouro', 'Rua / avenida', {}, 'sm:col-span-4')}
      {input('numero', 'Número', { placeholder: 'S/N' }, 'sm:col-span-2')}
      {input('complemento', 'Complemento', {}, 'sm:col-span-4')}
      {input('bairro', 'Bairro', {}, 'sm:col-span-3')}
      {input('municipio', 'Cidade', {}, 'sm:col-span-2')}
      <FiscalField id="nfe-uf" label="UF" className="sm:col-span-1">
        <Select value={value.uf} onValueChange={(v) => onChange({ uf: v })}>
          <SelectTrigger id="nfe-uf"><SelectValue placeholder="UF" /></SelectTrigger>
          <SelectContent>{UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
        </Select>
      </FiscalField>
      {input('email', 'E-mail (recebe a nota)', { type: 'email' }, 'sm:col-span-6')}
    </div>
  );
}
