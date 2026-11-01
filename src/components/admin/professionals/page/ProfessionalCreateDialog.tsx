// Janela "Novo Profissional" (dados, comissão, WhatsApp e forma de acesso).
// JSX movido da ProfessionalsPage sem mudança.
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, CheckCircle2, Key } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProfessionalWhatsAppValidator } from '@/components/admin/booking/ProfessionalWhatsAppValidator';
import { ProfessionalPhotoUpload } from '@/components/admin/booking/ProfessionalPhotoUpload';
import type { ProfessionalDialogs } from '@/hooks/professionals/useProfessionalDialogs';
import type { ProfessionalEditor } from '@/hooks/professionals/useProfessionalEditor';

interface ProfessionalCreateDialogProps {
  dialogs: ProfessionalDialogs;
  editor: ProfessionalEditor;
  creatingProfessional: boolean;
}

export function ProfessionalCreateDialog({ dialogs, editor, creatingProfessional }: ProfessionalCreateDialogProps) {
  const { isCreateDialogOpen, setIsCreateDialogOpen } = dialogs;
  const { formData, setFormData, whatsappStatus, setWhatsappStatus, accessMode, setAccessMode, handleCreate } = editor;

  return (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Profissional</DialogTitle>
          <DialogDescription>
            Cadastre um novo profissional para realizar atendimentos
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome do profissional"
            />
          </div>
          <div>
            <Label htmlFor="email" className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              Email * <span className="text-xs text-muted-foreground">(para acesso ao portal)</span>
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="profissional@email.com"
            />
          </div>
          <div>
            <Label htmlFor="specialty">Especialidade</Label>
            <Input
              id="specialty"
              value={formData.specialty}
              onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
              placeholder="Ex: Barbeiro, Manicure, Veterinário"
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Breve descrição do profissional"
              rows={3}
            />
          </div>
          <ProfessionalPhotoUpload
            currentPhotoUrl={formData.photo_url}
            professionalName={formData.name}
            onPhotoChange={(url) => setFormData(prev => ({ ...prev, photo_url: url }))}
            disabled={creatingProfessional}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="commission_type">Tipo de Comissão</Label>
              <Select
                value={formData.commission_type}
                onValueChange={(value: 'percentage' | 'fixed') => 
                  setFormData(prev => ({ ...prev, commission_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentagem</SelectItem>
                  <SelectItem value="fixed">Valor Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="commission_value">
                {formData.commission_type === 'percentage' ? 'Porcentagem (%)' : 'Valor (R$)'}
              </Label>
              <Input
                id="commission_value"
                type="number"
                min="0"
                step={formData.commission_type === 'percentage' ? '1' : '0.01'}
                value={formData.commission_value}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  commission_value: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
          </div>

          <ProfessionalWhatsAppValidator
            phone={formData.phone}
            countryCode={formData.countryCode}
            onPhoneChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
            onCountryCodeChange={(countryCode) => setFormData(prev => ({ ...prev, countryCode }))}
            onStatusChange={setWhatsappStatus}
            status={whatsappStatus}
            disabled={creatingProfessional}
          />

          <div className="space-y-3 p-3 rounded-lg bg-muted/30 border">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Acesso ao painel do profissional</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccessMode('invite')}
                className={`text-left rounded-md border p-2.5 text-sm transition-colors ${accessMode === 'invite' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
              >
                <p className="font-medium">Enviar convite (recomendado)</p>
                <p className="text-xs text-muted-foreground">Ele recebe um link e cria a própria senha</p>
              </button>
              <button
                type="button"
                onClick={() => setAccessMode('password')}
                className={`text-left rounded-md border p-2.5 text-sm transition-colors ${accessMode === 'password' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
              >
                <p className="font-medium">Definir a senha agora</p>
                <p className="text-xs text-muted-foreground">Você cria e passa a senha para ele</p>
              </button>
            </div>
            {accessMode === 'password' && (
            <div className="grid gap-3">
              <div>
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password" autoComplete="new-password" data-1p-ignore data-lpignore="true"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <Input
                  id="confirmPassword"
                  type="password" autoComplete="new-password" data-1p-ignore data-lpignore="true"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Digite a senha novamente"
                />
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-destructive mt-1">As senhas não coincidem</p>
                )}
                {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Senhas coincidem
                  </p>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={creatingProfessional}>
            {creatingProfessional && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
