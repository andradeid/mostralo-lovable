// Informações da conta EFI vinculada, com modo de edição para trocar a conta.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Zap, Check, Loader2, RefreshCw, Building2, User } from 'lucide-react';
import { formatAccountNumber, formatDisplayDocument } from "@/lib/onlinePayment/efiFormat";
import type { EfiAccount, StoreEfiData } from "@/hooks/onlinePayment/useEfiAccount";

interface Props {
  storeData: StoreEfiData;
  account: EfiAccount;
}

export function EfiAccountInfoCard({ storeData, account }: Props) {
  const {
    isEditing,
    setIsEditing,
    efiDocumentType,
    setEfiDocumentType,
    efiDocumentNumber,
    setEfiDocumentNumber,
    efiAccountNumber,
    setEfiAccountNumber,
    formatDocument,
    handleCancelEdit,
    handleLinkAccount,
    saving,
  } = account;

  return (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Informações da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  /* Modo Edição */
                  <div className="space-y-4">
                    {/* Tipo de documento */}
                    <div className="space-y-3">
                      <Label>Tipo de Documento do Titular *</Label>
                      <RadioGroup
                        value={efiDocumentType}
                        onValueChange={(v) => {
                          setEfiDocumentType(v as 'cpf' | 'cnpj');
                          setEfiDocumentNumber('');
                        }}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cpf" id="edit-cpf" />
                          <Label htmlFor="edit-cpf" className="flex items-center gap-1 cursor-pointer font-normal">
                            <User className="h-4 w-4" /> CPF
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cnpj" id="edit-cnpj" />
                          <Label htmlFor="edit-cnpj" className="flex items-center gap-1 cursor-pointer font-normal">
                            <Building2 className="h-4 w-4" /> CNPJ
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Número do documento */}
                    <div className="space-y-2">
                      <Label>{efiDocumentType.toUpperCase()} do Titular *</Label>
                      <Input
                        value={efiDocumentNumber}
                        onChange={(e) => setEfiDocumentNumber(formatDocument(e.target.value))}
                        placeholder={efiDocumentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                        maxLength={efiDocumentType === 'cpf' ? 14 : 18}
                        className="font-mono"
                      />
                    </div>

                    {/* Número da conta */}
                    <div className="space-y-2">
                      <Label>Número da Conta EFI *</Label>
                      <Input
                        value={efiAccountNumber}
                        onChange={(e) => setEfiAccountNumber(formatAccountNumber(e.target.value))}
                        placeholder="Ex: 1234567"
                        maxLength={10}
                        className="font-mono text-lg"
                      />
                    </div>

                    {/* Botões de ação */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={async () => {
                          if (await handleLinkAccount()) setIsEditing(false);
                        }}
                        disabled={saving || efiAccountNumber.length < 6 || efiDocumentNumber.replace(/\D/g, '').length < (efiDocumentType === 'cpf' ? 11 : 14)}
                        className="flex-1"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Modo Visualização */
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className="bg-green-500 mt-1">Ativo</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Taxa por Transação</p>
                        <p className="font-semibold">8,19%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo de Documento</p>
                        <p className="font-medium flex items-center gap-1 mt-1">
                          {storeData.efi_document_type === 'cnpj' ? (
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                          {storeData.efi_document_type?.toUpperCase() || 'CPF'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Documento do Titular</p>
                        <p className="font-mono text-sm mt-1">
                          {formatDisplayDocument(storeData.efi_document_number, storeData.efi_document_type)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Conta EFI</p>
                        <p className="font-mono text-lg">{storeData.efi_account_number}</p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Editar / Trocar Conta
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
  );
}
