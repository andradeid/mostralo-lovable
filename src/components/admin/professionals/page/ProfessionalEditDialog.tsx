// Janela "Editar Profissional" (dados, comissão, WhatsApp e troca de senha).
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

interface ProfessionalEditDialogProps {
  dialogs: ProfessionalDialogs;
  editor: ProfessionalEditor;
  updatingProfessional: boolean;
}

export function ProfessionalEditDialog({ dialogs, editor, updatingProfessional }: ProfessionalEditDialogProps) {
  const { isEditDialogOpen, setIsEditDialogOpen, selectedProfessional } = dialogs;
  const { formData, setFormData, whatsappStatus, setWhatsappStatus, editPasswordData, setEditPasswordData, updatingPassword, handleEdit } = editor;

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Editar Profissional</DialogTitle>
          <DialogDescription>
            Atualize as informações do profissional
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          <div>
            <Label htmlFor="edit-name">Nome *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome do profissional"
            />
          </div>

          {formData.email && (
            <div>
              <Label htmlFor="edit-email" className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                Email de Acesso
              </Label>
              <Input
                id="edit-email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                O email de acesso não pode ser alterado após o cadastro
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="edit-specialty">Especialidade</Label>
            <Input
              id="edit-specialty"
              value={formData.specialty}
              onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
              placeholder="Ex: Barbeiro, Manicure, Veterinário"
            />
          </div>
          <div>
            <Label htmlFor="edit-description">Descrição</Label>
            <Textarea
              id="edit-description"
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
            disabled={updatingProfessional}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-commission_type">Tipo de Comissão</Label>
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
              <Label htmlFor="edit-commission_value">
                {formData.commission_type === 'percentage' ? 'Porcentagem (%)' : 'Valor (R$)'}
              </Label>
              <Input
                id="edit-commission_value"
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
            disabled={updatingProfessional || updatingPassword}
          />

          {selectedProfessional?.user_id && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Alterar Senha (Opcional)</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Deixe em branco para manter a senha atual
              </p>
              <div className="grid gap-3">
                <div>
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password" autoComplete="new-password" data-1p-ignore data-lpignore="true"
                    value={editPasswordData.newPassword}
                    onChange={(e) => setEditPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmNewPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password" autoComplete="new-password" data-1p-ignore data-lpignore="true"
                    value={editPasswordData.confirmNewPassword}
                    onChange={(e) => setEditPasswordData(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                    placeholder="Digite a nova senha novamente"
                  />
                  {editPasswordData.newPassword && editPasswordData.confirmNewPassword && editPasswordData.newPassword !== editPasswordData.confirmNewPassword && (
                    <p className="text-xs text-destructive mt-1">As senhas não coincidem</p>
                  )}
                  {editPasswordData.newPassword && editPasswordData.confirmNewPassword && editPasswordData.newPassword === editPasswordData.confirmNewPassword && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Senhas coincidem
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleEdit} disabled={updatingProfessional}>
            {updatingProfessional && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
